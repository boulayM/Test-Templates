import request from "supertest";
import bcrypt from "bcryptjs";
import prisma from "../../src/config/prisma.js";

process.env.DISABLE_RATE_LIMIT = "true";

let app;

const stamp = Date.now();
const adminEmail = process.env.ADMIN_EMAIL || "admin@example.com";
const adminPassword = process.env.ADMIN_PASSWORD || "Admin123!";
const logisticsEmail = "logistique_" + stamp + "@test.local";
const accountingEmail = "compta_" + stamp + "@test.local";
const customerEmail = "customer_" + stamp + "@test.local";
const userPassword = "User123!";

async function upsertUser(email, role, password = userPassword) {
  const hash = await bcrypt.hash(password, 10);
  return prisma.user.upsert({
    where: { email },
    update: {
      firstName: role,
      lastName: "User",
      passwordHash: hash,
      role,
      emailVerified: true,
      isActive: true
    },
    create: {
      firstName: role,
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
  const res = await agent.post("/api/auth/login").send({ email, password });
  expect(res.status).toBe(200);
  return agent;
}

async function seedOrderWithCapturedPayment(userId) {
  const category = await prisma.category.create({
    data: {
      name: "RBAC Cat " + stamp,
      slug: "rbac-cat-" + stamp
    }
  });

  const product = await prisma.product.create({
    data: {
      name: "RBAC Product",
      slug: "rbac-product-" + stamp,
      description: "RBAC product",
      priceCents: 1000,
      currency: "EUR",
      sku: "RBAC-SKU-" + stamp,
      isActive: true
    }
  });

  await prisma.productCategory.create({
    data: { productId: product.id, categoryId: category.id }
  });

  const inventory = await prisma.inventory.create({
    data: { productId: product.id, quantity: 20, reserved: 0 }
  });

  const address = await prisma.address.create({
    data: {
      userId,
      label: "Home",
      fullName: "RBAC Customer",
      phone: "0600000000",
      line1: "1 test street",
      line2: null,
      postalCode: "75000",
      city: "Paris",
      country: "FR",
      isDefault: true
    }
  });

  const order = await prisma.order.create({
    data: {
      userId,
      shippingAddressId: address.id,
      billingAddressId: address.id,
      status: "PAID",
      subtotalCents: 1000,
      shippingCents: 0,
      discountCents: 0,
      totalCents: 1000,
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
      unitPriceCents: 1000,
      currency: "EUR"
    }
  });

  const payment = await prisma.payment.create({
    data: {
      orderId: order.id,
      provider: "MANUAL",
      providerRef: "rbac-ref-" + stamp,
      amountCents: 1000,
      currency: "EUR",
      status: "CAPTURED"
    }
  });

  return { order, payment, inventory };
}

describe("rbac roles", () => {
  let orderId;
  let paymentId;
  let inventoryId;

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
    const logistics = await upsertUser(logisticsEmail, "LOGISTIQUE");
    const accounting = await upsertUser(accountingEmail, "COMPTABILITE");
    const customer = await upsertUser(customerEmail, "USER");

    expect(logistics.id).toBeGreaterThan(0);
    expect(accounting.id).toBeGreaterThan(0);

    const seeded = await seedOrderWithCapturedPayment(customer.id);
    orderId = seeded.order.id;
    paymentId = seeded.payment.id;
    inventoryId = seeded.inventory.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  test("LOGISTIQUE can read orders and inventory", async () => {
    const agent = await login(logisticsEmail, userPassword);

    const ordersRes = await agent.get("/api/admin/orders");
    expect(ordersRes.status).toBe(200);

    const inventoryRes = await agent.get("/api/admin/inventory");
    expect(inventoryRes.status).toBe(200);
  });

  test("LOGISTIQUE can update order status and create shipment", async () => {
    const agent = await login(logisticsEmail, userPassword);

    const statusRes = await agent
      .patch("/api/admin/orders/" + orderId + "/status")
      .send({ status: "PREPARING" });
    expect(statusRes.status).toBe(200);

    const shipmentRes = await agent.post("/api/admin/shipments").send({
      orderId,
      carrier: "DHL",
      trackingNumber: "RBAC-TRACK-" + stamp
    });
    expect(shipmentRes.status).toBe(201);
  });

  test("LOGISTIQUE is denied for users and payments admin endpoints", async () => {
    const agent = await login(logisticsEmail, userPassword);

    const usersRes = await agent.get("/api/admin/users");
    expect(usersRes.status).toBe(403);

    const paymentsRes = await agent.get("/api/admin/payments");
    expect(paymentsRes.status).toBe(403);
  });

  test("COMPTABILITE can read and update payments", async () => {
    const agent = await login(accountingEmail, userPassword);

    const listRes = await agent.get("/api/admin/payments");
    expect(listRes.status).toBe(200);

    const updateRes = await agent
      .patch("/api/admin/payments/" + paymentId + "/status")
      .send({ status: "REFUNDED" });
    expect(updateRes.status).toBe(200);
  });

  test("COMPTABILITE is denied for inventory and shipments admin endpoints", async () => {
    const agent = await login(accountingEmail, userPassword);

    const inventoryRes = await agent.patch("/api/admin/inventory/" + inventoryId).send({ quantity: 99 });
    expect(inventoryRes.status).toBe(403);

    const shipmentsRes = await agent.get("/api/admin/shipments");
    expect(shipmentsRes.status).toBe(403);
  });
});

