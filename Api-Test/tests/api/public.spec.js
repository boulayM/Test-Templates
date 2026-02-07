import request from "supertest";
import bcrypt from "bcryptjs";
import prisma from "../../src/config/prisma.js";

process.env.DISABLE_RATE_LIMIT = "true";

let app;

const stamp = Date.now();
const userEmail = "public_user_" + stamp + "@test.local";
const secondUserEmail = "public_user_2_" + stamp + "@test.local";
const userPassword = "User123!";

async function ensureUser(email) {
  const hash = await bcrypt.hash(userPassword, 10);
  await prisma.user.upsert({
    where: { email },
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
      email,
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

async function loginUserByEmail(email) {
  const agent = request.agent(app);
  const res = await agent.post("/api/auth/login").send({
    email,
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

    await ensureUser(userEmail);
    await ensureUser(secondUserEmail);
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

  test("addresses support multiple entries and single default switch", async () => {
    const { agent } = await loginUser();
    const stamp = Date.now();

    const a1 = await agent.post("/api/public/addresses").send({
      label: "Home",
      fullName: "Public User",
      phone: "0600000000",
      line1: "10 test road",
      line2: null,
      postalCode: "75000",
      city: "Paris",
      country: "FR",
      isDefault: true
    });
    expect(a1.status).toBe(201);
    const addr1 = a1.body.address.id;

    const a2 = await agent.post("/api/public/addresses").send({
      label: "Work " + stamp,
      fullName: "Public User",
      phone: "0600000001",
      line1: "11 test road",
      line2: null,
      postalCode: "75000",
      city: "Paris",
      country: "FR",
      isDefault: true
    });
    expect(a2.status).toBe(201);
    const addr2 = a2.body.address.id;

    const list1 = await agent.get("/api/public/addresses");
    expect(list1.status).toBe(200);
    const firstState1 = list1.body.data.find((x) => x.id === addr1);
    const firstState2 = list1.body.data.find((x) => x.id === addr2);
    expect(firstState1.isDefault).toBe(false);
    expect(firstState2.isDefault).toBe(true);

    const switchDefault = await agent.patch("/api/public/addresses/" + addr1).send({
      isDefault: true
    });
    expect(switchDefault.status).toBe(200);

    const list2 = await agent.get("/api/public/addresses");
    expect(list2.status).toBe(200);
    const secondState1 = list2.body.data.find((x) => x.id === addr1);
    const secondState2 = list2.body.data.find((x) => x.id === addr2);
    expect(secondState1.isDefault).toBe(true);
    expect(secondState2.isDefault).toBe(false);
  });

  test("orders history and details are isolated per user", async () => {
    const { agent: user1 } = await loginUserByEmail(userEmail);
    const { agent: user2 } = await loginUserByEmail(secondUserEmail);
    const product = await prisma.product.findFirst({ select: { id: true } });
    expect(product).toBeTruthy();

    const addr1Res = await user1.post("/api/public/addresses").send({
      label: "User1",
      fullName: "User One",
      phone: "0600000011",
      line1: "1 user one st",
      line2: null,
      postalCode: "75001",
      city: "Paris",
      country: "FR",
      isDefault: true
    });
    expect(addr1Res.status).toBe(201);
    const addr1 = addr1Res.body.address.id;

    const addr2Res = await user2.post("/api/public/addresses").send({
      label: "User2",
      fullName: "User Two",
      phone: "0600000022",
      line1: "2 user two st",
      line2: null,
      postalCode: "75002",
      city: "Paris",
      country: "FR",
      isDefault: true
    });
    expect(addr2Res.status).toBe(201);
    const addr2 = addr2Res.body.address.id;

    const add1 = await user1.post("/api/public/cart/items").send({
      productId: product.id,
      quantity: 1
    });
    expect(add1.status).toBe(201);
    const order1Res = await user1.post("/api/public/orders").send({
      shippingAddressId: addr1,
      billingAddressId: addr1
    });
    expect(order1Res.status).toBe(201);
    const order1Id = order1Res.body.order.id;

    const add2 = await user2.post("/api/public/cart/items").send({
      productId: product.id,
      quantity: 1
    });
    expect(add2.status).toBe(201);
    const order2Res = await user2.post("/api/public/orders").send({
      shippingAddressId: addr2,
      billingAddressId: addr2
    });
    expect(order2Res.status).toBe(201);
    const order2Id = order2Res.body.order.id;

    const user1List = await user1.get("/api/public/orders");
    expect(user1List.status).toBe(200);
    expect(user1List.body.data.some((o) => o.id === order1Id)).toBe(true);
    expect(user1List.body.data.some((o) => o.id === order2Id)).toBe(false);

    const ownDetail = await user1.get("/api/public/orders/" + order1Id);
    expect(ownDetail.status).toBe(200);
    expect(ownDetail.body.order.id).toBe(order1Id);

    const foreignDetail = await user1.get("/api/public/orders/" + order2Id);
    expect(foreignDetail.status).toBe(404);
  });

  test("can abandon active cart and get a new active cart", async () => {
    const { agent } = await loginUserByEmail(userEmail);
    const product = await prisma.product.findFirst({ select: { id: true } });
    expect(product).toBeTruthy();

    const add = await agent.post("/api/public/cart/items").send({
      productId: product.id,
      quantity: 1
    });
    expect(add.status).toBe(201);

    const cartBeforeRes = await agent.get("/api/public/cart");
    expect(cartBeforeRes.status).toBe(200);
    const previousCartId = cartBeforeRes.body.cart.id;

    const abandon = await agent.post("/api/public/cart/abandon");
    expect(abandon.status).toBe(200);
    expect(abandon.body.abandonedCartId).toBe(previousCartId);
    expect(abandon.body.cart.status).toBe("ACTIVE");
    expect(abandon.body.cart.id).not.toBe(previousCartId);

    const abandoned = await prisma.cart.findUnique({ where: { id: previousCartId } });
    expect(abandoned.status).toBe("ABANDONED");
  });
});
