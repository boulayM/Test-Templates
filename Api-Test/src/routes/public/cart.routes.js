import { Router } from "express";
import { authRequired } from "../../middlewares/auth.js";
import {
  getCart,
  addCartItem,
  updateCartItem,
  deleteCartItem
} from "../../controllers/cartController.js";

const router = Router();

router.get("/", authRequired, getCart);
router.post("/items", authRequired, addCartItem);
router.patch("/items/:id", authRequired, updateCartItem);
router.delete("/items/:id", authRequired, deleteCartItem);

export default router;
