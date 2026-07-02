import type { Job, JobResult } from "@/shared/jobs/job.types";

/**
 * Finds subscriptions due for renewal and generates the next invoice via
 * InvoiceService — the same code path the AI assistant and the manual
 * "create invoice" form use. Implemented in full once InvoiceService
 * lands (Phase 2); registered now so the scheduling surface is stable.
 */
export const recurringInvoiceJob: Job = {
  name: "recurring-invoice-generation",
  cronExpression: "0 2 * * *", // daily at 02:00
  enabled: false, // flipped on once InvoiceService.generateRenewal() exists
  handler: async (): Promise<JobResult> => {
    return {
      success: true,
      summary: "Recurring invoice job not yet implemented — pending InvoiceService",
    };
  },
};
