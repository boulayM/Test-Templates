import { Router } from "express";
import { authRequired } from "../../middlewares/auth.js";
import { requirePermission } from "../../middlewares/permissions.js";
import {
  listProducts,
  createProduct,
  updateProduct,
  deleteProduct
} from "../../controllers/productsController.js";

const router = Router();

router.get("/", authRequired, requirePermission("catalog.read"), listProducts);
router.post("/", authRequired, requirePermission("catalog.write"), createProduct);
router.patch("/:id", authRequired, requirePermission("catalog.write"), updateProduct);
router.delete("/:id", authRequired, requirePermission("catalog.write"), deleteProduct);

export default router;
