import { Router } from "express";
import { authRequired } from "../../middlewares/auth.js";
import { requirePermission } from "../../middlewares/permissions.js";
import { validateBody, validateParams } from "../../middlewares/zodValidate.js";
import {
  listShipments,
  createShipment,
  updateShipment,
  deleteShipment
} from "../../controllers/shipmentsController.js";
import {
  idParamSchema,
  shipmentCreateSchema,
  shipmentUpdateSchema
} from "../../schemas/ecommerce.schema.js";

const router = Router();

router.get("/", authRequired, requirePermission("shipments.read"), listShipments);
router.post("/", authRequired, requirePermission("shipments.create"), validateBody(shipmentCreateSchema), createShipment);
router.patch(
  "/:id",
  authRequired,
  requirePermission("shipments.update"),
  validateParams(idParamSchema),
  validateBody(shipmentUpdateSchema),
  updateShipment
);
router.delete("/:id", authRequired, requirePermission("shipments.update"), validateParams(idParamSchema), deleteShipment);

export default router;
