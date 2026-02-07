import { Router } from "express";
import { authRequired } from "../../middlewares/auth.js";
import { requirePermission } from "../../middlewares/permissions.js";
import { validateBody, validateParams, validateQuery } from "../../middlewares/zodValidate.js";
import {
  listOrders,
  getOrder,
  updateOrderStatus
} from "../../controllers/ordersController.js";
import { idParamSchema, listPageQuerySchema, orderStatusUpdateSchema } from "../../schemas/ecommerce.schema.js";

const router = Router();

router.get("/", authRequired, requirePermission("orders.read"), validateQuery(listPageQuerySchema), listOrders);
router.get("/:id", authRequired, requirePermission("orders.read"), validateParams(idParamSchema), getOrder);
router.patch(
  "/:id/status",
  authRequired,
  requirePermission("orders.updateStatus"),
  validateParams(idParamSchema),
  validateBody(orderStatusUpdateSchema),
  updateOrderStatus
);

export default router;
