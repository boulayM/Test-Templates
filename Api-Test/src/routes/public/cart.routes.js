import { Router } from "express";
import { authRequired } from "../../middlewares/auth.js";
import { validateBody, validateParams } from "../../middlewares/zodValidate.js";
import {
  getCart,
  addCartItem,
  updateCartItem,
  deleteCartItem
} from "../../controllers/cartController.js";
import { cartAddItemSchema, cartUpdateItemSchema, idParamSchema } from "../../schemas/ecommerce.schema.js";

const router = Router();

router.get("/", authRequired, getCart);
router.post("/items", authRequired, validateBody(cartAddItemSchema), addCartItem);
router.patch(
  "/items/:id",
  authRequired,
  validateParams(idParamSchema),
  validateBody(cartUpdateItemSchema),
  updateCartItem
);
router.delete("/items/:id", authRequired, validateParams(idParamSchema), deleteCartItem);

export default router;
