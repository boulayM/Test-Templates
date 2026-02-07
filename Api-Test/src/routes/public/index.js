import { Router } from "express";
import categoriesRoutes from "./categories.routes.js";
import productsRoutes from "./products.routes.js";
import cartRoutes from "./cart.routes.js";
import addressesRoutes from "./addresses.routes.js";
import ordersRoutes from "./orders.routes.js";
import paymentsRoutes from "./payments.routes.js";
import couponsRoutes from "./coupons.routes.js";
import reviewsRoutes from "./reviews.routes.js";
import inventoryRoutes from "./inventory.routes.js";
import shipmentsRoutes from "./shipments.routes.js";

const router = Router();

router.use("/categories", categoriesRoutes);
router.use("/products", productsRoutes);
router.use("/cart", cartRoutes);
router.use("/addresses", addressesRoutes);
router.use("/orders", ordersRoutes);
router.use("/payments", paymentsRoutes);
router.use("/coupons", couponsRoutes);
router.use("/reviews", reviewsRoutes);
router.use("/inventory", inventoryRoutes);
router.use("/shipments", shipmentsRoutes);

export default router;
