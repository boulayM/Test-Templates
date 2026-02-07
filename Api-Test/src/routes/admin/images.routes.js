import { Router } from "express";
import { authRequired } from "../../middlewares/auth.js";
import { requirePermission } from "../../middlewares/permissions.js";
import { validateBody, validateParams, validateQuery } from "../../middlewares/zodValidate.js";
import {
  listProductImages,
  createProductImage,
  deleteProductImage
} from "../../controllers/productImagesController.js";
import {
  idParamSchema,
  imageCreateSchema,
  productIdQuerySchema
} from "../../schemas/ecommerce.schema.js";

const router = Router();

router.get("/", authRequired, requirePermission("catalog.read"), validateQuery(productIdQuerySchema), listProductImages);
router.post("/", authRequired, requirePermission("catalog.write"), validateBody(imageCreateSchema), createProductImage);
router.delete("/:id", authRequired, requirePermission("catalog.write"), validateParams(idParamSchema), deleteProductImage);

export default router;
