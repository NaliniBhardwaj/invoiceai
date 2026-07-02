import { env } from "@/config/env";
import { logger } from "@/config/logger";
import { toolRegistry } from "@/features/ai-assistant/tool-registry";

interface GeminiFunctionCall {
  name: string;
  args: Record<string, unknown>;
}

interface ClassifiedIntent {
  toolName: string | null;
  toolArgs: Record<string, unknown>;
  directResponse: string | null;
}

export async function classifyIntent(
  userMessage: string,
  conversationContext: string
): Promise<ClassifiedIntent> {
  if (!env.GEMINI_API_KEY) {
    return {
      toolName: null,
      toolArgs: {},
      directResponse:
        "The AI assistant is not configured yet — set GEMINI_API_KEY in your environment to enable it.",
    };
  }

  const tools = toolRegistry.list().map((t) => ({
    name: t.name,
    description: t.description,
    parameters: t.parameters,
  }));

  const systemInstruction = `You are InvoiceAI's financial operations assistant for Indian SMEs.
You help with invoicing, GST reconciliation, and financial reporting.
When a user request maps to a specific business action, call the appropriate tool.
When explaining or answering questions, respond conversationally.
Always refer to amounts in Indian Rupees (Rs.).
${conversationContext}`;

  const body = {
    system_instruction: { parts: [{ text: systemInstruction }] },
    contents: [{ role: "user", parts: [{ text: userMessage }] }],
    tools: [{ function_declarations: tools }],
    tool_config: { function_calling_config: { mode: "AUTO" } },
  };

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${env.GEMINI_MODEL}:generateContent?key=${env.GEMINI_API_KEY}`,
    { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }
  );

  if (!response.ok) {
    const errorText = await response.text();
    logger.error({ status: response.status, error: errorText }, "Gemini API error");
    throw new Error(`Gemini API error: ${response.status}`);
  }

  const data = (await response.json()) as {
    candidates: Array<{
      content: {
        parts: Array<{ functionCall?: GeminiFunctionCall; text?: string }>;
      };
    }>;
  };

  const parts = data.candidates[0]?.content?.parts ?? [];
  const functionCallPart = parts.find((p) => p.functionCall);
  const textPart = parts.find((p) => p.text);

  if (functionCallPart?.functionCall) {
    return {
      toolName: functionCallPart.functionCall.name,
      toolArgs: functionCallPart.functionCall.args,
      directResponse: null,
    };
  }

  return {
    toolName: null,
    toolArgs: {},
    directResponse: textPart?.text ?? "I couldn't understand that request. Could you rephrase it?",
  };
}
