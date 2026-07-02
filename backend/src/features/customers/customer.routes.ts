import { Router } from "express";
import { customerController } from "@/features/customers/customer.controller";
import { requireAuth } from "@/shared/middleware/auth.middleware";
import { requirePermission } from "@/shared/middleware/rbac.middleware";

const router = Router();

router.use(requireAuth);

// Static sub-paths before the dynamic /:id routes — otherwise "analytics"
// would be parsed as a customer ID.
router.get("/analytics", requirePermission("customer:read"), customerController.getAnalytics);

router.get("/", requirePermission("customer:read"), customerController.list);
router.post("/", requirePermission("customer:create"), customerController.create);
router.get("/:id", requirePermission("customer:read"), customerController.getById);
router.patch("/:id", requirePermission("customer:update"), customerController.update);
router.delete("/:id", requirePermission("customer:delete"), customerController.remove);
router.get("/:id/history", requirePermission("customer:read"), customerController.getHistory);

export { router as customerRoutes };
