import request from "supertest";
import bcrypt from "bcryptjs";
import prisma from "../../src/config/prisma.js";

process.env.DISABLE_RATE_LIMIT = "true";

let app;

const stamp = Date.now();
const adminEmail = process.env.ADMIN_EMAIL || "admin@example.com";
const adminPassword = process.env.ADMIN_PASSWORD || "Admin123!";
const logisticsEmail = "wf_log_" + stamp + "@test.local";
const accountingEmail = "wf_comp_" + stamp + "@test.local";
const customerEmail = "wf_customer_" + stamp + "@test.local";
const userPassword = "User123!";

async function upsertUser(email, role, password = userPassword) {
  const hash = await bcrypt.hash(password, 10);
  return prisma.user.upsert({
    where: { email },
    update: {
      firstName: role,
      lastName: "Workflow",
      passwordHash: hash,
      role,
      emailVerified: true,
      isActive: true
    },
    create: {
      firstName: role,
      lastName: "Workflow",
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

async function seedCatalogAndAddress(userId) {
  const nonce = Date.now() + "-" + Math.floor(Math.random() * 100000);
  const category = await prisma.category.create({
    data: {
      name: "WF Cat " + nonce,
      slug: "wf-cat-" + nonce
    }
  });
  const product = await prisma.product.create({
    data: {
      name: "WF Product",
      slug: "wf-product-" + nonce,
      description: "workflow",
      priceCents: 2000,
      currency: "EUR",
      sku: "WF-SKU-" + nonce,
      isActive: true
    }
  });
  await prisma.productCategory.create({
    data: { productId: product.id, categoryId: category.id }
  });
  await prisma.inventory.create({
    data: { productId: product.id, quantity: 50, reserved: 0 }
  });
  const address = await prisma.address.create({
    data: {
      userId,
      label: "Home",
      fullName: "Workflow User",
      phone: "0600000000",
      line1: "2 workflow street",
      line2: null,
      postalCode: "75000",
      city: "Paris",
      country: "FR",
      isDefault: true
    }
  });
  return { product, address };
}

async function createOrderFromCart(userAgent, productId, addressId) {
  const add = await userAgent.post("/api/public/cart/items").send({ productId, quantity: 1 });
  expect(add.status).toBe(201);

  const orderRes = await userAgent.post("/api/public/orders").send({
    shippingAddressId: addressId,
    billingAddressId: addressId
  });
  expect(orderRes.status).toBe(201);
  return orderRes.body.order;
}

function expectOrderTotalsConsistent(order) {
  expect(order.subtotalCents + order.shippingCents - order.discountCents).toBe(order.totalCents);
}

describe("workflow", () => {
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
    await upsertUser(logisticsEmail, "LOGISTIQUE");
    await upsertUser(accountingEmail, "COMPTABILITE");
    const customer = await upsertUser(customerEmail, "USER");
    customerId = customer.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  test("nominal workflow: PENDING -> PAID -> PREPARING -> SHIPPED -> DELIVERED", async () => {
    const { product, address } = await seedCatalogAndAddress(customerId);
    const userAgent = await login(customerEmail, userPassword);
    const compAgent = await login(accountingEmail, userPassword);
    const logAgent = await login(logisticsEmail, userPassword);

    const order = await createOrderFromCart(userAgent, product.id, address.id);
    expect(order.status).toBe("PENDING");
    expectOrderTotalsConsistent(order);

    const paymentRes = await userAgent.post("/api/public/payments").send({
      orderId: order.id,
      provider: "MANUAL"
    });
    expect(paymentRes.status).toBe(201);
    const paymentId = paymentRes.body.payment.id;

    const captureRes = await compAgent
      .patch("/api/admin/payments/" + paymentId + "/status")
      .send({ status: "CAPTURED" });
    expect(captureRes.status).toBe(200);

    const preparingRes = await logAgent
      .patch("/api/admin/orders/" + order.id + "/status")
      .send({ status: "PREPARING" });
    expect(preparingRes.status).toBe(200);

    const createShipmentRes = await logAgent.post("/api/admin/shipments").send({
      orderId: order.id,
      carrier: "DHL",
      trackingNumber: "WF-TRACK-" + stamp
    });
    expect(createShipmentRes.status).toBe(201);
    const shipmentId = createShipmentRes.body.shipment.id;

    const shippedRes = await logAgent
      .patch("/api/admin/orders/" + order.id + "/status")
      .send({ status: "SHIPPED" });
    expect(shippedRes.status).toBe(200);

    const deliveredShipmentRes = await logAgent.patch("/api/admin/shipments/" + shipmentId).send({
      status: "DELIVERED"
    });
    expect(deliveredShipmentRes.status).toBe(200);

    const freshOrder = await prisma.order.findUnique({ where: { id: order.id } });
    expect(freshOrder.status).toBe("DELIVERED");
  });

  test("invalid transition: PENDING -> SHIPPED is rejected", async () => {
    const { product, address } = await seedCatalogAndAddress(customerId);
    const userAgent = await login(customerEmail, userPassword);
    const logAgent = await login(logisticsEmail, userPassword);

    const order = await createOrderFromCart(userAgent, product.id, address.id);
    expect(order.status).toBe("PENDING");
    expectOrderTotalsConsistent(order);

    const invalidRes = await logAgent
      .patch("/api/admin/orders/" + order.id + "/status")
      .send({ status: "SHIPPED" });
    expect(invalidRes.status).toBe(400);
  });
});
