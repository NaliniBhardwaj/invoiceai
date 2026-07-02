import { z } from "zod";
import { paginationQuerySchema } from "@/shared/utils/pagination";

export const createPurchaseOrderSchema = z.object({
  customerId: z.string().cuid(),
  poNumber: z.string().min(1).max(50).optional(),
});

export const updatePurchaseOrderSchema = z.object({
  status: z.enum(["OPEN", "PARTIALLY_INVOICED", "CLOSED", "CANCELLED"]).optional(),
});

export const purchaseOrderQuerySchema = paginationQuerySchema.extend({
  status: z.enum(["OPEN", "PARTIALLY_INVOICED", "CLOSED", "CANCELLED"]).optional(),
  customerId: z.string().optional(),
});

export type CreatePurchaseOrderInput = z.infer<typeof createPurchaseOrderSchema>;
export type UpdatePurchaseOrderInput = z.infer<typeof updatePurchaseOrderSchema>;
export type PurchaseOrderQuery = z.infer<typeof purchaseOrderQuerySchema>;
