import { Router } from "express";
import { authRequired } from "../middlewares/auth.js";
import { verifyCsrf } from "../middlewares/csrf.middleware.js";
import { getUsers, exportUsers, updateUser, deleteUser, register } from "../controllers/userController.js";
import { me } from "../controllers/authController.js";
import { requirePermission } from "../middlewares/permissions.js";
import { validateBody, validateParams } from "../middlewares/zodValidate.js";
import { userCreateSchema, userUpdateSchema, userIdParamSchema } from "../schemas/user.schema.js";

const router = Router();

router.post(
  "/register",
  authRequired,
  verifyCsrf,
  requirePermission("users.create"),
  validateBody(userCreateSchema),
  register
);

router.get("/", authRequired, requirePermission("users.read"), getUsers);
router.get("/export", authRequired, requirePermission("users.export"), exportUsers);

router.patch(
  "/:id",
  authRequired,
  verifyCsrf,
  requirePermission("users.update"),
  validateParams(userIdParamSchema),
  validateBody(userUpdateSchema),
  updateUser
);

router.delete(
  "/:id",
  authRequired,
  verifyCsrf,
  requirePermission("users.delete"),
  validateParams(userIdParamSchema),
  deleteUser
);

router.get("/me", authRequired, me);

export default router;