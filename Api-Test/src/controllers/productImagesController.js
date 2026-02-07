import prisma from "../config/prisma.js";

export async function listProductImages(req, res, next) {
  try {
    const where = {};
    if (req.query.productId !== undefined) where.productId = Number(req.query.productId);
    const data = await prisma.productImage.findMany({
      where,
      orderBy: [{ productId: "asc" }, { sortOrder: "asc" }]
    });
    res.json({ data });
  } catch (err) {
    next(err);
  }
}

export async function createProductImage(req, res, next) {
  try {
    const image = await prisma.productImage.create({
      data: {
        productId: Number(req.body.productId),
        url: String(req.body.url || "").trim(),
        alt: req.body.alt !== undefined ? String(req.body.alt) : null,
        sortOrder: req.body.sortOrder !== undefined ? Number(req.body.sortOrder) : 0
      }
    });
    res.status(201).json({ image });
  } catch (err) {
    next(err);
  }
}

export async function deleteProductImage(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) return res.status(400).json({ message: "Invalid id" });
    await prisma.productImage.delete({ where: { id } });
    res.json({ message: "Image deleted" });
  } catch (err) {
    next(err);
  }
}
