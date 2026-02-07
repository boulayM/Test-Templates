import { Router } from "express";
import { authRequired } from "../../middlewares/auth.js";
import {
  listAddresses,
  createAddress,
  updateAddress,
  deleteAddress
} from "../../controllers/addressesController.js";

const router = Router();

router.get("/", authRequired, listAddresses);
router.post("/", authRequired, createAddress);
router.patch("/:id", authRequired, updateAddress);
router.delete("/:id", authRequired, deleteAddress);

export default router;
