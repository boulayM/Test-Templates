import { Router } from "express";
import { authRequired } from "../../middlewares/auth.js";
import { requirePermission } from "../../middlewares/permissions.js";
import { validateBody, validateParams } from "../../middlewares/zodValidate.js";
import { listPayments, updatePaymentStatus } from "../../controllers/paymentsController.js";
import { idParamSchema, paymentStatusUpdateSchema } from "../../schemas/ecommerce.schema.js";

const router = Router();

router.get("/", authRequired, requirePermission("payments.read"), listPayments);
router.patch(
  "/:id/status",
  authRequired,
  requirePermission("payments.validate"),
  validateParams(idParamSchema),
  validateBody(paymentStatusUpdateSchema),
  updatePaymentStatus
);

export default router;
