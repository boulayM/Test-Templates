import { Router } from "express";
import { authRequired } from "../../middlewares/auth.js";
import { listMyShipments, getTrackingProviderStatus } from "../../controllers/shipmentsController.js";

const router = Router();

router.get("/providers/status", authRequired, getTrackingProviderStatus);
router.get("/", authRequired, listMyShipments);

export default router;
