import { Router } from "express";
import { authRequired } from "../../middlewares/auth.js";
import { requirePermission } from "../../middlewares/permissions.js";
import { validateBody, validateParams } from "../../middlewares/zodValidate.js";
import {
  listCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon
} from "../../controllers/couponsController.js";
import { couponCreateSchema, couponUpdateSchema, idParamSchema } from "../../schemas/ecommerce.schema.js";

const router = Router();

router.get("/", authRequired, requirePermission("coupons.read"), listCoupons);
router.post("/", authRequired, requirePermission("coupons.write"), validateBody(couponCreateSchema), createCoupon);
router.patch(
  "/:id",
  authRequired,
  requirePermission("coupons.write"),
  validateParams(idParamSchema),
  validateBody(couponUpdateSchema),
  updateCoupon
);
router.delete("/:id", authRequired, requirePermission("coupons.write"), validateParams(idParamSchema), deleteCoupon);

export default router;
