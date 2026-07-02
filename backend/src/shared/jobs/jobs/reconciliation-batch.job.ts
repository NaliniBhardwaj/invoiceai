import type { Job, JobResult } from "@/shared/jobs/job.types";

/**
 * Runs scheduled GST reconciliation against newly arrived GST source
 * files for each organization. Stubbed pending ReconciliationService
 * (Phase 4).
 */
export const reconciliationBatchJob: Job = {
  name: "reconciliation-batch",
  cronExpression: "0 3 * * 1", // weekly, Monday 03:00
  enabled: false,
  handler: async (): Promise<JobResult> => {
    return {
      success: true,
      summary: "Reconciliation batch job not yet implemented — pending ReconciliationService",
    };
  },
};
