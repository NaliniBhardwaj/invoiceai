import cron, { type ScheduledTask } from "node-cron";
import { prisma } from "@/shared/prisma/client";
import { logger } from "@/config/logger";
import type { Job } from "@/shared/jobs/job.types";

/**
 * Wraps node-cron behind a small interface. The MVP runs everything
 * in-process, which is correct for a single backend instance. The day
 * this needs to run across multiple instances (so jobs don't double-fire),
 * this class is the only thing that gets replaced with a BullMQ +
 * Redis-backed scheduler — every Job definition stays identical.
 */
class JobScheduler {
  private readonly tasks = new Map<string, ScheduledTask>();
  private readonly jobs = new Map<string, Job>();

  register(job: Job): void {
    this.jobs.set(job.name, job);

    if (!job.enabled) {
      logger.info({ job: job.name }, "Job registered but disabled");
      return;
    }

    const task = cron.schedule(job.cronExpression, () => {
      void this.run(job.name);
    });

    this.tasks.set(job.name, task);
    logger.info({ job: job.name, cron: job.cronExpression }, "Job scheduled");
  }

  /** Runs a job immediately and records the outcome, regardless of cron trigger. */
  async run(jobName: string): Promise<void> {
    const job = this.jobs.get(jobName);
    if (!job) {
      logger.error({ jobName }, "Attempted to run unknown job");
      return;
    }

    const run = await prisma.scheduledJobRun.create({
      data: { jobName: job.name, status: "RUNNING" },
    });

    try {
      const result = await job.handler();
      await prisma.scheduledJobRun.update({
        where: { id: run.id },
        data: {
          status: result.success ? "SUCCESS" : "FAILED",
          finishedAt: new Date(),
          result: (result.data ?? {}) as object,
          error: result.success ? null : result.summary,
        },
      });
      logger.info({ job: job.name, summary: result.summary }, "Job completed");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown job error";
      await prisma.scheduledJobRun.update({
        where: { id: run.id },
        data: { status: "FAILED", finishedAt: new Date(), error: message },
      });
      logger.error({ job: job.name, err: error }, "Job failed");
    }
  }

  stopAll(): void {
    for (const task of this.tasks.values()) {
      task.stop();
    }
  }
}

export const jobScheduler = new JobScheduler();
