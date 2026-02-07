import { Router } from "express";
import { authRequired } from "../../middlewares/auth.js";
import { requirePermission } from "../../middlewares/permissions.js";
import { listPayments, updatePaymentStatus } from "../../controllers/paymentsController.js";

const router = Router();

router.get("/", authRequired, requirePermission("payments.read"), listPayments);
router.patch("/:id/status", authRequired, requirePermission("payments.validate"), updatePaymentStatus);

export default router;
