import AuditLog from "../models/auditLog.js";
import { parseQuery } from "../utils/validate.js";
import { auditLogListSchema } from "../schemas/list.schema.js";
import { csvEscape, sendCsv } from "../utils/csv.js";

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function parseListParams(query) {
  const page = Math.max(parseInt(query.page || "1", 10), 1);
  const limit = Math.min(Math.max(parseInt(query.limit || "20", 10), 1), 100);
  const skip = (page - 1) * limit;

  const sortMap = {
    createdAt: "createdAt",
    action: "action",
    actorId: "actor.id",
    actorEmail: "actor.email",
    targetType: "target.type",
    targetId: "target.id",
    status: "status",
    requestId: "requestId"
  };

  const sortRaw = (query.sort || "createdAt").toString();
  const sort = sortMap[sortRaw] || "createdAt";

  const orderRaw = (query.order || "desc").toString().toLowerCase();
  const order = orderRaw === "asc" ? 1 : -1;

  const q = (query.q || "").toString().trim();

  let filters = {};
  if (query.filters) {
    try {
      const parsed = JSON.parse(query.filters);
      if (parsed && typeof parsed === "object") {
        if (typeof parsed.action === "string") filters.action = parsed.action;
        if (typeof parsed.status === "string") filters.status = parsed.status;
        if (typeof parsed.requestId === "string") filters.requestId = parsed.requestId;

        if (parsed.actorId !== undefined) {
          const v = parseInt(parsed.actorId, 10);
          if (!Number.isNaN(v)) filters["actor.id"] = v;
        }
        if (typeof parsed.actorEmail === "string") filters["actor.email"] = parsed.actorEmail;
        if (typeof parsed.actorRole === "string") filters["actor.role"] = parsed.actorRole;

        if (typeof parsed.targetType === "string") filters["target.type"] = parsed.targetType;
        if (typeof parsed.targetId === "string") filters["target.id"] = parsed.targetId;

        if (parsed.userId !== undefined) {
          const v = parseInt(parsed.userId, 10);
          if (!Number.isNaN(v)) filters.userId = v;
        }
        if (typeof parsed.resourceType === "string") filters.resourceType = parsed.resourceType;
        if (typeof parsed.resourceId === "string") filters.resourceId = parsed.resourceId;

        if (typeof parsed.hasChanges === "boolean") {
          if (parsed.hasChanges) {
            filters.changes = { $ne: null };
          } else {
            filters.changes = null;
          }
        }
        if (typeof parsed.hasChanges === "string") {
          const v = parsed.hasChanges.toLowerCase();
          if (v === "true") filters.changes = { $ne: null };
          if (v === "false") filters.changes = null;
        }

        if (parsed.dateFrom || parsed.dateTo) {
          const range = {};
          if (parsed.dateFrom) {
            const d = new Date(parsed.dateFrom);
            if (!Number.isNaN(d.getTime())) range.$gte = d;
          }
          if (parsed.dateTo) {
            const d = new Date(parsed.dateTo);
            if (!Number.isNaN(d.getTime())) range.$lte = d;
          }
          if (Object.keys(range).length > 0) filters.createdAt = range;
        }
      }
    } catch {}
  }

  return { page, limit, skip, sort, order, q, filters };
}

export const exportAuditLogs = async (req, res, next) => {
  try {
    const safe = parseQuery(auditLogListSchema, req, res);
    if (!safe) return;
    const { sort, order, q, filters } = parseListParams(safe);

    const and = [];

    if (q) {
      if (/^[0-9]+$/.test(q)) {
        const num = parseInt(q, 10);
        and.push({
          $or: [{ "actor.id": num }, { userId: num }, { resourceId: q }, { "target.id": q }]
        });
      } else {
        const safeText = escapeRegex(q);
        and.push({
          $or: [
            { action: { $regex: safeText, $options: "i" } },
            { "actor.email": { $regex: safeText, $options: "i" } },
            { "target.type": { $regex: safeText, $options: "i" } },
            { "target.id": { $regex: safeText, $options: "i" } },
            { resourceType: { $regex: safeText, $options: "i" } },
            { resourceId: { $regex: safeText, $options: "i" } },
            { requestId: { $regex: safeText, $options: "i" } }
          ]
        });
      }
    }

    if (Object.keys(filters).length > 0) {
      and.push(filters);
    }

    let criteria = {};
    if (and.length === 1) criteria = and[0];
    if (and.length > 1) criteria = { $and: and };

    const data = await AuditLog.find(criteria)
      .sort({ [sort]: order })
      .lean();

    const rows = [];
    rows.push(
      [
        "id",
        "action",
        "actorEmail",
        "actorId",
        "actorRole",
        "targetType",
        "targetId",
        "status",
        "requestId",
        "createdAt"
      ].join(",")
    );

    for (const l of data) {
      rows.push(
        [
          csvEscape(l._id),
          csvEscape(l.action),
          csvEscape(l.actor?.email),
          csvEscape(l.actor?.id),
          csvEscape(l.actor?.role),
          csvEscape(l.target?.type),
          csvEscape(l.target?.id),
          csvEscape(l.status),
          csvEscape(l.requestId),
          csvEscape(l.createdAt)
        ].join(",")
      );
    }

    sendCsv(res, "audit-logs.csv", rows);
  } catch (err) {
    next(err);
  }
};

export const listAuditLogs = async (req, res, next) => {
  try {
    const safe = parseQuery(auditLogListSchema, req, res);
    if (!safe) return;
    const { page, limit, skip, sort, order, q, filters } = parseListParams(safe);

    const and = [];

    if (q) {
      if (/^[0-9]+$/.test(q)) {
        const num = parseInt(q, 10);
        and.push({
          $or: [{ "actor.id": num }, { userId: num }, { resourceId: q }, { "target.id": q }]
        });
      } else {
        const safeText = escapeRegex(q);
        and.push({
          $or: [
            { action: { $regex: safeText, $options: "i" } },
            { "actor.email": { $regex: safeText, $options: "i" } },
            { "target.type": { $regex: safeText, $options: "i" } },
            { "target.id": { $regex: safeText, $options: "i" } },
            { resourceType: { $regex: safeText, $options: "i" } },
            { resourceId: { $regex: safeText, $options: "i" } },
            { requestId: { $regex: safeText, $options: "i" } }
          ]
        });
      }
    }

    if (Object.keys(filters).length > 0) {
      and.push(filters);
    }

    let criteria = {};
    if (and.length === 1) criteria = and[0];
    if (and.length > 1) criteria = { $and: and };

    const [data, total] = await Promise.all([
      AuditLog.find(criteria)
        .sort({ [sort]: order })
        .skip(skip)
        .limit(limit),
      AuditLog.countDocuments(criteria)
    ]);

    res.json({ data, page, limit, total });
  } catch (err) {
    next(err);
  }
};

export const getAuditLog = async (req, res, next) => {
  try {
    const log = await AuditLog.findById(req.params.id);
    if (!log) return res.status(404).json({ message: "Audit log introuvable" });
    res.json({ log });
  } catch (err) {
    next(err);
  }
};