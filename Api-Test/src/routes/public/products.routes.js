import { Router } from "express";
import { validateParams, validateQuery } from "../../middlewares/zodValidate.js";
import { listProducts, getProduct } from "../../controllers/productsController.js";
import { idParamSchema, productListQuerySchema } from "../../schemas/ecommerce.schema.js";

const router = Router();

router.get("/", validateQuery(productListQuerySchema), listProducts);
router.get("/:id", validateParams(idParamSchema), getProduct);

export default router;
