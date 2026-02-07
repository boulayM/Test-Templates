import { Router } from "express";
import { validateParams, validateQuery } from "../../middlewares/zodValidate.js";
import { listCategories, getCategory } from "../../controllers/categoriesController.js";
import { idParamSchema, listPageQuerySchema } from "../../schemas/ecommerce.schema.js";

const router = Router();

router.get("/", validateQuery(listPageQuerySchema), listCategories);
router.get("/:id", validateParams(idParamSchema), getCategory);

export default router;
