import { z } from "zod";

const passwordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_\-+={}[\]|\\:;"'<>,.?/~`]).{8,}$/;

export const authLoginSchema = z
  .object({
    email: z.string().email(),
    password: z.string().min(1)
  })
  .strict();

export const authRegisterSchema = z
  .object({
    firstName: z.string().min(2).max(50),
    lastName: z.string().min(2).max(50),
    email: z.string().email(),
    password: z.string().regex(passwordRegex)
  })
  .strict();
