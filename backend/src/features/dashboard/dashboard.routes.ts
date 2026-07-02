import { Router } from "express";
import { dashboardController } from "@/features/dashboard/dashboard.controller";
import { requireAuth } from "@/shared/middleware/auth.middleware";
import { requirePermission } from "@/shared/middleware/rbac.middleware";

const router = Router();
router.use(requireAuth);
router.get("/summary", requirePermission("dashboard:read"), dashboardController.getSummary);

export { router as dashboardRoutes };
