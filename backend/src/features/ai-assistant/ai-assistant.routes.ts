import { Router } from "express";
import { aiAssistantController } from "@/features/ai-assistant/ai-assistant.controller";
import { requireAuth } from "@/shared/middleware/auth.middleware";
import { requirePermission } from "@/shared/middleware/rbac.middleware";

const router = Router();
router.use(requireAuth);

router.post("/chat", requirePermission("ai:use"), aiAssistantController.chat);
router.get("/conversations/:id", requirePermission("ai:use"), aiAssistantController.getConversation);

export { router as aiAssistantRoutes };
