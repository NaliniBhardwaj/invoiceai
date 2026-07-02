import { z } from "zod";
import { paginationQuerySchema } from "@/shared/utils/pagination";

const lineItemSchema = z.object({
  description: z.string().min(1).max(300),
  quantity: z.number().positive(),
  unitPrice: z.number().positive(),
});

export const createInvoiceSchema = z.object({
  customerId: z.string().cuid(),
  purchaseOrderId: z.string().cuid().optional(),
  type: z.enum(["SUBSCRIPTION_NEW", "SUBSCRIPTION_RENEWAL", "ONE_TIME", "PURCHASE_ORDER"]),
  subscriptionPlan: z.string().max(100).optional(),
  subscriptionDuration: z.number().int().positive().optional(),
  invoiceDate: z.coerce.date(),
  dueDate: z.coerce.date(),
  taxPercentage: z.number().min(0).max(28),
  lineItems: z.array(lineItemSchema).min(1, "At least one line item is required"),
});

export const updateInvoiceSchema = createInvoiceSchema
  .partial()
  .omit({ type: true, customerId: true });

export const issueInvoiceSchema = z.object({ dueDate: z.coerce.date().optional() });

export const invoiceQuerySchema = paginationQuerySchema.extend({
  status: z
    .enum(["DRAFT", "ISSUED", "PAID", "PARTIALLY_PAID", "OVERDUE", "CANCELLED"])
    .optional(),
  type: z
    .enum(["SUBSCRIPTION_NEW", "SUBSCRIPTION_RENEWAL", "ONE_TIME", "PURCHASE_ORDER"])
    .optional(),
  customerId: z.string().optional(),
  fromDate: z.coerce.date().optional(),
  toDate: z.coerce.date().optional(),
});

export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>;
export type UpdateInvoiceInput = z.infer<typeof updateInvoiceSchema>;
export type InvoiceQuery = z.infer<typeof invoiceQuerySchema>;
