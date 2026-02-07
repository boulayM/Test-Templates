import { Router } from "express";
import { authRequired } from "../../middlewares/auth.js";
import { requirePermission } from "../../middlewares/permissions.js";
import {
  listCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon
} from "../../controllers/couponsController.js";

const router = Router();

router.get("/", authRequired, requirePermission("coupons.read"), listCoupons);
router.post("/", authRequired, requirePermission("coupons.write"), createCoupon);
router.patch("/:id", authRequired, requirePermission("coupons.write"), updateCoupon);
router.delete("/:id", authRequired, requirePermission("coupons.write"), deleteCoupon);

export default router;
