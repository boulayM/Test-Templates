import prisma from "../config/prisma.js";

export async function listPayments(req, res, next) {
  try {
    const data = await prisma.payment.findMany({
      orderBy: { createdAt: "desc" },
      include: { order: true }
    });
    res.json({ data });
  } catch (err) {
    next(err);
  }
}

export async function createPayment(req, res, next) {
  try {
    const orderId = Number(req.body.orderId);
    const provider = String(req.body.provider || "MANUAL").toUpperCase();
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order || order.userId !== req.user.id) {
      return res.status(404).json({ message: "Order not found" });
    }
    const payment = await prisma.payment.create({
      data: {
        orderId,
        provider,
        providerRef: req.body.providerRef ? String(req.body.providerRef) : null,
        amountCents: order.totalCents,
        currency: order.currency,
        status: "CREATED"
      }
    });
    res.status(201).json({ payment });
  } catch (err) {
    next(err);
  }
}

export async function listMyPayments(req, res, next) {
  try {
    const data = await prisma.payment.findMany({
      where: { order: { userId: req.user.id } },
      orderBy: { createdAt: "desc" },
      include: { order: true }
    });
    res.json({ data });
  } catch (err) {
    next(err);
  }
}

export async function updatePaymentStatus(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    const status = String(req.body.status || "").trim().toUpperCase();
    if (Number.isNaN(id) || !status) return res.status(400).json({ message: "Invalid payload" });

    const current = await prisma.payment.findUnique({ where: { id } });
    if (!current) return res.status(404).json({ message: "Payment not found" });

    if (status === "REFUNDED") {
      const [capturedAgg, refundedAgg] = await Promise.all([
        prisma.payment.aggregate({
          where: { orderId: current.orderId, status: "CAPTURED" },
          _sum: { amountCents: true }
        }),
        prisma.payment.aggregate({
          where: {
            orderId: current.orderId,
            status: "REFUNDED",
            id: { not: current.id }
          },
          _sum: { amountCents: true }
        })
      ]);

      const capturedTotal = capturedAgg._sum.amountCents || 0;
      const alreadyRefunded = refundedAgg._sum.amountCents || 0;
      const afterRefund = alreadyRefunded + current.amountCents;

      if (capturedTotal <= 0) {
        return res.status(400).json({ message: "Cannot refund without captured payment" });
      }
      if (afterRefund > capturedTotal) {
        return res.status(400).json({ message: "Refund exceeds captured amount" });
      }
    }

    const payment = await prisma.payment.update({ where: { id }, data: { status } });

    if (status === "CAPTURED") {
      await prisma.order.updateMany({
        where: { id: payment.orderId, status: "PENDING" },
        data: { status: "PAID" }
      });
    }

    if (status === "REFUNDED") {
      await prisma.order.updateMany({
        where: { id: payment.orderId },
        data: { status: "REFUNDED" }
      });
    }

    res.json({ payment });
  } catch (err) {
    next(err);
  }
}
