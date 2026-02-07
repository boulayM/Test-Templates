import request from "supertest";
import bcrypt from "bcryptjs";
import prisma from "../../src/config/prisma.js";

process.env.DISABLE_RATE_LIMIT = "true";

let app;

const stamp = Date.now();
const adminEmail = process.env.ADMIN_EMAIL || "admin@example.com";
const adminPassword = process.env.ADMIN_PASSWORD || "Admin123!";
const customerEmail = "e2e_customer_" + stamp + "@test.local";
const logisticsEmail = "e2e_log_" + stamp + "@test.local";
const accountingEmail = "e2e_comp_" + stamp + "@test.local";
const password = "User123!";

function expectOrderTotalsConsistent(order) {
  expect(order.subtotalCents + order.shippingCents - order.discountCents).toBe(order.totalCents);
}

async function upsertUser(email, role, pass = password) {
  const hash = await bcrypt.hash(pass, 10);
  return prisma.user.upsert({
    where: { email },
    update: {
      firstName: role,
      lastName: "E2E",
      passwordHash: hash,
      role,
      emailVerified: true,
      isActive: true
    },
    create: {
      firstName: role,
      lastName: "E2E",
      email,
      passwordHash: hash,
      role,
      emailVerified: true,
      isActive: true
    }
  });
}

async function login(email, pass) {
  const agent = request.agent(app);
  const res = await agent.post("/api/auth/login").send({ email, password: pass });
  expect(res.status).toBe(200);
  return { agent, csrfToken: res.body.csrfToken };
}

describe("e2e client flow", () => {
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
    await upsertUser(customerEmail, "USER");
    await upsertUser(logisticsEmail, "LOGISTIQUE");
    await upsertUser(accountingEmail, "COMPTABILITE");
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  test("admin->customer->accounting->logistics full workflow", async () => {
    const { agent: adminAgent } = await login(adminEmail, adminPassword);
    const { agent: customerAgent, csrfToken: customerCsrf } = await login(customerEmail, password);
    const { agent: accountingAgent } = await login(accountingEmail, password);
    const { agent: logisticsAgent } = await login(logisticsEmail, password);

    const categoryRes = await adminAgent.post("/api/admin/categories").send({
      name: "E2E Category " + stamp,
      slug: "e2e-category-" + stamp
    });
    expect(categoryRes.status).toBe(201);
    const categoryId = categoryRes.body.category.id;

    const productRes = await adminAgent.post("/api/admin/products").send({
      name: "E2E Product " + stamp,
      slug: "e2e-product-" + stamp,
      description: "e2e product",
      priceCents: 2499,
      currency: "EUR",
      sku: "E2E-SKU-" + stamp,
      isActive: true,
      categoryIds: [categoryId]
    });
    expect(productRes.status).toBe(201);
    const productId = productRes.body.product.id;

    const inventoryRes = await adminAgent.post("/api/admin/inventory").send({
      productId,
      quantity: 20,
      reserved: 0
    });
    expect(inventoryRes.status).toBe(201);

    const productsList = await customerAgent.get("/api/public/products");
    expect(productsList.status).toBe(200);
    expect(Array.isArray(productsList.body.data)).toBe(true);

    const addCart = await customerAgent.post("/api/public/cart/items").send({
      productId,
      quantity: 1
    });
    expect(addCart.status).toBe(201);

    const addressRes = await customerAgent.post("/api/public/addresses").send({
      label: "Home",
      fullName: "Customer E2E",
      phone: "0600000000",
      line1: "10 test road",
      line2: null,
      postalCode: "75000",
      city: "Paris",
      country: "FR",
      isDefault: true
    });
    expect(addressRes.status).toBe(201);
    const addressId = addressRes.body.address.id;

    const orderRes = await customerAgent.post("/api/public/orders").send({
      shippingAddressId: addressId,
      billingAddressId: addressId
    });
    expect(orderRes.status).toBe(201);
    expect(orderRes.body.order.status).toBe("PENDING");
    expectOrderTotalsConsistent(orderRes.body.order);
    const orderId = orderRes.body.order.id;

    const paymentRes = await customerAgent.post("/api/public/payments").send({
      orderId,
      provider: "MANUAL"
    });
    expect(paymentRes.status).toBe(201);
    const paymentId = paymentRes.body.payment.id;

    const captureRes = await accountingAgent
      .patch("/api/admin/payments/" + paymentId + "/status")
      .send({ status: "CAPTURED" });
    expect(captureRes.status).toBe(200);

    const preparingRes = await logisticsAgent
      .patch("/api/admin/orders/" + orderId + "/status")
      .send({ status: "PREPARING" });
    expect(preparingRes.status).toBe(200);

    const shipmentRes = await logisticsAgent.post("/api/admin/shipments").send({
      orderId,
      carrier: "DHL",
      trackingNumber: "E2E-TRACK-" + stamp
    });
    expect(shipmentRes.status).toBe(201);
    const shipmentId = shipmentRes.body.shipment.id;

    const shippedRes = await logisticsAgent
      .patch("/api/admin/orders/" + orderId + "/status")
      .send({ status: "SHIPPED" });
    expect(shippedRes.status).toBe(200);

    const deliveredRes = await logisticsAgent.patch("/api/admin/shipments/" + shipmentId).send({
      status: "DELIVERED"
    });
    expect(deliveredRes.status).toBe(200);

    const myShipments = await customerAgent.get("/api/public/shipments");
    expect(myShipments.status).toBe(200);
    expect(Array.isArray(myShipments.body.data)).toBe(true);

    const logoutAll = await customerAgent
      .post("/api/auth/logout-all")
      .set("x-csrf-token", customerCsrf);
    expect(logoutAll.status).toBe(200);
  });
});
