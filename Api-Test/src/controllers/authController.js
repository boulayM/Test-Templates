import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import prisma from "../config/prisma.js";
import { generateAccessToken, generateRefreshToken } from "../utils/generateTokens.js";
import { generateCsrfToken } from "../utils/generateCsrfToken.js";
import { hashToken } from "../utils/hashToken.js";
import { sendEmail } from "../utils/sendEmail.js";
import {
  accessCookieOptions,
  accessCookieClearOptions,
  csrfCookieOptions,
  csrfCookieClearOptions,
  refreshCookieOptions,
  refreshCookieClearOptions
} from "../utils/cookieOptions.js";
import { createAuditLog } from "../services/auditLogService.js";
import { parseBody } from "../utils/validate.js";
import { authLoginSchema, authRegisterSchema } from "../schemas/auth.schema.js";

const refreshTokenTtlMs = (() => {
  const match = /^(\d+)([smhd])$/.exec(process.env.REFRESH_TOKEN_EXPIRE || "");
  if (!match) return null;
  const value = Number(match[1]);
  const unit = match[2];
  const multipliers = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
  return value * multipliers[unit];
})();

const emailVerificationTtlMs = (() => {
  const match = /^(\d+)([smhd])$/.exec(process.env.EMAIL_VERIFICATION_EXPIRE || "24h");
  if (!match) return 24 * 60 * 60 * 1000;
  const value = Number(match[1]);
  const unit = match[2];
  const multipliers = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
  return value * multipliers[unit];
})();

const isRegistrationEnabled =
  String(process.env.REGISTRATION_ENABLED || "true").toLowerCase() === "true";

const isEmailVerificationRequired =
  String(process.env.EMAIL_VERIFICATION_REQUIRED || "true").toLowerCase() === "true";

function getTokenExpiresAt(token, fallbackMs) {
  const decoded = jwt.decode(token);
  if (decoded && decoded.exp) {
    return new Date(decoded.exp * 1000);
  }
  if (fallbackMs) {
    return new Date(Date.now() + fallbackMs);
  }
  return null;
}

export const login = async (req, res, next) => {
  try {
    const payload = parseBody(authLoginSchema, req, res);
    if (!payload) return;
    const { email, password } = payload;

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        emailVerified: true,
        passwordHash: true
      }
    });

    if (!user) {
      await createAuditLog({
        userId: null,
        action: "LOGIN_FAIL",
        resourceType: "User",
        resourceId: null,
        status: "FAIL",
        req,
        actor: { email }
      });
      return res.status(400).json({ message: "Identifiants invalides" });
    }

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) {
      await createAuditLog({
        userId: user.id,
        action: "LOGIN_FAIL",
        resourceType: "User",
        resourceId: String(user.id),
        status: "FAIL",
        req,
        actor: { email }
      });
      return res.status(400).json({ message: "Identifiants invalides" });
    }

    if (isEmailVerificationRequired && !user.emailVerified) {
      await createAuditLog({
        userId: user.id,
        action: "LOGIN_BLOCKED",
        resourceType: "User",
        resourceId: String(user.id),
        status: "DENIED",
        req,
        metadata: { reason: "email_not_verified" }
      });
      return res.status(403).json({ message: "Email non verifie" });
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    const csrfToken = generateCsrfToken();

    const refreshTokenExpiresAt = getTokenExpiresAt(refreshToken, refreshTokenTtlMs);
    if (!refreshTokenExpiresAt) {
      throw new Error("Invalid refresh token expiry");
    }

    await prisma.refreshToken.create({
      data: {
        tokenHash: hashToken(refreshToken),
        userId: user.id,
        expiresAt: refreshTokenExpiresAt
      }
    });

    res.cookie("accessToken", accessToken, accessCookieOptions);
    res.cookie("refreshToken", refreshToken, refreshCookieOptions);
    res.cookie("csrfToken", csrfToken, csrfCookieOptions);

    await createAuditLog({
      userId: user.id,
      action: "LOGIN",
      resourceType: "User",
      resourceId: String(user.id),
      req
    });
    const safeUser = {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      emailVerified: user.emailVerified
    };

    const response = { user: safeUser };
    if (process.env.NODE_ENV === "test") {
      response.csrfToken = csrfToken;
    }

    res.json(response);
  } catch (err) {
    next(err);
  }
};

export const register = async (req, res, next) => {
  try {
    if (!isRegistrationEnabled) {
      return res.status(403).json({ message: "Inscription fermee" });
    }

    const payload = parseBody(authRegisterSchema, req, res);
    if (!payload) return;
    const { firstName, lastName, email, password } = payload;
    const exists = await prisma.user.findUnique({ where: { email } });

    if (exists) {
      if (!exists.emailVerified) {
        const rawToken = crypto.randomBytes(32).toString("hex");
        const tokenHash = hashToken(rawToken);
        const expiresAt = new Date(Date.now() + emailVerificationTtlMs);

        await prisma.verificationToken.create({
          data: {
            tokenHash,
            userId: exists.id,
            expiresAt
          }
        });

        const verifyBase = process.env.VERIFY_EMAIL_URL || `${process.env.FRONT_URL}/verify-email`;
        const verifyLink = `${verifyBase}?token=${rawToken}`;

        await sendEmail({
          to: exists.email,
          subject: "Verification email",
          html: `
            <p>Bonjour ${exists.firstName},</p>
            <p>Merci de confirmer votre adresse email en cliquant ici :</p>
            <p><a href="${verifyLink}">${verifyLink}</a></p>
            <p>Si vous n etes pas a l origine de cette demande, ignorez ce message.</p>
          `
        });

        await createAuditLog({
          userId: exists.id,
          action: "REGISTER_RESEND",
          resourceType: "User",
          resourceId: String(exists.id),
          req
        });
      }

      return res.status(201).json({
        message: "Si l email est valide, un lien de verification a ete envoye"
      });
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        passwordHash: hashed,
        role: "USER",
        emailVerified: false,
        isActive: true
      }
    });

    await createAuditLog({
      userId: user.id,
      action: "REGISTER",
      resourceType: "User",
      resourceId: String(user.id),
      req
    });

    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + emailVerificationTtlMs);

    await prisma.verificationToken.create({
      data: {
        tokenHash,
        userId: user.id,
        expiresAt
      }
    });

    const verifyBase = process.env.VERIFY_EMAIL_URL || `${process.env.FRONT_URL}/verify-email`;
    const verifyLink = `${verifyBase}?token=${rawToken}`;

    await sendEmail({
      to: user.email,
      subject: "Verification email",
      html: `
        <p>Bonjour ${user.firstName},</p>
        <p>Merci de confirmer votre adresse email en cliquant ici :</p>
        <p><a href="${verifyLink}">${verifyLink}</a></p>
        <p>Si vous n etes pas a l origine de cette demande, ignorez ce message.</p>
      `
    });

    return res.status(201).json({
      message: "Si l email est valide, un lien de verification a ete envoye"
    });
  } catch (err) {
    next(err);
  }
};

export const verifyEmail = async (req, res, next) => {
  try {
    const token = req.query?.token;
    if (!token || typeof token !== "string") {
      return res.status(400).json({ message: "Token invalide" });
    }

    const tokenHash = hashToken(token);
    const record = await prisma.verificationToken.findUnique({
      where: { tokenHash }
    });

    if (!record || record.usedAt || record.expiresAt < new Date()) {
      return res.status(400).json({ message: "Token invalide" });
    }

    await prisma.$transaction([
      prisma.user.update({
        where: { id: record.userId },
        data: { emailVerified: true }
      }),
      prisma.verificationToken.update({
        where: { tokenHash },
        data: { usedAt: new Date() }
      })
    ]);

    await createAuditLog({
      userId: record.userId,
      action: "VERIFY_EMAIL",
      resourceType: "User",
      resourceId: String(record.userId),
      req
    });

    return res.json({ message: "Email verifie" });
  } catch (err) {
    next(err);
  }
};

export const me = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, firstName: true, lastName: true, email: true, role: true }
    });
    res.json({ user });
  } catch (err) {
    next(err);
  }
};

export const logout = async (req, res, next) => {
  try {
    const { refreshToken } = req.cookies;

    if (refreshToken) {
      await prisma.refreshToken.updateMany({
        where: {
          tokenHash: hashToken(refreshToken),
          revokedAt: null
        },
        data: { revokedAt: new Date() }
      });
    }

    res.clearCookie("accessToken", accessCookieClearOptions);
    res.clearCookie("refreshToken", refreshCookieClearOptions);
    res.clearCookie("csrfToken", csrfCookieClearOptions);

    await createAuditLog({
      userId: req.user?.id,
      action: "LOGOUT",
      resourceType: "User",
      resourceId: String(req.user?.id ?? ""),
      req
    });

    res.json({ message: "Deconnecte" });
  } catch (err) {
    next(err);
  }
};

export const logoutAll = async (req, res, next) => {
  try {
    await prisma.refreshToken.updateMany({
      where: { userId: req.user.id },
      data: { revokedAt: new Date() }
    });

    res.clearCookie("accessToken", accessCookieClearOptions);
    res.clearCookie("refreshToken", refreshCookieClearOptions);
    res.clearCookie("csrfToken", csrfCookieClearOptions);

    await createAuditLog({
      userId: req.user?.id,
      action: "LOGOUT_ALL",
      resourceType: "User",
      resourceId: String(req.user?.id ?? ""),
      req
    });

    res.json({ message: "Toutes les sessions ont ete revoquees" });
  } catch (err) {
    next(err);
  }
};
export const refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.cookies;
    if (!refreshToken) return res.status(401).json({ message: "No refresh token" });

    let payload;
    try {
      payload = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    } catch {
      return res.status(401).json({ message: "Invalid refresh token" });
    }

    const storedToken = await prisma.refreshToken.findUnique({
      where: { tokenHash: hashToken(refreshToken) }
    });

    if (!storedToken) {
      return res.status(401).json({ message: "Invalid refresh token" });
    }

    if (storedToken.revokedAt) {
      await prisma.refreshToken.updateMany({
        where: { userId: storedToken.userId },
        data: { revokedAt: new Date() }
      });
      await createAuditLog({
        userId: storedToken.userId,
        action: "REFRESH_REUSE",
        resourceType: "User",
        resourceId: String(storedToken.userId),
        status: "FAIL",
        req
      });
      return res.status(401).json({ message: "Refresh token reuse detecte" });
    }

    if (storedToken.expiresAt < new Date()) {
      await prisma.refreshToken.updateMany({
        where: { userId: storedToken.userId },
        data: { revokedAt: new Date() }
      });
      return res.status(401).json({ message: "Invalid refresh token" });
    }

    const user = await prisma.user.findUnique({ where: { id: payload.id } });
    if (!user) return res.status(401).json({ message: "User not found" });

    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);
    const newCsrfToken = generateCsrfToken();

    const refreshTokenExpiresAt = getTokenExpiresAt(newRefreshToken, refreshTokenTtlMs);
    if (!refreshTokenExpiresAt) {
      return res.status(500).json({ message: "Invalid refresh token expiry" });
    }

    await prisma.$transaction([
      prisma.refreshToken.update({
        where: { id: storedToken.id },
        data: { revokedAt: new Date() }
      }),
      prisma.refreshToken.create({
        data: {
          tokenHash: hashToken(newRefreshToken),
          userId: user.id,
          expiresAt: refreshTokenExpiresAt
        }
      })
    ]);

    res.cookie("accessToken", newAccessToken, accessCookieOptions);
    res.cookie("refreshToken", newRefreshToken, refreshCookieOptions);
    res.cookie("csrfToken", newCsrfToken, csrfCookieOptions);

    res.json({ message: "Tokens refreshed" });
  } catch (err) {
    next(err);
  }
};