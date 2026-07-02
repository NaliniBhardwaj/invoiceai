import { z } from "zod";

export const registerSchema = z.object({
  organizationName: z.string().min(2).max(120),
  organizationState: z.string().min(2).max(60),
  organizationGstNumber: z.string().max(15).optional(),
  name: z.string().min(2).max(120),
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
