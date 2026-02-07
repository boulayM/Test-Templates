import { Router } from "express";
import { authRequired } from "../../middlewares/auth.js";
import { createPayment, listMyPayments } from "../../controllers/paymentsController.js";

const router = Router();

router.get("/", authRequired, listMyPayments);
router.post("/", authRequired, createPayment);

export default router;
