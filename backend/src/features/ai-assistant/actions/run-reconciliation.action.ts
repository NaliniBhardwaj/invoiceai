import { toolRegistry } from "@/features/ai-assistant/tool-registry";
import { reconciliationService } from "@/features/reconciliation/reconciliation.service";

toolRegistry.register({
  name: "run_reconciliation",
  description: "Start a GST reconciliation run for a specific month period.",
  parameters: {
    type: "object",
    properties: {
      period: { type: "string", description: "Period in YYYY-MM format, e.g. 2026-03" },
      sourceType: { type: "string", enum: ["GST_CSV", "GST_JSON"] },
      sourceData: { type: "string", description: "Raw CSV or JSON string from the GST portal" },
    },
    required: ["period", "sourceType", "sourceData"],
  },
  handler: async (args, ctx) => {
    const run = await reconciliationService.run(ctx.organizationId, ctx.userId, {
      period: String(args.period),
      sourceType: args.sourceType as "GST_CSV" | "GST_JSON",
      sourceData: String(args.sourceData),
    });
    return {
      success: true,
      message: `Reconciliation started for ${args.period}. Run ID: ${run.id}. Check back shortly for findings.`,
      data: { runId: run.id, period: run.period },
    };
  },
});
