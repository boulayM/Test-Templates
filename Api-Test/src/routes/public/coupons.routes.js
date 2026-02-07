import { Router } from "express";
import { validateQuery } from "../../middlewares/zodValidate.js";
import { validateCoupon } from "../../controllers/couponsController.js";
import { couponValidateQuerySchema } from "../../schemas/ecommerce.schema.js";

const router = Router();

router.get("/validate", validateQuery(couponValidateQuerySchema), validateCoupon);

export default router;
