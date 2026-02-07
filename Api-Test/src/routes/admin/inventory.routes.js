import { Router } from "express";
import { authRequired } from "../../middlewares/auth.js";
import { requirePermission } from "../../middlewares/permissions.js";
import { validateBody, validateParams } from "../../middlewares/zodValidate.js";
import {
  listInventory,
  createInventory,
  updateInventory
} from "../../controllers/inventoryController.js";
import {
  idParamSchema,
  inventoryCreateSchema,
  inventoryUpdateSchema
} from "../../schemas/ecommerce.schema.js";

const router = Router();

router.get("/", authRequired, requirePermission("inventory.read"), listInventory);
router.post("/", authRequired, requirePermission("inventory.update"), validateBody(inventoryCreateSchema), createInventory);
router.patch(
  "/:id",
  authRequired,
  requirePermission("inventory.update"),
  validateParams(idParamSchema),
  validateBody(inventoryUpdateSchema),
  updateInventory
);

export default router;
