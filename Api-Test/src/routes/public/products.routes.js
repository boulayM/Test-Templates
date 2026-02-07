import { Router } from "express";
import { validateParams } from "../../middlewares/zodValidate.js";
import { listProducts, getProduct } from "../../controllers/productsController.js";
import { idParamSchema } from "../../schemas/ecommerce.schema.js";

const router = Router();

router.get("/", listProducts);
router.get("/:id", validateParams(idParamSchema), getProduct);

export default router;
