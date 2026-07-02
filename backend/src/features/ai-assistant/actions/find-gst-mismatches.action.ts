import { toolRegistry } from "@/features/ai-assistant/tool-registry";
import { reconciliationService } from "@/features/reconciliation/reconciliation.service";

toolRegistry.register({
  name: "find_gst_mismatches",
  description: "List all GST mismatches from a completed reconciliation run.",
  parameters: {
    type: "object",
    properties: {
      runId: { type: "string", description: "Reconciliation run ID" },
    },
    required: ["runId"],
  },
  handler: async (args, ctx) => {
    const report = await reconciliationService.getReport(ctx.organizationId, String(args.runId));
    const mismatches = [...report.gstMismatches, ...report.taxDifferences];
    return {
      success: true,
      message:
        mismatches.length > 0
          ? `Found ${mismatches.length} GST/tax mismatches in run ${args.runId}.`
          : "No GST mismatches found in this reconciliation run.",
      data: { mismatches },
    };
  },
});
