/**
 * A Tool is the bridge between Gemini's function-calling interface and a
 * real Action Handler. The `schema` is what gets sent to Gemini so it
 * knows what arguments to extract from natural language; `handler` is
 * the function that actually runs — and that function always calls into
 * an existing feature service, never reimplements business logic.
 */
export interface AiTool {
  name: string;
  description: string;
  /** JSON-schema-shaped parameter definition, passed to Gemini function calling. */
  parameters: Record<string, unknown>;
  handler: (args: Record<string, unknown>, ctx: AiToolContext) => Promise<AiToolResult>;
}

export interface AiToolContext {
  organizationId: string;
  userId: string;
}

export interface AiToolResult {
  success: boolean;
  message: string;
  data?: Record<string, unknown>;
}

/**
 * Central registry every Action Handler registers into. The Intent
 * Classifier asks this registry for the full tool list (to send to
 * Gemini) and resolves the chosen tool name back to its handler.
 * Populated in Phase 5 as create-invoice.action.ts etc. are implemented.
 */
class ToolRegistry {
  private readonly tools = new Map<string, AiTool>();

  register(tool: AiTool): void {
    this.tools.set(tool.name, tool);
  }

  get(name: string): AiTool | undefined {
    return this.tools.get(name);
  }

  list(): AiTool[] {
    return Array.from(this.tools.values());
  }
}

export const toolRegistry = new ToolRegistry();
