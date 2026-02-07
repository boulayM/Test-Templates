import request from "supertest";
import bcrypt from "bcryptjs";
import prisma from "../../src/config/prisma.js";

process.env.DISABLE_RATE_LIMIT = "true";

let app;

const userEmail = "public_user_" + Date.now() + "@test.local";
const userPassword = "User123!";

async function ensureUser() {
  const hash = await bcrypt.hash(userPassword, 10);
  await prisma.user.upsert({
    where: { email: userEmail },
    update: {
      firstName: "Public",
      lastName: "User",
      passwordHash: hash,
      role: "USER",
      emailVerified: true,
      isActive: true
    },
    create: {
      firstName: "Public",
      lastName: "User",
      email: userEmail,
      passwordHash: hash,
      role: "USER",
      emailVerified: true,
      isActive: true
    }
  });
}

async function seedCatalog() {
  const category = await prisma.category.create({
    data: {
      name: "Cat Public " + Date.now(),
      slug: "cat-public-" + Date.now()
    }
  });
  const product = await prisma.product.create({
    data: {
      name: "Product Public",
      slug: "product-public-" + Date.now(),
      description: "desc",
      priceCents: 1000,
      currency: "EUR",
      sku: "SKU-PUBLIC-" + Date.now(),
      isActive: true
    }
  });
  await prisma.productCategory.create({
    data: { productId: product.id, categoryId: category.id }
  });
  await prisma.inventory.create({
    data: { productId: product.id, quantity: 10, reserved: 0 }
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

describe("public api", () => {
  beforeAll(async () => {
    const mod = await import("../../src/app.js");
    app = mod.default;

    await prisma.orderCoupon.deleteMany();
    await prisma.payment.deleteMany();
    await prisma.shipment.deleteMany();
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
    await seedCatalog();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  test("public list endpoints", async () => {
    const res1 = await request(app).get("/api/public/categories");
    expect(res1.status).toBe(200);

    const res2 = await request(app).get("/api/public/products");
    expect(res2.status).toBe(200);

    const res3 = await request(app).get("/api/public/inventory");
    expect(res3.status).toBe(200);

    const res4 = await request(app).get("/api/public/reviews");
    expect(res4.status).toBe(200);
  });

  test("coupon validate requires code", async () => {
    const res = await request(app).get("/api/public/coupons/validate");
    expect(res.status).toBe(400);
  });

  test("auth endpoints require login", async () => {
    const res1 = await request(app).get("/api/public/cart");
    expect(res1.status).toBe(401);

    const res2 = await request(app).get("/api/public/orders");
    expect(res2.status).toBe(401);

    const res3 = await request(app).get("/api/public/addresses");
    expect(res3.status).toBe(401);
  });

  test("auth endpoints work when logged in", async () => {
    const { agent } = await loginUser();

    const cart = await agent.get("/api/public/cart");
    expect(cart.status).toBe(200);

    const orders = await agent.get("/api/public/orders");
    expect(orders.status).toBe(200);

    const addresses = await agent.get("/api/public/addresses");
    expect(addresses.status).toBe(200);

    const payments = await agent.get("/api/public/payments");
    expect(payments.status).toBe(200);

    const shipments = await agent.get("/api/public/shipments");
    expect(shipments.status).toBe(200);
  });
});
