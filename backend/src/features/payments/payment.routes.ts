import { Router } from "express";
import { paymentController } from "@/features/payments/payment.controller";
import { requireAuth } from "@/shared/middleware/auth.middleware";
import { requirePermission } from "@/shared/middleware/rbac.middleware";

const router = Router();
router.use(requireAuth);

router.get("/", requirePermission("payment:read"), paymentController.list);
router.post("/", requirePermission("payment:record"), paymentController.record);
router.delete("/:id", requirePermission("payment:refund"), paymentController.refund);

export { router as paymentRoutes };
