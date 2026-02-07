import { Router } from "express";
import usersRoutes from "../user.routes.js";

const router = Router();

router.use("/", usersRoutes);

export default router;
