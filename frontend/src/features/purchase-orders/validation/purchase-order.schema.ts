import { z } from "zod";

export const purchaseOrderSchema = z.object({
  customerId: z.string().min(1, "Customer is required"),
  poNumber: z.string().max(50).optional(),
});

export const updatePurchaseOrderSchema = z.object({
  status: z.enum(["OPEN", "PARTIALLY_INVOICED", "CLOSED", "CANCELLED"]),
});

export type PurchaseOrderFormValues = z.infer<typeof purchaseOrderSchema>;
export type UpdatePurchaseOrderValues = z.infer<typeof updatePurchaseOrderSchema>;
