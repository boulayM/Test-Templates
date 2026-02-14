import prisma from "../config/prisma.js";

const trackingProviderEnabled =
  String(process.env.DEMO_TRACKING_PROVIDER_ENABLED || "").toLowerCase() === "true";

async function hasCapturedPayment(orderId) {
  const payment = await prisma.payment.findFirst({
    where: { orderId, status: "CAPTURED" },
    select: { id: true }
  });
  return Boolean(payment);
}

export async function listShipments(req, res, next) {
  try {
    const data = await prisma.shipment.findMany({
      orderBy: { id: "desc" },
      include: { order: true }
    });
    res.json({ data });
  } catch (err) {
    next(err);
  }
}

export async function createShipment(req, res, next) {
  try {
    const orderId = Number(req.body.orderId);
    if (!(await hasCapturedPayment(orderId))) {
      return res.status(400).json({ message: "Order must be paid before shipment" });
    }
    const shipment = await prisma.shipment.create({
      data: {
        orderId,
        carrier: req.body.carrier ? String(req.body.carrier) : null,
        trackingNumber: req.body.trackingNumber ? String(req.body.trackingNumber) : null,
        status: req.body.status ? String(req.body.status) : "CREATED",
        shippedAt: req.body.shippedAt ? new Date(req.body.shippedAt) : null,
        deliveredAt: req.body.deliveredAt ? new Date(req.body.deliveredAt) : null
      }
    });
    res.status(201).json({ shipment });
  } catch (err) {
    next(err);
  }
}

export async function updateShipment(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) return res.status(400).json({ message: "Invalid id" });
    const current = await prisma.shipment.findUnique({ where: { id } });
    if (!current) return res.status(404).json({ message: "Shipment not found" });

    const data = {};
    if (req.body.carrier !== undefined) data.carrier = req.body.carrier ? String(req.body.carrier) : null;
    if (req.body.trackingNumber !== undefined) {
      data.trackingNumber = req.body.trackingNumber ? String(req.body.trackingNumber) : null;
    }
    if (req.body.status !== undefined) data.status = String(req.body.status);
    if (req.body.shippedAt !== undefined) data.shippedAt = req.body.shippedAt ? new Date(req.body.shippedAt) : null;
    if (req.body.deliveredAt !== undefined) {
      data.deliveredAt = req.body.deliveredAt ? new Date(req.body.deliveredAt) : null;
    }

    if (data.status === "DELIVERED" && !data.deliveredAt) data.deliveredAt = new Date();
    if (data.status === "IN_TRANSIT" && !data.shippedAt) data.shippedAt = new Date();

    const shipment = await prisma.shipment.update({ where: { id }, data });
    if (shipment.status === "DELIVERED") {
      await prisma.order.updateMany({
        where: { id: shipment.orderId, status: { in: ["SHIPPED", "PREPARING", "PAID"] } },
        data: { status: "DELIVERED" }
      });
    }
    res.json({ shipment });
  } catch (err) {
    next(err);
  }
}

export async function deleteShipment(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) return res.status(400).json({ message: "Invalid id" });
    await prisma.shipment.delete({ where: { id } });
    res.json({ message: "Shipment deleted" });
  } catch (err) {
    next(err);
  }
}

export async function listMyShipments(req, res, next) {
  try {
    const orderId = req.query.orderId ? Number(req.query.orderId) : null;
    if (req.query.orderId !== undefined && Number.isNaN(orderId)) {
      return res.status(400).json({ message: "Invalid orderId" });
    }
    const data = await prisma.shipment.findMany({
      where: {
        order: {
          userId: req.user.id,
          ...(orderId ? { id: orderId } : {})
        }
      },
      orderBy: { id: "desc" },
      include: { order: true }
    });
    res.json({ data });
  } catch (err) {
    next(err);
  }
}

export function getTrackingProviderStatus(_req, res) {
  if (!trackingProviderEnabled) {
    return res.status(501).json({
      code: "TRACKING_PROVIDER_NOT_CONFIGURED",
      message: "External tracking provider is not configured for this demo environment"
    });
  }
  return res.json({ providerEnabled: true });
}
