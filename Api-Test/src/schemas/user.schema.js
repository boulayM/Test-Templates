import { z } from "zod";

const passwordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_\-+={}[\]|\\:;"'<>,.?/~`]).{8,}$/;

export const userCreateSchema = z
  .object({
    firstName: z.string().min(2).max(50),
    lastName: z.string().min(2).max(50),
    email: z.string().email(),
    password: z.string().regex(passwordRegex),
    role: z.enum(["USER", "ADMIN", "LOGISTIQUE", "COMPTABILITE"]).optional(),
    emailVerified: z.boolean().optional(),
    isActive: z.boolean().optional()
  })
  .strict();

export const userUpdateSchema = z
  .object({
    firstName: z.string().min(2).max(50).optional(),
    lastName: z.string().min(2).max(50).optional(),
    email: z.string().email().optional(),
    password: z.string().regex(passwordRegex).optional(),
    role: z.enum(["USER", "ADMIN", "LOGISTIQUE", "COMPTABILITE"]).optional(),
    emailVerified: z.boolean().optional(),
    isActive: z.boolean().optional()
  })
  .strict();

export const userIdParamSchema = z
  .object({
    id: z.coerce.number().int().positive()
  })
  .strict();