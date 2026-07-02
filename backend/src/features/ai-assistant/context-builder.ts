import type { AiToolContext } from "@/features/ai-assistant/tool-registry";

/**
 * Gathers the organization/customer/invoice context relevant to a user's
 * message before it's sent to the Intent Classifier — e.g. recent
 * customers, open invoices, the last reconciliation run. Keeps Gemini
 * grounded in real data instead of guessing IDs. Implemented in Phase 5
 * alongside the invoice/reconciliation services it reads from.
 */
export interface ConversationContext {
  organizationName: string;
  recentCustomerNames: string[];
  openInvoiceCount: number;
}

export async function buildContext(_ctx: AiToolContext): Promise<ConversationContext> {
  throw new Error("buildContext not yet implemented — pending Phase 5 (depends on Invoice/Customer services)");
}
