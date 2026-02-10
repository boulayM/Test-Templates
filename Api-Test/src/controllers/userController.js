import prisma from "../config/prisma.js";
import bcrypt from "bcryptjs";
import { createAuditLog } from "../services/auditLogService.js";
import { parseBody, parseQuery } from "../utils/validate.js";
import { userCreateSchema, userUpdateSchema } from "../schemas/user.schema.js";
import { userListSchema } from "../schemas/list.schema.js";
import { toUserCreate, toUserUpdate } from "../dto/user.dto.js";
import { csvEscape, sendCsv } from "../utils/csv.js";

function parseListParams(query) {
  const page = Math.max(parseInt(query.page || "1", 10), 1);
  const limit = Math.min(Math.max(parseInt(query.limit || "20", 10), 1), 100);
  const skip = (page - 1) * limit;

  const sortAllowed = ["id", "firstName", "lastName", "email", "createdAt"];
  const sortRaw = (query.sort || "id").toString();
  const sort = sortAllowed.includes(sortRaw) ? sortRaw : "id";

  const orderRaw = (query.order || "desc").toString().toLowerCase();
  const order = orderRaw === "asc" ? "asc" : "desc";

  const q = (query.q || "").toString().trim();

  let filters = {};
  if (query.filters) {
    try {
      const parsed = JSON.parse(query.filters);
      if (parsed && typeof parsed === "object") {
        if (typeof parsed.role === "string" && ["USER", "ADMIN", "LOGISTIQUE", "COMPTABILITE"].includes(parsed.role)) {
          filters.role = parsed.role;
        }
        if (typeof parsed.emailVerified === "boolean") {
          filters.emailVerified = parsed.emailVerified;
        }
        if (typeof parsed.emailVerified === "string") {
          const v = parsed.emailVerified.toLowerCase();
          if (v === "true") filters.emailVerified = true;
          if (v === "false") filters.emailVerified = false;
        }
        if (typeof parsed.isActive === "boolean") {
          filters.isActive = parsed.isActive;
        }
      }
    } catch {}
  }

  return { page, limit, skip, sort, order, q, filters };
}

export const register = async (req, res, next) => {
  try {
    const payload = parseBody(userCreateSchema, req, res);
    if (!payload) return;
    const data = toUserCreate(payload);
    const { email, password } = data;

    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) return res.status(400).json({ message: "Email deja utilise" });

    const hashed = await bcrypt.hash(password, 10);

    const { password: _password, ...rest } = data;

    const user = await prisma.user.create({
      data: {
        ...rest,
        passwordHash: hashed,
        emailVerified: data.emailVerified ?? true,
        isActive: true
      }
    });

    await createAuditLog({
      userId: req.user?.id,
      action: "USER_CREATE",
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

    res.status(201).json({ user: safeUser });
  } catch (err) {
    next(err);
  }
};

export const exportUsers = async (req, res, next) => {
  try {
    const safe = parseQuery(userListSchema, req, res);
    if (!safe) return;
    const { sort, order, q, filters } = parseListParams(safe);

    const and = [];
    if (q) {
      and.push({
        OR: [
          { firstName: { contains: q, mode: "insensitive" } },
          { lastName: { contains: q, mode: "insensitive" } },
          { email: { contains: q, mode: "insensitive" } }
        ]
      });
    }
    if (Object.keys(filters).length > 0) {
      and.push(filters);
    }

    let where = undefined;
    if (and.length === 1) where = and[0];
    if (and.length > 1) where = { AND: and };

    const data = await prisma.user.findMany({
      where,
      orderBy: { [sort]: order },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        emailVerified: true,
        isActive: true,
        createdAt: true
      }
    });

    const rows = [];
    rows.push(
      [
        "id",
        "firstName",
        "lastName",
        "email",
        "role",
        "emailVerified",
        "isActive",
        "createdAt"
      ].join(",")
    );

    for (const u of data) {
      rows.push(
        [
          csvEscape(u.id),
          csvEscape(u.firstName),
          csvEscape(u.lastName),
          csvEscape(u.email),
          csvEscape(u.role),
          csvEscape(u.emailVerified),
          csvEscape(u.isActive),
          csvEscape(u.createdAt)
        ].join(",")
      );
    }

    sendCsv(res, "users.csv", rows);
  } catch (err) {
    next(err);
  }
};

export const getUsers = async (req, res, next) => {
  try {
    const safe = parseQuery(userListSchema, req, res);
    if (!safe) return;
    const { page, limit, skip, sort, order, q, filters } = parseListParams(safe);

    const and = [];
    if (q) {
      and.push({
        OR: [
          { firstName: { contains: q, mode: "insensitive" } },
          { lastName: { contains: q, mode: "insensitive" } },
          { email: { contains: q, mode: "insensitive" } }
        ]
      });
    }
    if (Object.keys(filters).length > 0) {
      and.push(filters);
    }

    let where = undefined;
    if (and.length === 1) where = and[0];
    if (and.length > 1) where = { AND: and };

    const [data, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sort]: order },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          role: true,
          emailVerified: true,
          isActive: true,
          createdAt: true
        }
      }),
      prisma.user.count({ where })
    ]);

    res.json({ data, page, limit, total });
  } catch (err) {
    next(err);
  }
};

export const updateUser = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    if (Number.isNaN(id)) return res.status(400).json({ message: "Invalid id" });

    const payload = parseBody(userUpdateSchema, req, res);
    if (!payload) return;
    const data = toUserUpdate(payload);

    if (data.password) {
      const hashed = await bcrypt.hash(data.password, 10);
      delete data.password;
      data.passwordHash = hashed;
    }

    const user = await prisma.user.update({
      where: { id },
      data
    });

    await createAuditLog({
      userId: req.user?.id,
      action: "USER_UPDATE",
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

    res.json({ user: safeUser });
  } catch (err) {
    next(err);
  }
};

export const deleteUser = async (req, res, next) => {
  try {
    const delId = parseInt(req.params.id);
    if (Number.isNaN(delId)) return res.status(400).json({ message: "Invalid id" });
    await prisma.user.delete({
      where: { id: delId }
    });

    await createAuditLog({
      userId: req.user?.id,
      action: "USER_DELETE",
      resourceType: "User",
      resourceId: String(req.params.id),
      req
    });
    res.json({ message: "Utilisateur supprime" });
  } catch (err) {
    next(err);
  }
};