import { toolRegistry } from "@/features/ai-assistant/tool-registry";
import { invoiceService } from "@/features/invoices/invoice.service";
import { createInvoiceSchema } from "@/features/invoices/invoice.schema";

toolRegistry.register({
  name: "create_invoice",
  description:
    "Create a new invoice for a customer. Supports subscription plans, renewals, one-time purchases, and purchase orders.",
  parameters: {
    type: "object",
    properties: {
      customerId: { type: "string", description: "The customer's ID" },
      type: {
        type: "string",
        enum: ["SUBSCRIPTION_NEW", "SUBSCRIPTION_RENEWAL", "ONE_TIME", "PURCHASE_ORDER"],
      },
      subscriptionPlan: { type: "string", description: "Plan name (for subscription types)" },
      subscriptionDuration: { type: "number", description: "Duration in months" },
      invoiceDate: { type: "string", description: "Invoice date in ISO format" },
      dueDate: { type: "string", description: "Due date in ISO format" },
      taxPercentage: { type: "number", description: "GST rate (5, 12, 18, or 28)" },
      lineItems: {
        type: "array",
        items: {
          type: "object",
          properties: {
            description: { type: "string" },
            quantity: { type: "number" },
            unitPrice: { type: "number" },
          },
          required: ["description", "quantity", "unitPrice"],
        },
      },
      purchaseOrderId: { type: "string", description: "Optional PO ID to link" },
    },
    required: ["customerId", "type", "invoiceDate", "dueDate", "taxPercentage", "lineItems"],
  },
  handler: async (args, ctx) => {
    const input = createInvoiceSchema.parse(args);
    const invoice = await invoiceService.create(ctx.organizationId, ctx.userId, input);
    return {
      success: true,
      message: `Invoice ${invoice.invoiceNumber} created for ${invoice.customerName}. Grand total: ₹${invoice.grandTotal}`,
      data: { invoiceId: invoice.id, invoiceNumber: invoice.invoiceNumber, grandTotal: invoice.grandTotal },
    };
  },
});
