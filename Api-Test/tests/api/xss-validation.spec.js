import request from "supertest";
import bcrypt from "bcryptjs";
import prisma from "../../src/config/prisma.js";

process.env.DISABLE_RATE_LIMIT = "true";

let app;

const stamp = Date.now();
const adminEmail = process.env.ADMIN_EMAIL || "admin@example.com";
const adminPassword = process.env.ADMIN_PASSWORD || "Admin123!";
const userEmail = `xss_user_${stamp}@test.local`;
const userPassword = "User123!";
const HTML_PAYLOAD = '<script>alert("xss")</script>';

async function upsertUser(email, role, password) {
  const hash = await bcrypt.hash(password, 10);
  await prisma.user.upsert({
    where: { email },
    update: {
      firstName: "Xss",
      lastName: "User",
      passwordHash: hash,
      role,
      emailVerified: true,
      isActive: true
    },
    create: {
      firstName: "Xss",
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

async function createCategory() {
  const nonce = `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
  return prisma.category.create({
    data: {
      name: `Category ${nonce}`,
      slug: `category-${nonce}`
    }
  });
}

async function createProduct() {
  const nonce = `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
  return prisma.product.create({
    data: {
      name: `Product ${nonce}`,
      slug: `product-${nonce}`,
      description: "Safe description",
      priceCents: 1999,
      currency: "EUR",
      sku: `SKU-${nonce}`,
      isActive: true
    }
  });
}

async function createAddress(userId) {
  const nonce = `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
  return prisma.address.create({
    data: {
      userId,
      label: `Home ${nonce}`,
      fullName: "Xss User",
      phone: "0600000000",
      line1: `1 rue ${nonce}`,
      line2: null,
      postalCode: "75000",
      city: "Paris",
      country: "FR",
      isDefault: false
    }
  });
}

async function createOrderForUser(userId, { capturedPayment = false } = {}) {
  const address = await createAddress(userId);
  const order = await prisma.order.create({
    data: {
      userId,
      shippingAddressId: address.id,
      billingAddressId: address.id,
      status: capturedPayment ? "PAID" : "PENDING",
      subtotalCents: 1999,
      shippingCents: 0,
      discountCents: 0,
      totalCents: 1999,
      currency: "EUR"
    }
  });

  if (capturedPayment) {
    await prisma.payment.create({
      data: {
        orderId: order.id,
        provider: "MANUAL",
        providerRef: `SAFE-${order.id}`,
        amountCents: 1999,
        currency: "EUR",
        status: "CAPTURED"
      }
    });
  }

  return { order, address };
}

async function createPurchasedProductForUser(userId) {
  const product = await createProduct();
  const { order } = await createOrderForUser(userId, { capturedPayment: false });

  await prisma.order.update({ where: { id: order.id }, data: { status: "PAID" } });
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

  return { product, order };
}

function expectHtmlRejected(res, field) {
  expect(res.status).toBe(400);
  expect(res.body.code).toBe("BAD_REQUEST");
  expect(res.body.message).toBe("HTML is not allowed");
  expect(res.body.details.some((item) => item.path === field && item.message === "HTML is not allowed")).toBe(true);
}

describe("xss validation", () => {
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
    await upsertUser(userEmail, "USER", userPassword);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  test("rejects HTML in category create/update", async () => {
    const admin = await login(adminEmail, adminPassword);
    const category = await createCategory();

    const createRes = await admin.post("/api/admin/categories").send({
      name: HTML_PAYLOAD,
      slug: `safe-slug-${Date.now()}`
    });
    expectHtmlRejected(createRes, "name");

    const updateRes = await admin.patch(`/api/admin/categories/${category.id}`).send({
      slug: HTML_PAYLOAD
    });
    expectHtmlRejected(updateRes, "slug");
  });

  test("rejects HTML in product create/update", async () => {
    const admin = await login(adminEmail, adminPassword);
    const category = await createCategory();
    const product = await createProduct();

    const createRes = await admin.post("/api/admin/products").send({
      name: "Safe product",
      slug: `safe-product-${Date.now()}`,
      description: HTML_PAYLOAD,
      priceCents: 1500,
      currency: "EUR",
      sku: `SKU-${Date.now()}`,
      isActive: true,
      categoryIds: [category.id]
    });
    expectHtmlRejected(createRes, "description");

    const updateRes = await admin.patch(`/api/admin/products/${product.id}`).send({
      name: HTML_PAYLOAD
    });
    expectHtmlRejected(updateRes, "name");
  });

  test("rejects HTML in product image alt", async () => {
    const admin = await login(adminEmail, adminPassword);
    const product = await createProduct();

    const res = await admin.post("/api/admin/images").send({
      productId: product.id,
      url: "https://example.com/image.jpg",
      alt: HTML_PAYLOAD,
      sortOrder: 0
    });
    expectHtmlRejected(res, "alt");
  });

  test("rejects HTML in address create/update", async () => {
    const user = await login(userEmail, userPassword);
    const dbUser = await prisma.user.findUnique({ where: { email: userEmail } });
    const address = await createAddress(dbUser.id);

    const createRes = await user.post("/api/public/addresses").send({
      label: "Home",
      fullName: "Safe User",
      phone: "0600000000",
      line1: HTML_PAYLOAD,
      line2: null,
      postalCode: "75000",
      city: "Paris",
      country: "FR",
      isDefault: false
    });
    expectHtmlRejected(createRes, "line1");

    const updateRes = await user.patch(`/api/public/addresses/${address.id}`).send({
      city: HTML_PAYLOAD
    });
    expectHtmlRejected(updateRes, "city");
  });

  test("rejects HTML in coupon create/update", async () => {
    const admin = await login(adminEmail, adminPassword);
    const coupon = await prisma.coupon.create({
      data: {
        code: `SAFE${Date.now()}`,
        type: "FIXED",
        value: 500,
        isActive: true
      }
    });

    const createRes = await admin.post("/api/admin/coupons").send({
      code: HTML_PAYLOAD,
      type: "FIXED",
      value: 500,
      isActive: true
    });
    expectHtmlRejected(createRes, "code");

    const updateRes = await admin.patch(`/api/admin/coupons/${coupon.id}`).send({
      code: HTML_PAYLOAD
    });
    expectHtmlRejected(updateRes, "code");
  });

  test("rejects HTML in shipment create/update", async () => {
    const admin = await login(adminEmail, adminPassword);
    const dbUser = await prisma.user.findUnique({ where: { email: userEmail } });
    const { order } = await createOrderForUser(dbUser.id, { capturedPayment: true });
    const shipment = await prisma.shipment.create({
      data: {
        orderId: order.id,
        carrier: "DHL",
        trackingNumber: "TRACK-1",
        status: "CREATED"
      }
    });

    const createRes = await admin.post("/api/admin/shipments").send({
      orderId: order.id,
      carrier: HTML_PAYLOAD,
      trackingNumber: "TRACK-NEW",
      status: "CREATED"
    });
    expectHtmlRejected(createRes, "carrier");

    const updateRes = await admin.patch(`/api/admin/shipments/${shipment.id}`).send({
      trackingNumber: HTML_PAYLOAD
    });
    expectHtmlRejected(updateRes, "trackingNumber");
  });

  test("rejects HTML in payment providerRef", async () => {
    const user = await login(userEmail, userPassword);
    const dbUser = await prisma.user.findUnique({ where: { email: userEmail } });
    const { order } = await createOrderForUser(dbUser.id, { capturedPayment: false });

    const res = await user.post("/api/public/payments").send({
      orderId: order.id,
      provider: "MANUAL",
      providerRef: HTML_PAYLOAD
    });
    expectHtmlRejected(res, "providerRef");
  });

  test("rejects HTML in review create/update", async () => {
    const user = await login(userEmail, userPassword);
    const dbUser = await prisma.user.findUnique({ where: { email: userEmail } });
    const { product } = await createPurchasedProductForUser(dbUser.id);
    const review = await prisma.review.create({
      data: {
        userId: dbUser.id,
        productId: product.id,
        rating: 4,
        comment: "Safe comment"
      }
    });

    const createRes = await user.post("/api/public/reviews").send({
      productId: product.id,
      rating: 5,
      comment: HTML_PAYLOAD
    });
    expectHtmlRejected(createRes, "comment");

    const updateRes = await user.patch(`/api/public/reviews/${review.id}`).send({
      comment: HTML_PAYLOAD
    });
    expectHtmlRejected(updateRes, "comment");
  });
});
