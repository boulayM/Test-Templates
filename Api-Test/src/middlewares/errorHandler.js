export default function errorHandler(err, req, res, _next) {
  console.error(err);
  const status = err?.status || err?.statusCode || 500;

  const code =
    err?.code ||
    (status === 400
      ? "BAD_REQUEST"
      : status === 401
        ? "UNAUTHORIZED"
        : status === 403
          ? "FORBIDDEN"
          : status === 404
            ? "NOT_FOUND"
            : "INTERNAL_ERROR");

  const isProd = process.env.NODE_ENV === "production";
  const message = isProd ? "Erreur interne" : err?.message || "Erreur interne";
  const details = isProd ? undefined : err?.stack;

  res.status(status).json({ code, message, details });
}