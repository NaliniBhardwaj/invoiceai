import { prisma } from "@/shared/prisma/client";

/**
 * Thin persistence wrapper around AIConversation/AIMessage. Action
 * Handlers and the Intent Classifier read/write through this rather than
 * touching Prisma directly, so conversation history retrieval logic
 * (e.g. windowing to the last N messages for the prompt) lives in one
 * place.
 */
class ConversationStore {
  async createConversation(organizationId: string, userId: string): Promise<string> {
    const conversation = await prisma.aIConversation.create({
      data: { organizationId, userId },
    });
    return conversation.id;
  }

  async appendMessage(
    conversationId: string,
    role: "user" | "assistant",
    content: string,
    actionTaken?: string,
    actionPayload?: Record<string, unknown>
  ): Promise<void> {
    await prisma.aIMessage.create({
      data: {
        conversationId,
        role,
        content,
        actionTaken: actionTaken ?? null,
        actionPayload: actionPayload ? (actionPayload as object) : undefined,
      },
    });
  }

  async getHistory(conversationId: string, limit = 20) {
    return prisma.aIMessage.findMany({
      where: { conversationId },
      orderBy: { createdAt: "asc" },
      take: limit,
    });
  }
}

export const conversationStore = new ConversationStore();
