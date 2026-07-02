import { Router } from "express";
import { authController } from "@/features/auth/auth.controller";
import { authRateLimiter } from "@/shared/middleware/rate-limiter";

const router = Router();

router.post("/register", authRateLimiter, authController.register);
router.post("/login", authRateLimiter, authController.login);

export { router as authRoutes };
