import { Router } from "express";
import { authRequired } from "../../middlewares/auth.js";
import { requirePermission } from "../../middlewares/permissions.js";
import {
  listShipments,
  createShipment,
  updateShipment,
  deleteShipment
} from "../../controllers/shipmentsController.js";

const router = Router();

router.get("/", authRequired, requirePermission("shipments.read"), listShipments);
router.post("/", authRequired, requirePermission("shipments.create"), createShipment);
router.patch("/:id", authRequired, requirePermission("shipments.update"), updateShipment);
router.delete("/:id", authRequired, requirePermission("shipments.update"), deleteShipment);

export default router;
