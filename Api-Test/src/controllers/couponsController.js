import prisma from "../config/prisma.js";

export async function listCoupons(req, res, next) {
  try {
    const data = await prisma.coupon.findMany({
      orderBy: { id: "desc" }
    });
    res.json({ data });
  } catch (err) {
    next(err);
  }
}

export async function createCoupon(req, res, next) {
  try {
    const body = req.body || {};
    const coupon = await prisma.coupon.create({
      data: {
        code: String(body.code || "").trim().toUpperCase(),
        type: body.type,
        value: Number(body.value || 0),
        minOrderCents: body.minOrderCents !== undefined ? Number(body.minOrderCents) : null,
        startsAt: body.startsAt ? new Date(body.startsAt) : null,
        endsAt: body.endsAt ? new Date(body.endsAt) : null,
        usageLimit: body.usageLimit !== undefined ? Number(body.usageLimit) : null,
        isActive: body.isActive !== false
      }
    });
    res.status(201).json({ coupon });
  } catch (err) {
    next(err);
  }
}

export async function updateCoupon(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) return res.status(400).json({ message: "Invalid id" });
    const body = req.body || {};
    const data = {};
    if (body.code !== undefined) data.code = String(body.code).trim().toUpperCase();
    if (body.type !== undefined) data.type = body.type;
    if (body.value !== undefined) data.value = Number(body.value);
    if (body.minOrderCents !== undefined) data.minOrderCents = Number(body.minOrderCents);
    if (body.startsAt !== undefined) data.startsAt = body.startsAt ? new Date(body.startsAt) : null;
    if (body.endsAt !== undefined) data.endsAt = body.endsAt ? new Date(body.endsAt) : null;
    if (body.usageLimit !== undefined) data.usageLimit = Number(body.usageLimit);
    if (body.isActive !== undefined) data.isActive = Boolean(body.isActive);
    const coupon = await prisma.coupon.update({ where: { id }, data });
    res.json({ coupon });
  } catch (err) {
    next(err);
  }
}

export async function deleteCoupon(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) return res.status(400).json({ message: "Invalid id" });
    await prisma.coupon.delete({ where: { id } });
    res.json({ message: "Coupon deleted" });
  } catch (err) {
    next(err);
  }
}

export async function validateCoupon(req, res, next) {
  try {
    const code = String(req.query.code || "").trim().toUpperCase();
    if (!code) return res.status(400).json({ message: "Coupon code is required" });
    const orderTotalCents = Number(req.query.orderTotalCents || 0);

    const coupon = await prisma.coupon.findUnique({ where: { code } });
    if (!coupon || !coupon.isActive) return res.json({ valid: false, reason: "NOT_ACTIVE" });
    if (coupon.startsAt && coupon.startsAt > new Date()) return res.json({ valid: false, reason: "NOT_STARTED" });
    if (coupon.endsAt && coupon.endsAt < new Date()) return res.json({ valid: false, reason: "EXPIRED" });
    if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
      return res.json({ valid: false, reason: "USAGE_LIMIT" });
    }
    if (coupon.minOrderCents !== null && orderTotalCents < coupon.minOrderCents) {
      return res.json({ valid: false, reason: "MIN_ORDER" });
    }

    let discountCents = 0;
    if (coupon.type === "PERCENT") {
      discountCents = Math.floor((orderTotalCents * coupon.value) / 100);
    } else {
      discountCents = coupon.value;
    }
    if (discountCents > orderTotalCents) discountCents = orderTotalCents;

    res.json({ valid: true, coupon, discountCents });
  } catch (err) {
    next(err);
  }
}
