import { Router } from "express";
import { authRequired } from "../../middlewares/auth.js";
import { listMyShipments } from "../../controllers/shipmentsController.js";

const router = Router();

router.get("/", authRequired, listMyShipments);

export default router;
