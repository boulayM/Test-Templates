import { z } from "zod";

function toInt(value) {
  if (value === undefined || value === null || value === "") return undefined;
  if (Array.isArray(value)) value = value[0];
  if (typeof value === "string") {
    const n = Number(value);
    return Number.isNaN(n) ? value : n;
  }
  return value;
}

function toString(value) {
  if (value === undefined || value === null || value === "") return undefined;
  if (Array.isArray(value)) value = value[0];
  return value;
}

function isJsonObjectString(value) {
  if (value === undefined) return true;
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object";
  } catch {
    return false;
  }
}

export function createListSchema(opts) {
  const sortEnum = z.enum(opts.sortFields);
  const qMax = opts.qMax || 100;

  return z
    .object({
      page: z.preprocess(toInt, z.number().int().min(1)).optional(),
      limit: z.preprocess(toInt, z.number().int().min(1).max(100)).optional(),
      sort: z.preprocess(toString, sortEnum).optional(),
      order: z.preprocess(toString, z.enum(["asc", "desc"])).optional(),
      q: z.preprocess(toString, z.string().max(qMax)).optional(),
      _ts: z.preprocess(toInt, z.number().int().min(0)).optional(),
      filters: z.preprocess(toString, z.string().max(2000)).optional().refine(isJsonObjectString, {
        message: "Invalid filters"
      })
    })
    .strict();
}

export const userListSchema = createListSchema({
  sortFields: ["id", "firstName", "lastName", "email", "createdAt"],
  qMax: 100
});

export const productListSchema = createListSchema({
  sortFields: ["id", "name", "priceCents", "createdAt"],
  qMax: 100
});

export const orderListSchema = createListSchema({
  sortFields: ["id", "createdAt", "status"],
  qMax: 100
});

export const auditLogListSchema = createListSchema({
  sortFields: [
    "createdAt",
    "action",
    "actorId",
    "actorEmail",
    "targetType",
    "targetId",
    "status",
    "requestId"
  ],
  qMax: 200
});