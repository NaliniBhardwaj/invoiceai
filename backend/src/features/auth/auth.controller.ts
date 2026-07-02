import type { Request, Response } from "express";
import { authService } from "@/features/auth/auth.service";
import { loginSchema, registerSchema } from "@/features/auth/auth.schema";
import { asyncHandler } from "@/shared/utils/async-handler";

export const authController = {
  register: asyncHandler(async (req: Request, res: Response) => {
    const input = registerSchema.parse(req.body);
    const result = await authService.register(input);
    res.status(201).json(result);
  }),

  login: asyncHandler(async (req: Request, res: Response) => {
    const input = loginSchema.parse(req.body);
    const result = await authService.login(input);
    res.status(200).json(result);
  }),
};
