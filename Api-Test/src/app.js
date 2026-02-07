import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import helmet from "helmet";

import apiRoutes from "./routes/index.js";
import errorHandler from "./middlewares/errorHandler.js";

import swaggerDoc from "./swagger.js";
import swaggerUiDist from "swagger-ui-dist";

import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const swaggerUiPath = swaggerUiDist.getAbsoluteFSPath();

const app = express();

const rawOrigins = process.env.FRONT_URL || "";
const allowedOrigins = rawOrigins
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

if (process.env.NODE_ENV === "production" && allowedOrigins.length === 0) {
  throw new Error("FRONT_URL is required in production");
}

app.set("trust proxy", 1);

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);
      if (allowedOrigins.includes(origin)) return cb(null, true);
      return cb(new Error("Not allowed by CORS"));
    },
    credentials: true,
    exposedHeaders: ["RateLimit-Limit", "RateLimit-Remaining", "RateLimit-Reset"]
  })
);

app.use(helmet());
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "https:"],
      imgSrc: ["'self'", "data:"],
      connectSrc: ["'self'"],
      objectSrc: ["'none'"]
    }
  })
);

app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));
app.use(cookieParser());

app.get("/api/docs", (req, res) => {
  res.sendFile(path.join(__dirname, "public/swagger/index.html"));
});

app.get("/api/swagger.json", (req, res) => {
  res.json(swaggerDoc);
});

app.use("/swagger-ui", express.static(swaggerUiPath));
app.use("/swagger", express.static(path.join(__dirname, "public/swagger")));

app.use("/api", apiRoutes);

app.use(errorHandler);

export default app;
