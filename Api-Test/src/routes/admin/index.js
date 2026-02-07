import { Router } from "express";
import usersRoutes from "./users.routes.js";
import auditLogRoutes from "./audit-logs.routes.js";
import categoriesRoutes from "./categories.routes.js";
import productsRoutes from "./products.routes.js";
import imagesRoutes from "./images.routes.js";
import inventoryRoutes from "./inventory.routes.js";
import ordersRoutes from "./orders.routes.js";
import paymentsRoutes from "./payments.routes.js";
import shipmentsRoutes from "./shipments.routes.js";
import couponsRoutes from "./coupons.routes.js";
import reviewsRoutes from "./reviews.routes.js";

const router = Router();

router.use("/users", usersRoutes);
router.use("/audit-logs", auditLogRoutes);
router.use("/categories", categoriesRoutes);
router.use("/products", productsRoutes);
router.use("/images", imagesRoutes);
router.use("/inventory", inventoryRoutes);
router.use("/orders", ordersRoutes);
router.use("/payments", paymentsRoutes);
router.use("/shipments", shipmentsRoutes);
router.use("/coupons", couponsRoutes);
router.use("/reviews", reviewsRoutes);

export default router;
