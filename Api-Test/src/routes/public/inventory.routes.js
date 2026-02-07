import { Router } from "express";
import { listInventory } from "../../controllers/inventoryController.js";

const router = Router();

router.get("/", listInventory);

export default router;
