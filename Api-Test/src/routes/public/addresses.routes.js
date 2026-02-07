import { Router } from "express";
import { authRequired } from "../../middlewares/auth.js";
import { validateBody, validateParams } from "../../middlewares/zodValidate.js";
import {
  listAddresses,
  createAddress,
  updateAddress,
  deleteAddress
} from "../../controllers/addressesController.js";
import { addressCreateSchema, addressUpdateSchema, idParamSchema } from "../../schemas/ecommerce.schema.js";

const router = Router();

router.get("/", authRequired, listAddresses);
router.post("/", authRequired, validateBody(addressCreateSchema), createAddress);
router.patch(
  "/:id",
  authRequired,
  validateParams(idParamSchema),
  validateBody(addressUpdateSchema),
  updateAddress
);
router.delete("/:id", authRequired, validateParams(idParamSchema), deleteAddress);

export default router;
