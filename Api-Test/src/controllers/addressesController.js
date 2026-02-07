import prisma from "../config/prisma.js";

export async function listAddresses(req, res, next) {
  try {
    const data = await prisma.address.findMany({
      where: { userId: req.user.id },
      orderBy: [{ isDefault: "desc" }, { id: "desc" }]
    });
    res.json({ data });
  } catch (err) {
    next(err);
  }
}

export async function createAddress(req, res, next) {
  try {
    const body = req.body || {};
    const address = await prisma.$transaction(async (tx) => {
      if (body.isDefault) {
        await tx.address.updateMany({
          where: { userId: req.user.id, isDefault: true },
          data: { isDefault: false }
        });
      }
      return tx.address.create({
        data: {
          userId: req.user.id,
          label: String(body.label || ""),
          fullName: String(body.fullName || ""),
          phone: String(body.phone || ""),
          line1: String(body.line1 || ""),
          line2: body.line2 ? String(body.line2) : null,
          postalCode: String(body.postalCode || ""),
          city: String(body.city || ""),
          country: String(body.country || ""),
          isDefault: Boolean(body.isDefault)
        }
      });
    });
    res.status(201).json({ address });
  } catch (err) {
    next(err);
  }
}

export async function updateAddress(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) return res.status(400).json({ message: "Invalid id" });
    const current = await prisma.address.findUnique({ where: { id } });
    if (!current || current.userId !== req.user.id) {
      return res.status(404).json({ message: "Address not found" });
    }
    const body = req.body || {};
    const data = {};
    for (const key of [
      "label",
      "fullName",
      "phone",
      "line1",
      "line2",
      "postalCode",
      "city",
      "country"
    ]) {
      if (body[key] !== undefined) data[key] = body[key] ? String(body[key]) : null;
    }
    if (body.isDefault !== undefined) data.isDefault = Boolean(body.isDefault);

    const address = await prisma.$transaction(async (tx) => {
      if (data.isDefault) {
        await tx.address.updateMany({
          where: { userId: req.user.id, isDefault: true },
          data: { isDefault: false }
        });
      }
      return tx.address.update({ where: { id }, data });
    });
    res.json({ address });
  } catch (err) {
    next(err);
  }
}

export async function deleteAddress(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) return res.status(400).json({ message: "Invalid id" });
    const current = await prisma.address.findUnique({ where: { id } });
    if (!current || current.userId !== req.user.id) {
      return res.status(404).json({ message: "Address not found" });
    }
    await prisma.address.delete({ where: { id } });
    res.json({ message: "Address deleted" });
  } catch (err) {
    next(err);
  }
}
