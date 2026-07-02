import { z } from "zod";
export const paymentSchema = z.object({
  invoiceId: z.string().min(1, "Invoice is required"),
  amount: z.number().positive("Amount must be positive"),
  paidAt: z.string().min(1, "Payment date is required"),
  method: z.string().optional(),
  reference: z.string().optional(),
});
export type PaymentFormValues = z.infer<typeof paymentSchema>;
