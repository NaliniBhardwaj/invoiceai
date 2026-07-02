import { z } from "zod";

export const lineItemSchema = z.object({
  description: z.string().min(1, "Description is required"),
  quantity: z.number().positive("Quantity must be positive"),
  unitPrice: z.number().positive("Unit price must be positive"),
});

export const invoiceSchema = z.object({
  customerId: z.string().min(1, "Customer is required"),
  purchaseOrderId: z.string().optional(),
  type: z.enum(["SUBSCRIPTION_NEW", "SUBSCRIPTION_RENEWAL", "ONE_TIME", "PURCHASE_ORDER"], {
    error: "Invoice type is required",
  }),
  subscriptionPlan: z.string().optional(),
  subscriptionDuration: z.number().positive().optional(),
  invoiceDate: z.string().min(1, "Invoice date is required"),
  dueDate: z.string().min(1, "Due date is required"),
  taxPercentage: z.number().min(0).max(28),
  lineItems: z.array(lineItemSchema).min(1, "At least one line item is required"),
});

export type InvoiceFormValues = z.infer<typeof invoiceSchema>;

export const INVOICE_TYPES = [
  { value: "ONE_TIME", label: "One-Time Purchase" },
  { value: "SUBSCRIPTION_NEW", label: "New Subscription" },
  { value: "SUBSCRIPTION_RENEWAL", label: "Subscription Renewal" },
  { value: "PURCHASE_ORDER", label: "Purchase Order" },
] as const;

export const GST_RATES = [0, 5, 12, 18, 28] as const;
