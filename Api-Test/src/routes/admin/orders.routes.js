import { Router } from "express";
import { authRequired } from "../../middlewares/auth.js";
import { requirePermission } from "../../middlewares/permissions.js";
import {
  listOrders,
  getOrder,
  updateOrderStatus
} from "../../controllers/ordersController.js";

const router = Router();

router.get("/", authRequired, requirePermission("orders.read"), listOrders);
router.get("/:id", authRequired, requirePermission("orders.read"), getOrder);
router.patch("/:id/status", authRequired, requirePermission("orders.updateStatus"), updateOrderStatus);

export default router;
