import { Router } from "express";
import { authRequired } from "../../middlewares/auth.js";
import { requirePermission } from "../../middlewares/permissions.js";
import { listReviews, deleteReview } from "../../controllers/reviewsController.js";

const router = Router();

router.get("/", authRequired, requirePermission("reviews.read"), listReviews);
router.delete("/:id", authRequired, requirePermission("reviews.moderate"), deleteReview);

export default router;
