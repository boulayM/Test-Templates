import { Router } from "express";
import { authRequired } from "../../middlewares/auth.js";
import { requirePermission } from "../../middlewares/permissions.js";
import {
  listProductImages,
  createProductImage,
  deleteProductImage
} from "../../controllers/productImagesController.js";

const router = Router();

router.get("/", authRequired, requirePermission("catalog.read"), listProductImages);
router.post("/", authRequired, requirePermission("catalog.write"), createProductImage);
router.delete("/:id", authRequired, requirePermission("catalog.write"), deleteProductImage);

export default router;
