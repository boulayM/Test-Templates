import express from "express";
import { generateCsrfToken } from "../utils/generateCsrfToken.js";
import { csrfCookieOptions } from "../utils/cookieOptions.js";

const router = express.Router();

router.get("/", (req, res) => {
  const token = generateCsrfToken();

  res.cookie("csrfToken", token, csrfCookieOptions);
  res.json({ csrfToken: token });
});

export default router;
