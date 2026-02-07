import { Router } from "express";
import { authRequired } from "../../middlewares/auth.js";
import { requirePermission } from "../../middlewares/permissions.js";
import { validateParams } from "../../middlewares/zodValidate.js";
import { listReviews, deleteReview } from "../../controllers/reviewsController.js";
import { idParamSchema } from "../../schemas/ecommerce.schema.js";

const router = Router();

router.get("/", authRequired, requirePermission("reviews.read"), listReviews);
router.delete("/:id", authRequired, requirePermission("reviews.moderate"), validateParams(idParamSchema), deleteReview);

export default router;
