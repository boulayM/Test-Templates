import { Router } from "express";
import { validateParams } from "../../middlewares/zodValidate.js";
import { listCategories, getCategory } from "../../controllers/categoriesController.js";
import { idParamSchema } from "../../schemas/ecommerce.schema.js";

const router = Router();

router.get("/", listCategories);
router.get("/:id", validateParams(idParamSchema), getCategory);

export default router;
