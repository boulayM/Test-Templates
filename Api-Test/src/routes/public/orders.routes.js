import { Router } from "express";
import { authRequired } from "../../middlewares/auth.js";
import { validateBody, validateParams, validateQuery } from "../../middlewares/zodValidate.js";
import { listMyOrders, getMyOrder, createOrder } from "../../controllers/ordersController.js";
import { idParamSchema, listPageQuerySchema, orderCreateSchema } from "../../schemas/ecommerce.schema.js";

const router = Router();

router.get("/", authRequired, validateQuery(listPageQuerySchema), listMyOrders);
router.get("/:id", authRequired, validateParams(idParamSchema), getMyOrder);
router.post("/", authRequired, validateBody(orderCreateSchema), createOrder);

export default router;
