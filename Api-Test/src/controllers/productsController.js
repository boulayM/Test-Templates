import prisma from "../config/prisma.js";

function parsePage(query) {
  const page = Math.max(parseInt(query.page || "1", 10), 1);
  const limit = Math.min(Math.max(parseInt(query.limit || "20", 10), 1), 100);
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

export async function listProducts(req, res, next) {
  try {
    const { page, limit, skip } = parsePage(req.query);
    const where = {};
    if (req.query.activeOnly === "true") where.isActive = true;
    if (req.query.q) {
      const q = String(req.query.q).trim();
      where.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { slug: { contains: q, mode: "insensitive" } },
        { sku: { contains: q, mode: "insensitive" } }
      ];
    }
    const [data, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { id: "desc" },
        include: {
          images: { orderBy: { sortOrder: "asc" } },
          categories: { include: { category: true } },
          inventory: true
        }
      }),
      prisma.product.count({ where })
    ]);
    res.json({ data, page, limit, total });
  } catch (err) {
    next(err);
  }
}

export async function getProduct(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) return res.status(400).json({ message: "Invalid id" });
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        images: { orderBy: { sortOrder: "asc" } },
        categories: { include: { category: true } },
        inventory: true
      }
    });
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json({ product });
  } catch (err) {
    next(err);
  }
}

export async function createProduct(req, res, next) {
  try {
    const body = req.body || {};
    const categoryIds = Array.isArray(body.categoryIds) ? body.categoryIds : [];
    const product = await prisma.product.create({
      data: {
        name: String(body.name || "").trim(),
        slug: String(body.slug || "").trim(),
        description: String(body.description || ""),
        priceCents: Number(body.priceCents || 0),
        currency: String(body.currency || "EUR"),
        sku: String(body.sku || "").trim(),
        isActive: body.isActive !== false,
        categories: categoryIds.length
          ? { create: categoryIds.map((categoryId) => ({ categoryId: Number(categoryId) })) }
          : undefined
      }
    });
    res.status(201).json({ product });
  } catch (err) {
    next(err);
  }
}

export async function updateProduct(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) return res.status(400).json({ message: "Invalid id" });
    const body = req.body || {};
    const data = {};
    if (body.name !== undefined) data.name = String(body.name).trim();
    if (body.slug !== undefined) data.slug = String(body.slug).trim();
    if (body.description !== undefined) data.description = String(body.description);
    if (body.priceCents !== undefined) data.priceCents = Number(body.priceCents);
    if (body.currency !== undefined) data.currency = String(body.currency);
    if (body.sku !== undefined) data.sku = String(body.sku).trim();
    if (body.isActive !== undefined) data.isActive = Boolean(body.isActive);

    if (Array.isArray(body.categoryIds)) {
      await prisma.productCategory.deleteMany({ where: { productId: id } });
      if (body.categoryIds.length > 0) {
        await prisma.productCategory.createMany({
          data: body.categoryIds.map((categoryId) => ({ productId: id, categoryId: Number(categoryId) })),
          skipDuplicates: true
        });
      }
    }

    const product = await prisma.product.update({ where: { id }, data });
    res.json({ product });
  } catch (err) {
    next(err);
  }
}

export async function deleteProduct(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) return res.status(400).json({ message: "Invalid id" });
    await prisma.product.delete({ where: { id } });
    res.json({ message: "Product deleted" });
  } catch (err) {
    next(err);
  }
}
