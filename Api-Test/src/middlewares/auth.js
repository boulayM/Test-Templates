import jwt from "jsonwebtoken";

export function authRequired(req, res, next) {
  const token = req.cookies.accessToken;

  if (!token) return res.status(401).json({ message: "Non authentifie" });

  try {
    req.user = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    next();
  } catch {
    return res.status(403).json({ message: "Token invalide" });
  }
}

export function adminOnly(req, res, next) {
  if (req.user.role !== "ADMIN") return res.status(403).json({ message: "Acces refuse" });

  next();
}
