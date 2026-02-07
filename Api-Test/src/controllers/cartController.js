import prisma from "../config/prisma.js";

async function ensureActiveCart(userId) {
  let cart = await prisma.cart.findFirst({
    where: { userId, status: "ACTIVE" },
    orderBy: { id: "desc" }
  });
  if (!cart) {
    cart = await prisma.cart.create({ data: { userId, status: "ACTIVE" } });
  }
  return cart;
}

export async function getCart(req, res, next) {
  try {
    const cart = await ensureActiveCart(req.user.id);
    const full = await prisma.cart.findUnique({
      where: { id: cart.id },
      include: {
        items: {
          include: { product: true },
          orderBy: { id: "asc" }
        }
      }
    });
    res.json({ cart: full });
  } catch (err) {
    next(err);
  }
}

export async function addCartItem(req, res, next) {
  try {
    const cart = await ensureActiveCart(req.user.id);
    const productId = Number(req.body.productId);
    const quantity = Number(req.body.quantity || 1);
    if (quantity <= 0) return res.status(400).json({ message: "Invalid quantity" });
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product || !product.isActive) return res.status(404).json({ message: "Product not found" });

    const item = await prisma.cartItem.upsert({
      where: { cartId_productId: { cartId: cart.id, productId } },
      update: { quantity: { increment: quantity } },
      create: {
        cartId: cart.id,
        productId,
        quantity,
        unitPriceCents: product.priceCents,
        currency: product.currency
      }
    });
    res.status(201).json({ item });
  } catch (err) {
    next(err);
  }
}

export async function updateCartItem(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    const quantity = Number(req.body.quantity);
    if (Number.isNaN(id) || quantity <= 0) return res.status(400).json({ message: "Invalid payload" });
    const item = await prisma.cartItem.findUnique({
      where: { id },
      include: { cart: true }
    });
    if (!item || item.cart.userId !== req.user.id || item.cart.status !== "ACTIVE") {
      return res.status(404).json({ message: "Cart item not found" });
    }
    const updated = await prisma.cartItem.update({ where: { id }, data: { quantity } });
    res.json({ item: updated });
  } catch (err) {
    next(err);
  }
}

export async function deleteCartItem(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) return res.status(400).json({ message: "Invalid id" });
    const item = await prisma.cartItem.findUnique({
      where: { id },
      include: { cart: true }
    });
    if (!item || item.cart.userId !== req.user.id || item.cart.status !== "ACTIVE") {
      return res.status(404).json({ message: "Cart item not found" });
    }
    await prisma.cartItem.delete({ where: { id } });
    res.json({ message: "Cart item deleted" });
  } catch (err) {
    next(err);
  }
}

export async function abandonCart(req, res, next) {
  try {
    const userId = req.user.id;
    const activeCart = await prisma.cart.findFirst({
      where: { userId, status: "ACTIVE" },
      orderBy: { id: "desc" }
    });

    if (!activeCart) {
      const cart = await prisma.cart.create({ data: { userId, status: "ACTIVE" } });
      return res.json({ cart, abandonedCartId: null });
    }

    const [, cart] = await prisma.$transaction([
      prisma.cart.update({
        where: { id: activeCart.id },
        data: { status: "ABANDONED" }
      }),
      prisma.cart.create({
        data: { userId, status: "ACTIVE" }
      })
    ]);

    return res.json({ cart, abandonedCartId: activeCart.id });
  } catch (err) {
    next(err);
  }
}
