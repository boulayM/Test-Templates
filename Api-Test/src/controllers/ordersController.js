import prisma from "../config/prisma.js";
import { isTransitionAllowed } from "../utils/orderTransitions.js";

function parsePage(query) {
  const page = Math.max(parseInt(query.page || "1", 10), 1);
  const limit = Math.min(Math.max(parseInt(query.limit || "20", 10), 1), 100);
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

export async function listOrders(req, res, next) {
  try {
    const { page, limit, skip } = parsePage(req.query);
    const [data, total] = await Promise.all([
      prisma.order.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: { items: true, payments: true, shipments: true, coupons: true }
      }),
      prisma.order.count()
    ]);
    res.json({ data, page, limit, total });
  } catch (err) {
    next(err);
  }
}

export async function getOrder(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) return res.status(400).json({ message: "Invalid id" });
    const order = await prisma.order.findUnique({
      where: { id },
      include: { items: true, payments: true, shipments: true, coupons: { include: { coupon: true } } }
    });
    if (!order) return res.status(404).json({ message: "Order not found" });
    res.json({ order });
  } catch (err) {
    next(err);
  }
}

async function hasCapturedPayment(tx, orderId) {
  const payment = await tx.payment.findFirst({
    where: { orderId, status: "CAPTURED" },
    select: { id: true }
  });
  return Boolean(payment);
}

export async function updateOrderStatus(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    const toStatus = String(req.body.status || "").trim();
    if (Number.isNaN(id) || !toStatus) return res.status(400).json({ message: "Invalid payload" });

    const order = await prisma.order.findUnique({ where: { id }, include: { items: true } });
    if (!order) return res.status(404).json({ message: "Order not found" });
    if (!isTransitionAllowed(order.status, toStatus)) {
      return res.status(400).json({ message: "Transition not allowed" });
    }

    const updated = await prisma.$transaction(async (tx) => {
      if ((toStatus === "SHIPPED" || toStatus === "DELIVERED") && !(await hasCapturedPayment(tx, id))) {
        throw Object.assign(new Error("Order must be paid before shipping"), { status: 400 });
      }

      if (toStatus === "CANCELLED" && order.status !== "CANCELLED") {
        for (const item of order.items) {
          if (!item.productId) continue;
          await tx.inventory.updateMany({
            where: { productId: item.productId },
            data: { reserved: { decrement: item.quantity } }
          });
        }
      }

      return tx.order.update({
        where: { id },
        data: { status: toStatus }
      });
    });

    res.json({ order: updated });
  } catch (err) {
    next(err);
  }
}

export async function listMyOrders(req, res, next) {
  try {
    const { page, limit, skip } = parsePage(req.query);
    const where = { userId: req.user.id };
    const [data, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: { items: true, payments: true, shipments: true }
      }),
      prisma.order.count({ where })
    ]);
    res.json({ data, page, limit, total });
  } catch (err) {
    next(err);
  }
}

export async function getMyOrder(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) return res.status(400).json({ message: "Invalid id" });
    const order = await prisma.order.findUnique({
      where: { id },
      include: { items: true, payments: true, shipments: true, coupons: { include: { coupon: true } } }
    });
    if (!order || order.userId !== req.user.id) {
      return res.status(404).json({ message: "Order not found" });
    }
    res.json({ order });
  } catch (err) {
    next(err);
  }
}

function computeDiscount(total, coupon) {
  if (!coupon) return 0;
  if (coupon.type === "PERCENT") {
    const value = Math.floor((total * coupon.value) / 100);
    return value > total ? total : value;
  }
  return coupon.value > total ? total : coupon.value;
}

export async function createOrder(req, res, next) {
  try {
    const userId = req.user.id;
    const shippingAddressId = Number(req.body.shippingAddressId);
    const billingAddressId = Number(req.body.billingAddressId);
    const couponCode = req.body.couponCode ? String(req.body.couponCode).trim().toUpperCase() : null;

    const result = await prisma.$transaction(async (tx) => {
      const cart = await tx.cart.findFirst({
        where: { userId, status: "ACTIVE" },
        orderBy: { id: "desc" },
        include: { items: true }
      });
      if (!cart || cart.items.length === 0) {
        throw Object.assign(new Error("Cart is empty"), { status: 400 });
      }

      const [shippingAddress, billingAddress] = await Promise.all([
        tx.address.findUnique({ where: { id: shippingAddressId } }),
        tx.address.findUnique({ where: { id: billingAddressId } })
      ]);
      if (!shippingAddress || shippingAddress.userId !== userId) {
        throw Object.assign(new Error("Invalid shipping address"), { status: 400 });
      }
      if (!billingAddress || billingAddress.userId !== userId) {
        throw Object.assign(new Error("Invalid billing address"), { status: 400 });
      }

      let subtotalCents = 0;
      for (const item of cart.items) {
        subtotalCents += item.unitPriceCents * item.quantity;
      }

      let coupon = null;
      if (couponCode) {
        coupon = await tx.coupon.findUnique({ where: { code: couponCode } });
        if (!coupon || !coupon.isActive) {
          throw Object.assign(new Error("Invalid coupon"), { status: 400 });
        }
        if (coupon.startsAt && coupon.startsAt > new Date()) {
          throw Object.assign(new Error("Coupon not started"), { status: 400 });
        }
        if (coupon.endsAt && coupon.endsAt < new Date()) {
          throw Object.assign(new Error("Coupon expired"), { status: 400 });
        }
        if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
          throw Object.assign(new Error("Coupon usage limit reached"), { status: 400 });
        }
        if (coupon.minOrderCents !== null && subtotalCents < coupon.minOrderCents) {
          throw Object.assign(new Error("Order does not match coupon minimum"), { status: 400 });
        }
      }

      for (const item of cart.items) {
        const inventory = await tx.inventory.findUnique({ where: { productId: item.productId } });
        if (!inventory || inventory.quantity - inventory.reserved < item.quantity) {
          throw Object.assign(new Error("Insufficient inventory"), { status: 400 });
        }
      }

      for (const item of cart.items) {
        await tx.inventory.update({
          where: { productId: item.productId },
          data: { reserved: { increment: item.quantity } }
        });
      }

      const shippingCents = 0;
      const discountCents = computeDiscount(subtotalCents, coupon);
      const totalCents = subtotalCents + shippingCents - discountCents;
      const currency = cart.items[0].currency || "EUR";

      const order = await tx.order.create({
        data: {
          userId,
          cartId: cart.id,
          shippingAddressId,
          billingAddressId,
          status: "PENDING",
          subtotalCents,
          shippingCents,
          discountCents,
          totalCents,
          currency
        }
      });

      for (const item of cart.items) {
        const product = await tx.product.findUnique({ where: { id: item.productId } });
        await tx.orderItem.create({
          data: {
            orderId: order.id,
            productId: item.productId,
            productName: product?.name || "Unknown",
            productSku: product?.sku || "UNKNOWN",
            quantity: item.quantity,
            unitPriceCents: item.unitPriceCents,
            currency: item.currency
          }
        });
      }

      if (coupon) {
        await tx.orderCoupon.create({
          data: { orderId: order.id, couponId: coupon.id }
        });
        await tx.coupon.update({
          where: { id: coupon.id },
          data: { usedCount: { increment: 1 } }
        });
      }

      await tx.cart.update({
        where: { id: cart.id },
        data: { status: "CONVERTED" }
      });

      await tx.cart.create({
        data: { userId, status: "ACTIVE" }
      });

      return order;
    });

    res.status(201).json({ order: result });
  } catch (err) {
    next(err);
  }
}
