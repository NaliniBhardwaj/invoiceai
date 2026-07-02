export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  actionTaken: string | null;
  actionData: Record<string, unknown> | null;
  createdAt: string;
}

export interface ChatResponse {
  conversationId: string;
  response: string;
  actionTaken: string | null;
  actionData: Record<string, unknown> | null;
}
