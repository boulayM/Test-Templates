import prisma from "../config/prisma.js";

function parsePage(query) {
  const page = Math.max(parseInt(query.page || "1", 10), 1);
  const limit = Math.min(Math.max(parseInt(query.limit || "20", 10), 1), 100);
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

export async function listCategories(req, res, next) {
  try {
    const { page, limit, skip } = parsePage(req.query);
    const [data, total] = await Promise.all([
      prisma.category.findMany({
        skip,
        take: limit,
        orderBy: { id: "desc" }
      }),
      prisma.category.count()
    ]);
    res.json({ data, page, limit, total });
  } catch (err) {
    next(err);
  }
}

export async function getCategory(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) return res.status(400).json({ message: "Invalid id" });
    const category = await prisma.category.findUnique({ where: { id } });
    if (!category) return res.status(404).json({ message: "Category not found" });
    res.json({ category });
  } catch (err) {
    next(err);
  }
}

export async function createCategory(req, res, next) {
  try {
    const data = await prisma.category.create({
      data: {
        name: String(req.body.name || "").trim(),
        slug: String(req.body.slug || "").trim(),
        parentId: req.body.parentId ?? null
      }
    });
    res.status(201).json({ category: data });
  } catch (err) {
    next(err);
  }
}

export async function updateCategory(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) return res.status(400).json({ message: "Invalid id" });
    const data = {};
    if (req.body.name !== undefined) data.name = String(req.body.name).trim();
    if (req.body.slug !== undefined) data.slug = String(req.body.slug).trim();
    if (req.body.parentId !== undefined) data.parentId = req.body.parentId;
    const category = await prisma.category.update({ where: { id }, data });
    res.json({ category });
  } catch (err) {
    next(err);
  }
}

export async function deleteCategory(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) return res.status(400).json({ message: "Invalid id" });
    await prisma.category.delete({ where: { id } });
    res.json({ message: "Category deleted" });
  } catch (err) {
    next(err);
  }
}
