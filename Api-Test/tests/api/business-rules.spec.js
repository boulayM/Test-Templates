import request from "supertest";
import bcrypt from "bcryptjs";
import prisma from "../../src/config/prisma.js";

process.env.DISABLE_RATE_LIMIT = "true";

let app;

const adminEmail = process.env.ADMIN_EMAIL || "admin@example.com";
const adminPassword = process.env.ADMIN_PASSWORD || "Admin123!";
const userEmail = "rules_user_" + Date.now() + "@test.local";
const userPassword = "User123!";

async function ensureUsers() {
  const adminHash = await bcrypt.hash(adminPassword, 10);
  const userHash = await bcrypt.hash(userPassword, 10);

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      firstName: "Admin",
      lastName: "Root",
      passwordHash: adminHash,
      role: "ADMIN",
      emailVerified: true,
      isActive: true
    },
    create: {
      firstName: "Admin",
      lastName: "Root",
      email: adminEmail,
      passwordHash: adminHash,
      role: "ADMIN",
      emailVerified: true,
      isActive: true
    }
  });

  await prisma.user.upsert({
    where: { email: userEmail },
    update: {
      firstName: "Rules",
      lastName: "User",
      passwordHash: userHash,
      role: "USER",
      emailVerified: true,
      isActive: true
    },
    create: {
      firstName: "Rules",
      lastName: "User",
      email: userEmail,
      passwordHash: userHash,
      role: "USER",
      emailVerified: true,
      isActive: true
    }
  });
}

async function login(email, password) {
  const agent = request.agent(app);
  const res = await agent.post("/api/auth/login").send({ email, password });
  expect(res.status).toBe(200);
  return { agent, csrfToken: res.body.csrfToken };
}

async function seedProductForUser(userId) {
  const category = await prisma.category.create({
    data: {
      name: "Rules Cat " + Date.now(),
      slug: "rules-cat-" + Date.now()
    }
  });
  const product = await prisma.product.create({
    data: {
      name: "Rules Product",
      slug: "rules-product-" + Date.now(),
      description: "desc",
      priceCents: 1500,
      currency: "EUR",
      sku: "RULES-SKU-" + Date.now(),
      isActive: true
    }
  });
  await prisma.productCategory.create({
    data: { productId: product.id, categoryId: category.id }
  });
  await prisma.inventory.create({
    data: { productId: product.id, quantity: 20, reserved: 0 }
  });
  const address = await prisma.address.create({
    data: {
      userId,
      label: "Maison",
      fullName: "Rules User",
      phone: "0600000000",
      line1: "1 rue test",
      line2: null,
      postalCode: "75000",
      city: "Paris",
      country: "FR",
      isDefault: true
    }
  });
  return { product, address };
}

async function createOrderFlow(userAgent, productId, addressId, couponCode = null) {
  const add = await userAgent.post("/api/public/cart/items").send({
    productId,
    quantity: 2
  });
  expect(add.status).toBe(201);

  const payload = {
    shippingAddressId: addressId,
    billingAddressId: addressId
  };
  if (couponCode) payload.couponCode = couponCode;

  const orderRes = await userAgent.post("/api/public/orders").send(payload);
  expect(orderRes.status).toBe(201);
  return orderRes.body.order;
}

describe("business rules", () => {
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

    await ensureUsers();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  test("shipment creation is blocked when order is not paid", async () => {
    const user = await prisma.user.findUnique({ where: { email: userEmail } });
    const { product, address } = await seedProductForUser(user.id);
    const { agent: userAgent } = await login(userEmail, userPassword);
    const order = await createOrderFlow(userAgent, product.id, address.id);

    const { agent: adminAgent } = await login(adminEmail, adminPassword);
    const res = await adminAgent.post("/api/admin/shipments").send({
      orderId: order.id,
      carrier: "DHL",
      trackingNumber: "TRACK-1"
    });

    expect(res.status).toBe(400);
  });

  test("cancelling an order releases reserved stock", async () => {
    const user = await prisma.user.findUnique({ where: { email: userEmail } });
    const { product, address } = await seedProductForUser(user.id);
    const { agent: userAgent } = await login(userEmail, userPassword);
    const order = await createOrderFlow(userAgent, product.id, address.id);

    const inventoryBefore = await prisma.inventory.findUnique({ where: { productId: product.id } });
    expect(inventoryBefore.reserved).toBe(2);

    const { agent: adminAgent } = await login(adminEmail, adminPassword);
    const cancel = await adminAgent.patch("/api/admin/orders/" + order.id + "/status").send({
      status: "CANCELLED"
    });
    expect(cancel.status).toBe(200);

    const inventoryAfter = await prisma.inventory.findUnique({ where: { productId: product.id } });
    expect(inventoryAfter.reserved).toBe(0);
  });

  test("refund cannot exceed captured amount", async () => {
    const user = await prisma.user.findUnique({ where: { email: userEmail } });
    const { product, address } = await seedProductForUser(user.id);
    const { agent: userAgent } = await login(userEmail, userPassword);
    const order = await createOrderFlow(userAgent, product.id, address.id);

    const p1 = await userAgent.post("/api/public/payments").send({
      orderId: order.id,
      provider: "MANUAL"
    });
    expect(p1.status).toBe(201);

    const p2 = await userAgent.post("/api/public/payments").send({
      orderId: order.id,
      provider: "MANUAL"
    });
    expect(p2.status).toBe(201);

    const { agent: adminAgent } = await login(adminEmail, adminPassword);

    const capture = await adminAgent
      .patch("/api/admin/payments/" + p1.body.payment.id + "/status")
      .send({ status: "CAPTURED" });
    expect(capture.status).toBe(200);

    const refund1 = await adminAgent
      .patch("/api/admin/payments/" + p1.body.payment.id + "/status")
      .send({ status: "REFUNDED" });
    expect(refund1.status).toBe(200);

    const refund2 = await adminAgent
      .patch("/api/admin/payments/" + p2.body.payment.id + "/status")
      .send({ status: "REFUNDED" });
    expect(refund2.status).toBe(400);
  });

  test("valid coupon is applied on order and increments usedCount", async () => {
    const user = await prisma.user.findUnique({ where: { email: userEmail } });
    const { product, address } = await seedProductForUser(user.id);
    const code = "VALID-" + Date.now();
    await prisma.coupon.create({
      data: {
        code,
        type: "PERCENT",
        value: 10,
        isActive: true,
        usageLimit: 10
      }
    });

    const { agent: userAgent } = await login(userEmail, userPassword);
    const order = await createOrderFlow(userAgent, product.id, address.id, code);

    expect(order.subtotalCents).toBe(3000);
    expect(order.discountCents).toBe(300);
    expect(order.totalCents).toBe(2700);
    expect(order.subtotalCents + order.shippingCents - order.discountCents).toBe(order.totalCents);

    const coupon = await prisma.coupon.findUnique({ where: { code } });
    expect(coupon.usedCount).toBe(1);
  });

  test("expired coupon is rejected during order creation", async () => {
    const user = await prisma.user.findUnique({ where: { email: userEmail } });
    const { product, address } = await seedProductForUser(user.id);
    const code = "EXPIRED-" + Date.now();
    await prisma.coupon.create({
      data: {
        code,
        type: "FIXED",
        value: 500,
        isActive: true,
        startsAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
        endsAt: new Date(Date.now() - 60 * 1000)
      }
    });

    const { agent: userAgent } = await login(userEmail, userPassword);
    const add = await userAgent.post("/api/public/cart/items").send({
      productId: product.id,
      quantity: 2
    });
    expect(add.status).toBe(201);

    const res = await userAgent.post("/api/public/orders").send({
      shippingAddressId: address.id,
      billingAddressId: address.id,
      couponCode: code
    });

    expect(res.status).toBe(400);
  });

  test("coupon usage limit is enforced in order creation", async () => {
    const user = await prisma.user.findUnique({ where: { email: userEmail } });
    const { product, address } = await seedProductForUser(user.id);
    const code = "LIMIT-" + Date.now();
    await prisma.coupon.create({
      data: {
        code,
        type: "FIXED",
        value: 200,
        isActive: true,
        usageLimit: 1,
        usedCount: 1
      }
    });

    const { agent: userAgent } = await login(userEmail, userPassword);
    const add = await userAgent.post("/api/public/cart/items").send({
      productId: product.id,
      quantity: 2
    });
    expect(add.status).toBe(201);

    const res = await userAgent.post("/api/public/orders").send({
      shippingAddressId: address.id,
      billingAddressId: address.id,
      couponCode: code
    });

    expect(res.status).toBe(400);
  });
});
