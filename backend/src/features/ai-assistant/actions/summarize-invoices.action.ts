import { toolRegistry } from "@/features/ai-assistant/tool-registry";
import { invoiceService } from "@/features/invoices/invoice.service";

toolRegistry.register({
  name: "summarize_invoices",
  description: "Get a financial summary of invoices — total revenue, outstanding amounts, overdue counts.",
  parameters: {
    type: "object",
    properties: {
      period: { type: "string", description: "Optional period filter in YYYY-MM format" },
    },
  },
  handler: async (_args, ctx) => {
    const analytics = await invoiceService.getAnalytics(ctx.organizationId);
    return {
      success: true,
      message: `Invoice summary: ${analytics.totalInvoices} total invoices, ₹${analytics.totalRevenue} revenue, ₹${analytics.outstanding} outstanding, ₹${analytics.overdue} overdue.`,
      data: analytics as unknown as Record<string, unknown>,
    };
  },
});
