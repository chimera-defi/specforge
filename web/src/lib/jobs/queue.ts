/**
 * Background Job Processing System
 * Provides job queue management with retry logic and monitoring
 */

import { logger } from "../logger";

export type JobStatus = "pending" | "processing" | "completed" | "failed" | "delayed";

export interface Job<T = unknown> {
  id: string;
  name: string;
  data: T;
  status: JobStatus;
  attempts: number;
  maxAttempts: number;
  delay: number;
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
  failedAt?: number;
  error?: string;
  result?: unknown;
  priority: number;
}

export interface JobHandler<T = unknown, R = unknown> {
  (data: T): Promise<R>;
}

export interface JobOptions {
  maxAttempts?: number;
  delay?: number;
  priority?: number;
}

class JobQueue {
  private queue: Map<string, Job> = new Map();
  private handlers: Map<string, JobHandler> = new Map();
  private processing = false;
  private concurrency = 5;
  private activeJobs = 0;

  /**
   * Register a job handler
   */
  registerHandler<T = unknown, R = unknown>(name: string, handler: JobHandler<T, R>): void {
    this.handlers.set(name, handler as JobHandler);
    logger.info("Job handler registered", { name });
  }

  /**
   * Add a job to the queue
   */
  async addJob<T = unknown>(
    name: string,
    data: T,
    options: JobOptions = {}
  ): Promise<string> {
    const job: Job<T> = {
      id: this.generateJobId(),
      name,
      data,
      status: "pending",
      attempts: 0,
      maxAttempts: options.maxAttempts || 3,
      delay: options.delay || 0,
      createdAt: Date.now(),
      priority: options.priority || 0,
    };

    this.queue.set(job.id, job);
    logger.info("Job added to queue", { jobId: job.id, name, priority: job.priority });

    // Start processing if not already running
    if (!this.processing) {
      this.processQueue();
    }

    return job.id;
  }

  /**
   * Process the queue
   */
  private async processQueue(): Promise<void> {
    if (this.processing || this.activeJobs >= this.concurrency) {
      return;
    }

    this.processing = true;

    while (this.activeJobs < this.concurrency) {
      const job = this.getNextJob();
      if (!job) {
        break;
      }

      this.activeJobs++;
      this.processJob(job);
    }

    this.processing = false;
  }

  /**
   * Get the next job to process
   */
  private getNextJob(): Job | null {
    const jobs = Array.from(this.queue.values())
      .filter((j) => j.status === "pending")
      .filter((j) => j.delay === 0 || Date.now() >= j.createdAt + j.delay)
      .sort((a, b) => b.priority - a.priority);

    return jobs[0] || null;
  }

  /**
   * Process a single job
   */
  private async processJob(job: Job): Promise<void> {
    const handler = this.handlers.get(job.name);
    if (!handler) {
      this.failJob(job.id, new Error(`No handler for job: ${job.name}`));
      return;
    }

    job.status = "processing";
    job.startedAt = Date.now();
    this.queue.set(job.id, job);

    try {
      logger.info("Processing job", { jobId: job.id, name: job.name });

      const result = await handler(job.data);

      job.status = "completed";
      job.completedAt = Date.now();
      job.result = result;
      this.queue.set(job.id, job);

      logger.info("Job completed", {
        jobId: job.id,
        name: job.name,
        duration: job.completedAt - job.startedAt,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      job.attempts++;

      if (job.attempts >= job.maxAttempts) {
        this.failJob(job.id, error);
      } else {
        // Retry with exponential backoff
        job.status = "pending";
        job.delay = Math.pow(2, job.attempts) * 1000; // Exponential backoff
        job.error = errorMessage;
        this.queue.set(job.id, job);

        logger.warn("Job failed, retrying", {
          jobId: job.id,
          name: job.name,
          attempt: job.attempts,
          maxAttempts: job.maxAttempts,
          delay: job.delay,
          error: errorMessage,
        });
      }
    } finally {
      this.activeJobs--;
      this.processQueue();
    }
  }

  /**
   * Mark a job as failed
   */
  private failJob(jobId: string, error: unknown): void {
    const job = this.queue.get(jobId);
    if (!job) {
      return;
    }

    job.status = "failed";
    job.failedAt = Date.now();
    job.error = error instanceof Error ? error.message : String(error);
    this.queue.set(jobId, job);

    logger.error("Job failed permanently", {
      jobId,
      name: job.name,
      error: job.error,
      attempts: job.attempts,
    });
  }

  /**
   * Get job status
   */
  getJob(jobId: string): Job | undefined {
    return this.queue.get(jobId);
  }

  /**
   * Get all jobs
   */
  getAllJobs(): Job[] {
    return Array.from(this.queue.values());
  }

  /**
   * Get jobs by status
   */
  getJobsByStatus(status: JobStatus): Job[] {
    return Array.from(this.queue.values()).filter((j) => j.status === status);
  }

  /**
   * Remove completed jobs
   */
  removeCompletedJobs(olderThan: number = 3600000): void {
    const now = Date.now();
    for (const [jobId, job] of this.queue.entries()) {
      if (
        (job.status === "completed" || job.status === "failed") &&
        job.completedAt &&
        now - job.completedAt > olderThan
      ) {
        this.queue.delete(jobId);
      }
    }
    logger.info("Completed jobs removed", { count: this.queue.size });
  }

  /**
   * Get queue statistics
   */
  getStats() {
    const jobs = Array.from(this.queue.values());
    return {
      total: jobs.length,
      pending: jobs.filter((j) => j.status === "pending").length,
      processing: jobs.filter((j) => j.status === "processing").length,
      completed: jobs.filter((j) => j.status === "completed").length,
      failed: jobs.filter((j) => j.status === "failed").length,
      active: this.activeJobs,
      concurrency: this.concurrency,
    };
  }

  /**
   * Generate a unique job ID
   */
  private generateJobId(): string {
    return `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Set concurrency
   */
  setConcurrency(concurrency: number): void {
    this.concurrency = concurrency;
    logger.info("Job queue concurrency updated", { concurrency });
  }

  /**
   * Clear the queue
   */
  clear(): void {
    this.queue.clear();
    logger.info("Job queue cleared");
  }
}

// Singleton instance
let jobQueue: JobQueue | null = null;

export function getJobQueue(): JobQueue {
  if (!jobQueue) {
    jobQueue = new JobQueue();
  }
  return jobQueue;
}

/**
 * Register default job handlers
 */
export function registerDefaultJobHandlers(): void {
  const queue = getJobQueue();

  // Example: Send email job
  queue.registerHandler("send_email", async (data: { to: string; subject: string; body: string }) => {
    logger.info("Sending email", { to: data.to, subject: data.subject });
    // Simulate email sending
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return { sent: true, messageId: `msg_${Date.now()}` };
  });

  // Example: Generate export job
  queue.registerHandler("generate_export", async (data: { documentId: string; format: string }) => {
    logger.info("Generating export", { documentId: data.documentId, format: data.format });
    // Simulate export generation
    await new Promise((resolve) => setTimeout(resolve, 2000));
    return { exportUrl: `https://exports.specforge.dev/${data.documentId}.${data.format}` };
  });

  // Example: Cleanup job
  queue.registerHandler("cleanup_old_data", async (data: { days: number }) => {
    logger.info("Cleaning up old data", { days: data.days });
    // Simulate cleanup
    await new Promise((resolve) => setTimeout(resolve, 500));
    return { cleaned: true, recordsDeleted: 100 };
  });

  logger.info("Default job handlers registered", { count: 3 });
}
