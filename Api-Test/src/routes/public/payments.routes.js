import { Router } from "express";
import { authRequired } from "../../middlewares/auth.js";
import { validateBody } from "../../middlewares/zodValidate.js";
import { createPayment, listMyPayments } from "../../controllers/paymentsController.js";
import { paymentCreateSchema } from "../../schemas/ecommerce.schema.js";

const router = Router();

router.get("/", authRequired, listMyPayments);
router.post("/", authRequired, validateBody(paymentCreateSchema), createPayment);

export default router;
