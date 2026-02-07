import mongoose from "mongoose";
import AuditLog from "../models/auditLog.js";

export async function createAuditLog({
  userId,
  action,
  resourceType,
  resourceId,
  req,
  metadata,
  actor,
  target,
  changes,
  status,
  requestId
} = {}) {
  try {
    if (mongoose.connection.readyState !== 1) return;
    if (!action) return;

    const reqUser = req?.user || {};
    const reqIp = req?.ip ?? null;
    const reqUa = req?.headers?.["user-agent"] ?? null;

    const resolvedActor = {
      id: actor?.id ?? userId ?? reqUser?.id ?? null,
      email: actor?.email ?? reqUser?.email ?? null,
      role: actor?.role ?? reqUser?.role ?? null,
      ip: actor?.ip ?? reqIp,
      userAgent: actor?.userAgent ?? reqUa
    };

    const resolvedTarget = {
      type: target?.type ?? resourceType ?? null,
      id: target?.id ?? resourceId ?? null,
      label: target?.label ?? null
    };

    let resolvedChanges = null;
    if (changes && typeof changes === "object") {
      resolvedChanges = {
        before: changes.before ?? null,
        after: changes.after ?? null
      };
    } else if (metadata && typeof metadata === "object") {
      if (
        Object.prototype.hasOwnProperty.call(metadata, "before") ||
        Object.prototype.hasOwnProperty.call(metadata, "after")
      ) {
        resolvedChanges = {
          before: metadata.before ?? null,
          after: metadata.after ?? null
        };
      }
    }

    const resolvedStatus = status ?? metadata?.status ?? null;
    const resolvedRequestId = requestId ?? req?.id ?? req?.headers?.["x-request-id"] ?? null;

    const log = {
      action,
      actor: resolvedActor,
      target: resolvedTarget,
      changes: resolvedChanges,
      status: resolvedStatus,
      requestId: resolvedRequestId,
      metadata: metadata ?? null,

      userId: userId ?? null,
      resourceType: resourceType ?? null,
      resourceId: resourceId ?? null,
      ip: reqIp,
      userAgent: reqUa
    };

    await AuditLog.create(log);
  } catch (err) {
    console.warn("[AuditLog] write failed", err?.message || err);
  }
}
