import type { Request, Response } from "express";
import { z } from "zod";
import { asyncHandler } from "@/shared/utils/async-handler";
import { ApiError } from "@/shared/utils/api-error";
import { aiAssistantService } from "@/features/ai-assistant/ai-assistant.service";

const chatSchema = z.object({
  message: z.string().min(1).max(2000),
  conversationId: z.string().optional(),
});

export const aiAssistantController = {
  chat: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    const input = chatSchema.parse(req.body);
    const result = await aiAssistantService.chat(req.user.organizationId, req.user.userId, input);
    res.status(200).json(result);
  }),

  getConversation: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    const conversation = await aiAssistantService.getConversation(
      req.user.organizationId,
      req.params.id
    );
    if (!conversation) throw ApiError.notFound("Conversation not found");
    res.status(200).json(conversation);
  }),
};
