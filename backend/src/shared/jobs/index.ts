import { jobScheduler } from "@/shared/jobs/job-scheduler";
import { recurringInvoiceJob } from "@/shared/jobs/jobs/recurring-invoice.job";
import { paymentReminderJob } from "@/shared/jobs/jobs/payment-reminder.job";
import { reconciliationBatchJob } from "@/shared/jobs/jobs/reconciliation-batch.job";

/**
 * Single place every job gets registered. Adding a new scheduled task
 * later means writing the Job object and adding one line here — never
 * touching the scheduler or any existing job.
 */
export function registerJobs(): void {
  jobScheduler.register(recurringInvoiceJob);
  jobScheduler.register(paymentReminderJob);
  jobScheduler.register(reconciliationBatchJob);
}
