import { Router } from "express";
import { authRequired } from "../../middlewares/auth.js";
import { requirePermission } from "../../middlewares/permissions.js";
import { validateBody, validateParams, validateQuery } from "../../middlewares/zodValidate.js";
import {
  listProducts,
  createProduct,
  updateProduct,
  deleteProduct
} from "../../controllers/productsController.js";
import {
  idParamSchema,
  productCreateSchema,
  productListQuerySchema,
  productUpdateSchema
} from "../../schemas/ecommerce.schema.js";

const router = Router();

router.get("/", authRequired, requirePermission("catalog.read"), validateQuery(productListQuerySchema), listProducts);
router.post("/", authRequired, requirePermission("catalog.write"), validateBody(productCreateSchema), createProduct);
router.patch(
  "/:id",
  authRequired,
  requirePermission("catalog.write"),
  validateParams(idParamSchema),
  validateBody(productUpdateSchema),
  updateProduct
);
router.delete("/:id", authRequired, requirePermission("catalog.write"), validateParams(idParamSchema), deleteProduct);

export default router;
