import { Router } from "express";
import { authRequired } from "../../middlewares/auth.js";
import { listMyOrders, getMyOrder, createOrder } from "../../controllers/ordersController.js";

const router = Router();

router.get("/", authRequired, listMyOrders);
router.get("/:id", authRequired, getMyOrder);
router.post("/", authRequired, createOrder);

export default router;
