import { z } from "zod";
import { paginationQuerySchema } from "@/shared/utils/pagination";

export const startReconciliationSchema = z.object({
  period: z
    .string()
    .regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Period must be in YYYY-MM format (e.g. 2026-03)"),
  sourceType: z.enum(["GST_CSV", "GST_JSON"]),
  sourceData: z.string().min(1, "Source data is required"),
});

export const reconciliationQuerySchema = paginationQuerySchema.extend({
  period: z.string().optional(),
  status: z.enum(["PROCESSING", "COMPLETED", "FAILED"]).optional(),
});

export type StartReconciliationInput = z.infer<typeof startReconciliationSchema>;
export type ReconciliationQuery = z.infer<typeof reconciliationQuerySchema>;
