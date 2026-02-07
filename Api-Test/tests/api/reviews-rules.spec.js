import request from "supertest";
import bcrypt from "bcryptjs";
import prisma from "../../src/config/prisma.js";

process.env.DISABLE_RATE_LIMIT = "true";

let app;

const stamp = Date.now();
const adminEmail = process.env.ADMIN_EMAIL || "admin@example.com";
const adminPassword = process.env.ADMIN_PASSWORD || "Admin123!";
const userPassword = "User123!";
const userEmail = "review_user_" + stamp + "@test.local";
const otherUserEmail = "review_other_" + stamp + "@test.local";

async function upsertUser(email, role, password = userPassword) {
  const hash = await bcrypt.hash(password, 10);
  await prisma.user.upsert({
    where: { email },
    update: {
      firstName: "Review",
      lastName: "User",
      passwordHash: hash,
      role,
      emailVerified: true,
      isActive: true
    },
    create: {
      firstName: "Review",
      lastName: "User",
      email,
      passwordHash: hash,
      role,
      emailVerified: true,
      isActive: true
    }
  });
}

async function login(email, password) {
  const agent = request.agent(app);
  const res = await agent.post("/api/auth/login").send({
    email,
    password
  });
  expect(res.status).toBe(200);
  return { agent };
}

async function createPurchasedReview(userId, comment = "initial comment") {
  const nonce = Date.now() + "-" + Math.floor(Math.random() * 100000);
  const product = await prisma.product.create({
    data: {
      name: "Reviewed Product " + nonce,
      slug: "reviewed-product-" + nonce,
      description: "Purchased",
      priceCents: 2500,
      currency: "EUR",
      sku: "REV-" + nonce,
      isActive: true
    }
  });

  const shipping = await prisma.address.create({
    data: {
      userId,
      label: "Home",
      fullName: "Review User",
      phone: "0600000000",
      line1: "1 rue test",
      postalCode: "75000",
      city: "Paris",
      country: "FR",
      isDefault: true
    }
  });

  const order = await prisma.order.create({
    data: {
      userId,
      shippingAddressId: shipping.id,
      billingAddressId: shipping.id,
      status: "PAID",
      subtotalCents: 2500,
      shippingCents: 0,
      discountCents: 0,
      totalCents: 2500,
      currency: "EUR"
    }
  });

  await prisma.orderItem.create({
    data: {
      orderId: order.id,
      productId: product.id,
      productName: product.name,
      productSku: product.sku,
      quantity: 1,
      unitPriceCents: product.priceCents,
      currency: product.currency
    }
  });

  const review = await prisma.review.create({
    data: {
      userId,
      productId: product.id,
      rating: 4,
      comment
    }
  });

  return { product, review };
}

describe("review rules", () => {
  beforeAll(async () => {
    const mod = await import("../../src/app.js");
    app = mod.default;

    await prisma.orderCoupon.deleteMany();
    await prisma.shipment.deleteMany();
    await prisma.payment.deleteMany();
    await prisma.orderItem.deleteMany();
    await prisma.order.deleteMany();
    await prisma.cartItem.deleteMany();
    await prisma.cart.deleteMany();
    await prisma.review.deleteMany();
    await prisma.inventory.deleteMany();
    await prisma.productImage.deleteMany();
    await prisma.productCategory.deleteMany();
    await prisma.product.deleteMany();
    await prisma.category.deleteMany();
    await prisma.address.deleteMany();
    await prisma.coupon.deleteMany();
    await prisma.refreshToken.deleteMany();
    await prisma.verificationToken.deleteMany();
    await prisma.user.deleteMany();

    await upsertUser(adminEmail, "ADMIN", adminPassword);
    await upsertUser(userEmail, "USER");
    await upsertUser(otherUserEmail, "USER");
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("rejects review when product was not purchased", async () => {
    const { agent } = await login(userEmail, userPassword);
    const product = await prisma.product.create({
      data: {
        name: "Not Purchased",
        slug: "not-purchased-" + Date.now(),
        description: "No purchase",
        priceCents: 1200,
        currency: "EUR",
        sku: "NP-" + Date.now(),
        isActive: true
      }
    });

    const res = await agent.post("/api/public/reviews").send({
      productId: product.id,
      rating: 5,
      comment: "Should fail"
    });

    expect(res.status).toBe(403);
  });

  it("allows one review when product was purchased and blocks duplicate", async () => {
    const { agent } = await login(userEmail, userPassword);
    const user = await prisma.user.findUnique({ where: { email: userEmail } });
    const { product } = await createPurchasedReview(user.id, "Good");

    const second = await agent.post("/api/public/reviews").send({
      productId: product.id,
      rating: 5,
      comment: "Duplicate"
    });
    expect(second.status).toBe(409);
  });

  it("updates own review", async () => {
    const { agent } = await login(userEmail, userPassword);
    const user = await prisma.user.findUnique({ where: { email: userEmail } });
    const { review } = await createPurchasedReview(user.id, "to update");

    const res = await agent.patch("/api/public/reviews/" + review.id).send({
      rating: 5,
      comment: "updated"
    });
    expect(res.status).toBe(200);
    expect(res.body.review.rating).toBe(5);
    expect(res.body.review.comment).toBe("updated");
  });

  it("rejects update/delete on review owned by another user", async () => {
    const { agent: ownerAgent } = await login(userEmail, userPassword);
    const { agent: otherAgent } = await login(otherUserEmail, userPassword);
    const owner = await prisma.user.findUnique({ where: { email: userEmail } });
    const { review } = await createPurchasedReview(owner.id, "owner review");

    const upd = await otherAgent.patch("/api/public/reviews/" + review.id).send({
      comment: "hijack"
    });
    expect(upd.status).toBe(404);

    const del = await otherAgent.delete("/api/public/reviews/" + review.id);
    expect(del.status).toBe(404);

    const stillThere = await ownerAgent.get("/api/public/reviews").query({ productId: review.productId });
    expect(stillThere.status).toBe(200);
    expect(stillThere.body.data.some((r) => r.id === review.id)).toBe(true);
  });

  it("deletes own review", async () => {
    const { agent } = await login(userEmail, userPassword);
    const user = await prisma.user.findUnique({ where: { email: userEmail } });
    const { review } = await createPurchasedReview(user.id, "to delete");

    const del = await agent.delete("/api/public/reviews/" + review.id);
    expect(del.status).toBe(200);

    const found = await prisma.review.findUnique({ where: { id: review.id } });
    expect(found).toBeNull();
  });

  it("admin can moderate and delete a review", async () => {
    const { agent: adminAgent } = await login(adminEmail, adminPassword);
    const user = await prisma.user.findUnique({ where: { email: userEmail } });
    const { review } = await createPurchasedReview(user.id, "for moderation");

    const del = await adminAgent.delete("/api/admin/reviews/" + review.id);
    expect(del.status).toBe(200);

    const found = await prisma.review.findUnique({ where: { id: review.id } });
    expect(found).toBeNull();
  });
});
