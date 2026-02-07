import { Router } from "express";
import { authRequired } from "../../middlewares/auth.js";
import { requirePermission } from "../../middlewares/permissions.js";
import {
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory
} from "../../controllers/categoriesController.js";

const router = Router();

router.get("/", authRequired, requirePermission("catalog.read"), listCategories);
router.post("/", authRequired, requirePermission("catalog.write"), createCategory);
router.patch("/:id", authRequired, requirePermission("catalog.write"), updateCategory);
router.delete("/:id", authRequired, requirePermission("catalog.write"), deleteCategory);

export default router;
