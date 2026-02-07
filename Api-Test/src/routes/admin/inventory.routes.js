import { Router } from "express";
import { authRequired } from "../../middlewares/auth.js";
import { requirePermission } from "../../middlewares/permissions.js";
import {
  listInventory,
  createInventory,
  updateInventory
} from "../../controllers/inventoryController.js";

const router = Router();

router.get("/", authRequired, requirePermission("inventory.read"), listInventory);
router.post("/", authRequired, requirePermission("inventory.update"), createInventory);
router.patch("/:id", authRequired, requirePermission("inventory.update"), updateInventory);

export default router;
