import { Router } from "express";
import { purchaseOrderController } from "@/features/purchase-orders/purchase-order.controller";
import { requireAuth } from "@/shared/middleware/auth.middleware";
import { requirePermission } from "@/shared/middleware/rbac.middleware";

const router = Router();
router.use(requireAuth);

router.get("/", requirePermission("purchase_order:read"), purchaseOrderController.list);
router.post("/", requirePermission("purchase_order:create"), purchaseOrderController.create);
router.get("/:id", requirePermission("purchase_order:read"), purchaseOrderController.getById);
router.patch("/:id", requirePermission("purchase_order:update"), purchaseOrderController.update);
router.delete("/:id", requirePermission("purchase_order:update"), purchaseOrderController.remove);

export { router as purchaseOrderRoutes };
