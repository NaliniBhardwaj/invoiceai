import { z } from "zod";
import { paginationQuerySchema } from "@/shared/utils/pagination";

export const recordPaymentSchema = z.object({
  invoiceId: z.string().cuid(),
  amount: z.number().positive(),
  paidAt: z.coerce.date(),
  method: z.string().max(50).optional(),
  reference: z.string().max(100).optional(),
});

export const paymentQuerySchema = paginationQuerySchema.extend({
  invoiceId: z.string().optional(),
  fromDate: z.coerce.date().optional(),
  toDate: z.coerce.date().optional(),
});

export type RecordPaymentInput = z.infer<typeof recordPaymentSchema>;
export type PaymentQuery = z.infer<typeof paymentQuerySchema>;
