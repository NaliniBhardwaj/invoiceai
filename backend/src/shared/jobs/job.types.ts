/**
 * A Job is pure orchestration: it has a name, a cron trigger, and a
 * handler that calls into existing feature services. Jobs never contain
 * business logic themselves — that lives in the services they call.
 */
export interface Job {
  /** Unique job name, used for logging and ScheduledJobRun rows. */
  name: string;
  /** Standard 5-field cron expression. */
  cronExpression: string;
  /** Whether the job starts enabled when the scheduler boots. */
  enabled: boolean;
  handler: () => Promise<JobResult>;
}

export interface JobResult {
  success: boolean;
  summary: string;
  data?: Record<string, unknown>;
}
