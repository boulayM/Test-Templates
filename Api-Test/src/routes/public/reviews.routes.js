import { Router } from "express";
import { authRequired } from "../../middlewares/auth.js";
import { validateBody, validateParams, validateQuery } from "../../middlewares/zodValidate.js";
import {
  listReviews,
  createReview,
  updateOwnReview,
  deleteOwnReview
} from "../../controllers/reviewsController.js";
import {
  idParamSchema,
  reviewCreateSchema,
  reviewListQuerySchema,
  reviewUpdateSchema
} from "../../schemas/ecommerce.schema.js";

const router = Router();

router.get("/", validateQuery(reviewListQuerySchema), listReviews);
router.post("/", authRequired, validateBody(reviewCreateSchema), createReview);
router.patch(
  "/:id",
  authRequired,
  validateParams(idParamSchema),
  validateBody(reviewUpdateSchema),
  updateOwnReview
);
router.delete("/:id", authRequired, validateParams(idParamSchema), deleteOwnReview);

export default router;
