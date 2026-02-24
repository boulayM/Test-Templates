import rateLimit from "express-rate-limit";

// NOTE: disableRateLimit est utilisé pour les tests E2E automatisés sur plusieurs frontends
// (Angular/React/Vue) afin d'éviter que le rate-limit d'auth bloque la phase de setup.
const disableRateLimit =
  String(process.env.DISABLE_RATE_LIMIT || "").toLowerCase() === "true" ||
  (process.env.NODE_ENV === "test" && process.env.E2E === "true") ||
  process.env.NODE_ENV === "dev";

const passThrough = (req, res, next) => next();

// Limite pour login et register
export const authLimiter = disableRateLimit
  ? passThrough
  : rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 5, // max 5 requêtes par IP
      standardHeaders: true,
      legacyHeaders: false,
      handler: (req, res) => {
        const limit = req.rateLimit?.limit ?? 5;
        const remaining = req.rateLimit?.remaining ?? 0;
        res.status(429).json({
          message: "Limite de tentatives de login atteinte, réessayez dans 15 minutes !",
          limitTotal: limit,
          remaining
        });
      }
    });

// Limite pour refresh token
export const refreshLimiter = disableRateLimit
  ? passThrough
  : rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 20, // plus permissif
      message: "Trop de tentatives de refresh, réessayez plus tard."
    });

export const publicLimiter = disableRateLimit
  ? passThrough
  : rateLimit({
      windowMs: 60 * 1000,
      max: 60,
      standardHeaders: true,
      legacyHeaders: false,
      message: "Rate limit public dépassé"
    });
