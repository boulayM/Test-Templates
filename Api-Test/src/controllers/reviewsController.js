import prisma from "../config/prisma.js";

export async function listReviews(req, res, next) {
  try {
    const where = {};
    if (req.query.productId !== undefined) where.productId = Number(req.query.productId);
    const data = await prisma.review.findMany({
      where,
      orderBy: { createdAt: "desc" }
    });
    res.json({ data });
  } catch (err) {
    next(err);
  }
}

async function hasPurchasedProduct(userId, productId) {
  const found = await prisma.orderItem.findFirst({
    where: {
      productId,
      order: {
        userId,
        status: { in: ["PAID", "PREPARING", "SHIPPED", "DELIVERED", "REFUNDED"] }
      }
    },
    select: { id: true }
  });
  return Boolean(found);
}

export async function createReview(req, res, next) {
  try {
    const userId = req.user.id;
    const productId = Number(req.body.productId);
    if (!(await hasPurchasedProduct(userId, productId))) {
      return res.status(403).json({ message: "Review allowed only after purchase" });
    }
    const review = await prisma.review.create({
      data: {
        userId,
        productId,
        rating: Number(req.body.rating),
        comment: req.body.comment ? String(req.body.comment) : null
      }
    });
    res.status(201).json({ review });
  } catch (err) {
    next(err);
  }
}

export async function updateOwnReview(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) return res.status(400).json({ message: "Invalid id" });
    const review = await prisma.review.findUnique({ where: { id } });
    if (!review || review.userId !== req.user.id) {
      return res.status(404).json({ message: "Review not found" });
    }
    const data = {};
    if (req.body.rating !== undefined) data.rating = Number(req.body.rating);
    if (req.body.comment !== undefined) data.comment = req.body.comment ? String(req.body.comment) : null;
    const updated = await prisma.review.update({ where: { id }, data });
    res.json({ review: updated });
  } catch (err) {
    next(err);
  }
}

export async function deleteOwnReview(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) return res.status(400).json({ message: "Invalid id" });
    const review = await prisma.review.findUnique({ where: { id } });
    if (!review || review.userId !== req.user.id) {
      return res.status(404).json({ message: "Review not found" });
    }
    await prisma.review.delete({ where: { id } });
    res.json({ message: "Review deleted" });
  } catch (err) {
    next(err);
  }
}

export async function deleteReview(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) return res.status(400).json({ message: "Invalid id" });
    await prisma.review.delete({ where: { id } });
    res.json({ message: "Review deleted" });
  } catch (err) {
    next(err);
  }
}
