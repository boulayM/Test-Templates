import request from "supertest";
import bcrypt from "bcryptjs";
import prisma from "../../src/config/prisma.js";

process.env.DISABLE_RATE_LIMIT = "true";

let app;

const userPassword = "User123!";
const userEmail = "review_user@test.local";

async function ensureUser() {
  const hash = await bcrypt.hash(userPassword, 10);
  await prisma.user.upsert({
    where: { email: userEmail },
    update: {
      firstName: "Review",
      lastName: "User",
      passwordHash: hash,
      role: "USER",
      emailVerified: true,
      isActive: true
    },
    create: {
      firstName: "Review",
      lastName: "User",
      email: userEmail,
      passwordHash: hash,
      role: "USER",
      emailVerified: true,
      isActive: true
    }
  });
}

async function loginUser() {
  const agent = request.agent(app);
  const res = await agent.post("/api/auth/login").send({
    email: userEmail,
    password: userPassword
  });
  expect(res.status).toBe(200);
  return { agent };
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
    await ensureUser();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("rejects review when product was not purchased", async () => {
    const { agent } = await loginUser();
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
    const { agent } = await loginUser();
    const user = await prisma.user.findUnique({ where: { email: userEmail } });

    const product = await prisma.product.create({
      data: {
        name: "Purchased Product",
        slug: "purchased-" + Date.now(),
        description: "Purchased",
        priceCents: 2500,
        currency: "EUR",
        sku: "PP-" + Date.now(),
        isActive: true
      }
    });

    const shipping = await prisma.address.create({
      data: {
        userId: user.id,
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
        userId: user.id,
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

    const first = await agent.post("/api/public/reviews").send({
      productId: product.id,
      rating: 4,
      comment: "Good"
    });
    expect(first.status).toBe(201);

    const second = await agent.post("/api/public/reviews").send({
      productId: product.id,
      rating: 5,
      comment: "Duplicate"
    });
    expect(second.status).toBe(409);
  });
});
