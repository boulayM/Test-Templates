import { Router } from "express";
import { authRequired } from "../../middlewares/auth.js";
import {
  listReviews,
  createReview,
  updateOwnReview,
  deleteOwnReview
} from "../../controllers/reviewsController.js";

const router = Router();

router.get("/", listReviews);
router.post("/", authRequired, createReview);
router.patch("/:id", authRequired, updateOwnReview);
router.delete("/:id", authRequired, deleteOwnReview);

export default router;
