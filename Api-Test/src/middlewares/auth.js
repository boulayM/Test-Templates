import jwt from "jsonwebtoken";
import prisma from "../config/prisma.js";

export async function authRequired(req, res, next) {
  const token = req.cookies.accessToken;

  if (!token) return res.status(401).json({ message: "Non authentifié" });

  let payload;
  try {
    payload = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
  } catch {
    return res.status(403).json({ message: "Token invalide" });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: payload.id },
      select: { id: true, role: true, isActive: true }
    });

    if (!user) return res.status(401).json({ message: "Non authentifié" });
    if (!user.isActive) return res.status(403).json({ message: "Compte désactivé" });

    req.user = { ...payload, role: user.role };
    next();
  } catch (err) {
    next(err);
  }
}

export function adminOnly(req, res, next) {
  if (req.user.role !== "ADMIN") return res.status(403).json({ message: "Accès refusé" });

  next();
}
