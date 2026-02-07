import { z } from "zod";

const moneyInt = z.number().int().min(0);
const positiveInt = z.number().int().positive();
const optionalDate = z
  .string()
  .datetime()
  .optional()
  .or(z.literal("").transform(() => undefined));
const pageInt = z.coerce.number().int().min(1);
const limitInt = z.coerce.number().int().min(1).max(100);

export const idParamSchema = z
  .object({
    id: z.coerce.number().int().positive()
  })
  .strict();

export const listPageQuerySchema = z
  .object({
    page: pageInt.optional(),
    limit: limitInt.optional()
  })
  .strict();

export const productListQuerySchema = z
  .object({
    page: pageInt.optional(),
    limit: limitInt.optional(),
    q: z.string().max(120).optional(),
    activeOnly: z.enum(["true", "false"]).optional()
  })
  .strict();

export const reviewListQuerySchema = z
  .object({
    productId: z.coerce.number().int().positive().optional()
  })
  .strict();

export const productIdQuerySchema = z
  .object({
    productId: z.coerce.number().int().positive().optional()
  })
  .strict();

export const couponValidateQuerySchema = z
  .object({
    code: z.string().min(1),
    orderTotalCents: z.coerce.number().int().min(0).optional()
  })
  .strict();

export const categoryCreateSchema = z
  .object({
    name: z.string().min(2).max(120),
    slug: z.string().min(2).max(160),
    parentId: z.coerce.number().int().positive().optional().nullable()
  })
  .strict();

export const categoryUpdateSchema = z
  .object({
    name: z.string().min(2).max(120).optional(),
    slug: z.string().min(2).max(160).optional(),
    parentId: z.coerce.number().int().positive().optional().nullable()
  })
  .strict();

export const productCreateSchema = z
  .object({
    name: z.string().min(2).max(180),
    slug: z.string().min(2).max(220),
    description: z.string().max(10000),
    priceCents: moneyInt,
    currency: z.string().min(3).max(10),
    sku: z.string().min(2).max(120),
    isActive: z.boolean().optional(),
    categoryIds: z.array(positiveInt).optional()
  })
  .strict();

export const productUpdateSchema = z
  .object({
    name: z.string().min(2).max(180).optional(),
    slug: z.string().min(2).max(220).optional(),
    description: z.string().max(10000).optional(),
    priceCents: moneyInt.optional(),
    currency: z.string().min(3).max(10).optional(),
    sku: z.string().min(2).max(120).optional(),
    isActive: z.boolean().optional(),
    categoryIds: z.array(positiveInt).optional()
  })
  .strict();

export const imageCreateSchema = z
  .object({
    productId: positiveInt,
    url: z.string().url(),
    alt: z.string().max(300).optional().nullable(),
    sortOrder: z.number().int().min(0).optional()
  })
  .strict();

export const inventoryCreateSchema = z
  .object({
    productId: positiveInt,
    quantity: z.number().int().min(0),
    reserved: z.number().int().min(0).optional()
  })
  .strict();

export const inventoryUpdateSchema = z
  .object({
    quantity: z.number().int().min(0).optional(),
    reserved: z.number().int().min(0).optional()
  })
  .strict()
  .refine((v) => v.quantity !== undefined || v.reserved !== undefined, {
    message: "At least one field is required"
  });

export const couponCreateSchema = z
  .object({
    code: z.string().min(2).max(80),
    type: z.enum(["PERCENT", "FIXED"]),
    value: moneyInt,
    minOrderCents: moneyInt.optional().nullable(),
    startsAt: optionalDate,
    endsAt: optionalDate,
    usageLimit: z.number().int().positive().optional().nullable(),
    isActive: z.boolean().optional()
  })
  .strict();

export const couponUpdateSchema = z
  .object({
    code: z.string().min(2).max(80).optional(),
    type: z.enum(["PERCENT", "FIXED"]).optional(),
    value: moneyInt.optional(),
    minOrderCents: moneyInt.optional().nullable(),
    startsAt: optionalDate,
    endsAt: optionalDate,
    usageLimit: z.number().int().positive().optional().nullable(),
    isActive: z.boolean().optional()
  })
  .strict();

export const shipmentCreateSchema = z
  .object({
    orderId: positiveInt,
    carrier: z.string().max(120).optional().nullable(),
    trackingNumber: z.string().max(150).optional().nullable(),
    status: z.enum(["CREATED", "IN_TRANSIT", "DELIVERED", "LOST"]).optional(),
    shippedAt: optionalDate,
    deliveredAt: optionalDate
  })
  .strict();

export const shipmentUpdateSchema = z
  .object({
    carrier: z.string().max(120).optional().nullable(),
    trackingNumber: z.string().max(150).optional().nullable(),
    status: z.enum(["CREATED", "IN_TRANSIT", "DELIVERED", "LOST"]).optional(),
    shippedAt: optionalDate,
    deliveredAt: optionalDate
  })
  .strict()
  .refine(
    (v) =>
      v.carrier !== undefined ||
      v.trackingNumber !== undefined ||
      v.status !== undefined ||
      v.shippedAt !== undefined ||
      v.deliveredAt !== undefined,
    { message: "At least one field is required" }
  );

export const orderStatusUpdateSchema = z
  .object({
    status: z.enum(["PENDING", "PAID", "PREPARING", "SHIPPED", "DELIVERED", "CANCELLED", "REFUNDED"])
  })
  .strict();

export const paymentStatusUpdateSchema = z
  .object({
    status: z.enum(["CREATED", "AUTHORIZED", "CAPTURED", "FAILED", "REFUNDED"])
  })
  .strict();

export const cartAddItemSchema = z
  .object({
    productId: positiveInt,
    quantity: positiveInt
  })
  .strict();

export const cartUpdateItemSchema = z
  .object({
    quantity: positiveInt
  })
  .strict();

export const addressCreateSchema = z
  .object({
    label: z.string().min(1).max(80),
    fullName: z.string().min(2).max(160),
    phone: z.string().min(5).max(40),
    line1: z.string().min(2).max(200),
    line2: z.string().max(200).optional().nullable(),
    postalCode: z.string().min(2).max(20),
    city: z.string().min(2).max(120),
    country: z.string().min(2).max(80),
    isDefault: z.boolean().optional()
  })
  .strict();

export const addressUpdateSchema = z
  .object({
    label: z.string().min(1).max(80).optional(),
    fullName: z.string().min(2).max(160).optional(),
    phone: z.string().min(5).max(40).optional(),
    line1: z.string().min(2).max(200).optional(),
    line2: z.string().max(200).optional().nullable(),
    postalCode: z.string().min(2).max(20).optional(),
    city: z.string().min(2).max(120).optional(),
    country: z.string().min(2).max(80).optional(),
    isDefault: z.boolean().optional()
  })
  .strict();

export const orderCreateSchema = z
  .object({
    shippingAddressId: positiveInt,
    billingAddressId: positiveInt,
    couponCode: z.string().max(80).optional()
  })
  .strict();

export const paymentCreateSchema = z
  .object({
    orderId: positiveInt,
    provider: z.enum(["STRIPE", "PAYPAL", "MANUAL"]).optional(),
    providerRef: z.string().max(190).optional().nullable()
  })
  .strict();

export const reviewCreateSchema = z
  .object({
    productId: positiveInt,
    rating: z.number().int().min(1).max(5),
    comment: z.string().max(2000).optional().nullable()
  })
  .strict();

export const reviewUpdateSchema = z
  .object({
    rating: z.number().int().min(1).max(5).optional(),
    comment: z.string().max(2000).optional().nullable()
  })
  .strict()
  .refine((v) => v.rating !== undefined || v.comment !== undefined, {
    message: "At least one field is required"
  });
