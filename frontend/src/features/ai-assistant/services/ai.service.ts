import { apiClient } from "@/lib/api-client";
import type { ChatResponse } from "@/features/ai-assistant/types/ai.types";

export const aiApi = {
  chat: async (message: string, conversationId?: string): Promise<ChatResponse> => {
    const { data } = await apiClient.post<ChatResponse>("/ai/chat", { message, conversationId });
    return data;
  },
};
