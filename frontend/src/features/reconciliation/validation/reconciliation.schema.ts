import { z } from "zod";

export const startReconciliationSchema = z.object({
  period: z
    .string()
    .regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Use format YYYY-MM (e.g. 2026-03)"),
  sourceType: z.enum(["GST_CSV", "GST_JSON"]),
  sourceData: z.string().min(1, "Paste your GST data here"),
});

export type StartReconciliationValues = z.infer<typeof startReconciliationSchema>;
