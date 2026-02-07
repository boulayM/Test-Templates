export default function errorHandler(err, req, res, _next) {
  console.error(err);
  const prismaConflict = err?.code === "P2002";
  const status = err?.status || err?.statusCode || (prismaConflict ? 409 : 500);

  const code =
    status === 400
      ? "BAD_REQUEST"
      : status === 401
        ? "UNAUTHORIZED"
        : status === 403
          ? "FORBIDDEN"
          : status === 404
            ? "NOT_FOUND"
            : status === 409
              ? "CONFLICT"
              : "INTERNAL_ERROR";

  const isProd = process.env.NODE_ENV === "production";
  const message = isProd
    ? status === 409
      ? "Conflit de donnees"
      : "Erreur interne"
    : status === 409
      ? "Conflit d unicite"
      : err?.message || "Erreur interne";
  const details = isProd ? undefined : err?.stack;

  res.status(status).json({ code, message, details });
}
