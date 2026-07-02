import { Router } from "express";
import { reconciliationController } from "@/features/reconciliation/reconciliation.controller";
import { requireAuth } from "@/shared/middleware/auth.middleware";
import { requirePermission } from "@/shared/middleware/rbac.middleware";

const router = Router();
router.use(requireAuth);

router.get("/", requirePermission("reconciliation:read"), reconciliationController.list);
router.post("/", requirePermission("reconciliation:run"), reconciliationController.start);
router.get("/:id", requirePermission("reconciliation:read"), reconciliationController.getById);
router.get("/:id/report", requirePermission("reconciliation:read"), reconciliationController.getReport);

export { router as reconciliationRoutes };
