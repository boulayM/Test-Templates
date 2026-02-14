import { Router } from "express";
import { authRequired } from "../../middlewares/auth.js";
import { validateBody, validateParams } from "../../middlewares/zodValidate.js";
import {
  createPayment,
  getMyPaymentByOrder,
  getPaymentProviderStatus,
  listMyPayments
} from "../../controllers/paymentsController.js";
import { orderIdParamSchema, paymentCreateSchema } from "../../schemas/ecommerce.schema.js";

const router = Router();

router.get("/providers/status", authRequired, getPaymentProviderStatus);
router.get("/", authRequired, listMyPayments);
router.get("/:orderId", authRequired, validateParams(orderIdParamSchema), getMyPaymentByOrder);
router.post("/", authRequired, validateBody(paymentCreateSchema), createPayment);

export default router;
