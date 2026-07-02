import { toolRegistry } from "@/features/ai-assistant/tool-registry";
import { reconciliationService } from "@/features/reconciliation/reconciliation.service";

toolRegistry.register({
  name: "explain_reconciliation",
  description: "Explain the findings from a completed GST reconciliation run in plain language.",
  parameters: {
    type: "object",
    properties: {
      runId: { type: "string", description: "Reconciliation run ID" },
    },
    required: ["runId"],
  },
  handler: async (args, ctx) => {
    const report = await reconciliationService.getReport(ctx.organizationId, String(args.runId));
    const { summary } = report;
    const topIssues = summary.byType
      .sort((a, b) => b.count - a.count)
      .slice(0, 3)
      .map((t) => `${t.count} ${t.type.toLowerCase().replace(/_/g, " ")} (${t.severity} severity)`)
      .join(", ");

    return {
      success: true,
      message: `Reconciliation for ${report.period}: ${summary.totalFindings} findings. Top issues: ${topIssues || "none"}. ${report.unpaidInvoices.length} unpaid invoices detected.`,
      data: report as unknown as Record<string, unknown>,
    };
  },
});
