import { Router } from "express";
import {
  login,
  me,
  logout,
  logoutAll,
  refresh,
  register,
  verifyEmail
} from "../controllers/authController.js";
import { authRequired } from "../middlewares/auth.js";
import { verifyCsrf } from "../middlewares/csrf.middleware.js";
import { verifyCaptcha } from "../middlewares/captcha.js";
import { authLimiter, refreshLimiter } from "../middlewares/limiters.js";
import { validateBody } from "../middlewares/zodValidate.js";
import { authLoginSchema, authRegisterSchema } from "../schemas/auth.schema.js";

const router = Router();

router.post("/login", authLimiter, validateBody(authLoginSchema), login);
router.post(
  "/register",
  authLimiter,
  verifyCaptcha,
  validateBody(authRegisterSchema),
  register
);
router.get("/verify-email", verifyEmail);

router.get("/me", authRequired, me);
router.post("/logout", authRequired, verifyCsrf, logout);
router.post("/logout-all", authRequired, verifyCsrf, logoutAll);
router.post("/refresh", refreshLimiter, refresh);

export default router;