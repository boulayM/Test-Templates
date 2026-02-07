import prisma from "../config/prisma.js";

export async function listInventory(req, res, next) {
  try {
    const data = await prisma.inventory.findMany({
      orderBy: { updatedAt: "desc" },
      include: { product: true }
    });
    res.json({ data });
  } catch (err) {
    next(err);
  }
}

export async function createInventory(req, res, next) {
  try {
    const productId = Number(req.body.productId);
    const inventory = await prisma.inventory.create({
      data: {
        productId,
        quantity: Number(req.body.quantity || 0),
        reserved: Number(req.body.reserved || 0)
      }
    });
    res.status(201).json({ inventory });
  } catch (err) {
    next(err);
  }
}

export async function updateInventory(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) return res.status(400).json({ message: "Invalid id" });
    const data = {};
    if (req.body.quantity !== undefined) data.quantity = Number(req.body.quantity);
    if (req.body.reserved !== undefined) data.reserved = Number(req.body.reserved);
    const inventory = await prisma.inventory.update({ where: { id }, data });
    res.json({ inventory });
  } catch (err) {
    next(err);
  }
}
