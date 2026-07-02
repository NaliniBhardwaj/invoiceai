import { Router } from "express";
import { invoiceController } from "@/features/invoices/invoice.controller";
import { requireAuth } from "@/shared/middleware/auth.middleware";
import { requirePermission } from "@/shared/middleware/rbac.middleware";

const router = Router();
router.use(requireAuth);

router.get("/analytics", requirePermission("invoice:read"), invoiceController.getAnalytics);
router.get("/", requirePermission("invoice:read"), invoiceController.list);
router.post("/", requirePermission("invoice:create"), invoiceController.create);
router.get("/:id", requirePermission("invoice:read"), invoiceController.getById);
router.patch("/:id", requirePermission("invoice:update"), invoiceController.update);
router.delete("/:id", requirePermission("invoice:delete"), invoiceController.remove);
router.post("/:id/issue", requirePermission("invoice:update"), invoiceController.issue);
router.post("/:id/cancel", requirePermission("invoice:update"), invoiceController.cancel);
router.get("/:id/export/json", requirePermission("invoice:export"), invoiceController.exportJson);

export { router as invoiceRoutes };
