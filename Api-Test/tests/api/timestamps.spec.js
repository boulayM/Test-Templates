import request from "supertest";
import bcrypt from "bcryptjs";
import prisma from "../../src/config/prisma.js";

process.env.DISABLE_RATE_LIMIT = "true";

let app;

const stamp = Date.now();
const adminEmail = process.env.ADMIN_EMAIL || "admin@example.com";
const adminPassword = process.env.ADMIN_PASSWORD || "Admin123!";
const userEmail = "timestamps_user_" + stamp + "@test.local";
const userPassword = "User123!";

async function upsertUser(email, role, password = userPassword) {
  const hash = await bcrypt.hash(password, 10);
  return prisma.user.upsert({
    where: { email },
    update: {
      firstName: role,
      lastName: "Timestamps",
      passwordHash: hash,
      role,
      emailVerified: true,
      isActive: true
    },
    create: {
      firstName: role,
      lastName: "Timestamps",
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
  const res = await agent.post("/api/auth/login").send({ email, password });
  expect(res.status).toBe(200);
  return agent;
}

async function sleep(ms) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

describe("timestamps", () => {
  let customerId;

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
    const customer = await upsertUser(userEmail, "USER");
    customerId = customer.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  test("product timestamps: createdAt is stable and updatedAt changes on update", async () => {
    const adminAgent = await login(adminEmail, adminPassword);
    const categoryRes = await adminAgent.post("/api/admin/categories").send({
      name: "TS Category " + stamp,
      slug: "ts-category-" + stamp
    });
    expect(categoryRes.status).toBe(201);

    const productRes = await adminAgent.post("/api/admin/products").send({
      name: "TS Product " + stamp,
      slug: "ts-product-" + stamp,
      description: "before",
      priceCents: 1000,
      currency: "EUR",
      sku: "TS-SKU-" + stamp,
      isActive: true,
      categoryIds: [categoryRes.body.category.id]
    });
    expect(productRes.status).toBe(201);
    const productId = productRes.body.product.id;

    const before = await prisma.product.findUnique({ where: { id: productId } });
    await sleep(20);

    const updateRes = await adminAgent.patch("/api/admin/products/" + productId).send({
      description: "after"
    });
    expect(updateRes.status).toBe(200);

    const after = await prisma.product.findUnique({ where: { id: productId } });
    expect(new Date(after.createdAt).toISOString()).toBe(new Date(before.createdAt).toISOString());
    expect(new Date(after.updatedAt).getTime()).toBeGreaterThan(new Date(before.updatedAt).getTime());
  });

  test("address timestamps: createdAt is stable and updatedAt changes on update", async () => {
    const userAgent = await login(userEmail, userPassword);

    const createRes = await userAgent.post("/api/public/addresses").send({
      label: "Home",
      fullName: "Timestamp User",
      phone: "0600000000",
      line1: "10 rue test",
      line2: null,
      postalCode: "75000",
      city: "Paris",
      country: "FR",
      isDefault: true
    });
    expect(createRes.status).toBe(201);
    const addressId = createRes.body.address.id;

    const before = await prisma.address.findUnique({ where: { id: addressId } });
    await sleep(20);

    const updateRes = await userAgent.patch("/api/public/addresses/" + addressId).send({
      city: "Lyon"
    });
    expect(updateRes.status).toBe(200);

    const after = await prisma.address.findUnique({ where: { id: addressId } });
    expect(new Date(after.createdAt).toISOString()).toBe(new Date(before.createdAt).toISOString());
    expect(new Date(after.updatedAt).getTime()).toBeGreaterThan(new Date(before.updatedAt).getTime());
  });

  test("order timestamps: updatedAt changes after status transition", async () => {
    const adminAgent = await login(adminEmail, adminPassword);
    const userAgent = await login(userEmail, userPassword);

    const nonce = Date.now();
    const categoryRes = await adminAgent.post("/api/admin/categories").send({
      name: "Order TS Cat " + nonce,
      slug: "order-ts-cat-" + nonce
    });
    expect(categoryRes.status).toBe(201);

    const productRes = await adminAgent.post("/api/admin/products").send({
      name: "Order TS Product " + nonce,
      slug: "order-ts-product-" + nonce,
      description: "Order TS",
      priceCents: 2000,
      currency: "EUR",
      sku: "ORDER-TS-SKU-" + nonce,
      isActive: true,
      categoryIds: [categoryRes.body.category.id]
    });
    expect(productRes.status).toBe(201);
    const productId = productRes.body.product.id;

    const inventoryRes = await adminAgent.post("/api/admin/inventory").send({
      productId,
      quantity: 10,
      reserved: 0
    });
    expect(inventoryRes.status).toBe(201);

    const address = await prisma.address.create({
      data: {
        userId: customerId,
        label: "Order",
        fullName: "Timestamp User",
        phone: "0600000001",
        line1: "1 route ordre",
        line2: null,
        postalCode: "69000",
        city: "Lyon",
        country: "FR",
        isDefault: false
      }
    });

    const addCart = await userAgent.post("/api/public/cart/items").send({
      productId,
      quantity: 1
    });
    expect(addCart.status).toBe(201);

    const orderRes = await userAgent.post("/api/public/orders").send({
      shippingAddressId: address.id,
      billingAddressId: address.id
    });
    expect(orderRes.status).toBe(201);
    const orderId = orderRes.body.order.id;

    const before = await prisma.order.findUnique({ where: { id: orderId } });
    await sleep(20);

    const patchRes = await adminAgent.patch("/api/admin/orders/" + orderId + "/status").send({
      status: "CANCELLED"
    });
    expect(patchRes.status).toBe(200);

    const after = await prisma.order.findUnique({ where: { id: orderId } });
    expect(new Date(after.updatedAt).getTime()).toBeGreaterThan(new Date(before.updatedAt).getTime());
  });
});

