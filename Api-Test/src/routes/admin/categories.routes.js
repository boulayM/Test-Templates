import { Router } from "express";
import { authRequired } from "../../middlewares/auth.js";
import { requirePermission } from "../../middlewares/permissions.js";
import { validateBody, validateParams } from "../../middlewares/zodValidate.js";
import {
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory
} from "../../controllers/categoriesController.js";
import { categoryCreateSchema, categoryUpdateSchema, idParamSchema } from "../../schemas/ecommerce.schema.js";

const router = Router();

router.get("/", authRequired, requirePermission("catalog.read"), listCategories);
router.post("/", authRequired, requirePermission("catalog.write"), validateBody(categoryCreateSchema), createCategory);
router.patch(
  "/:id",
  authRequired,
  requirePermission("catalog.write"),
  validateParams(idParamSchema),
  validateBody(categoryUpdateSchema),
  updateCategory
);
router.delete("/:id", authRequired, requirePermission("catalog.write"), validateParams(idParamSchema), deleteCategory);

export default router;
