import { Worker, Queue } from "bullmq";
import IORedis from "ioredis";
import logger from "./logger/logger.js";

const connection = new IORedis({ maxRetriesPerRequest: null });

// Dead letter queue
const deadLetterQueue = new Queue("email-dlq", { connection });

// Monitoring counts
let processedJobs = 0;
let failedJobs = 0;
let totalProcessingTime = 0;

// Worker with concurrency
const worker = new Worker(
  "email-queue",
  async (job) => {
    const start = Date.now(); // fix: define start time
    logger.info(`Processing job ${job.id} (attempt ${job.attemptsMade + 1})`);

    // Simulate job processing
    await new Promise((resolve, reject) => {
      setTimeout(() => {
        if (Math.random() > 0.1) return reject(new Error("Random failure"));
        logger.info(`✅ Email sent to ${job.data.email} (job: ${job.id})`);
        resolve();
      }, 2000);
    });

    const duration = Date.now() - start;
    totalProcessingTime += duration;
    processedJobs++;
  },
  {
    connection,
    concurrency: 3,
  }
);

// Event listeners
worker.on("completed", (job) =>
  logger.info(`Job ${job.id} completed successfully`)
);

worker.on("failed", async (job, err) => {
  failedJobs++; // fix: increment failed jobs
  logger.error(`Job ${job.id} failed: ${err.message}`);

  // Move to DLQ if all retries exhausted
  if (job.attemptsMade >= job.opts.attempts) {
    logger.warn(`Moving job ${job.id} to Dead Letter Queue`);
    await deadLetterQueue.add(job.name, job.data, { attempts: 1 });
  }
});

// DLQ Worker
const dlqWorker = new Worker(
  "email-dlq",
  async (job) => {
    logger.warn(`🔴 DLQ job ${job.id} received`);
    logger.info("Data:", job.data);

    await new Promise((resolve) => {
      setTimeout(() => {
        logger.info(`✅ Email sent to ${job.data.email} (job: ${job.id})`);
        resolve();
      }, 2000);
    });
  },
  { connection, concurrency: 1 }
);

dlqWorker.on("completed", (job) => logger.info(`DLQ job ${job.id} processed`));
dlqWorker.on("failed", (job, err) =>
  logger.error(`DLQ job ${job.id} failed: ${err.message}`)
);

// Monitoring stats
setInterval(() => {
  const avgTime = processedJobs
    ? (totalProcessingTime / processedJobs).toFixed(2)
    : 0;
  logger.info(`
📊 Queue Monitoring:
Processed Jobs: ${processedJobs}
Failed Jobs: ${failedJobs}
Average Processing Time: ${avgTime} ms
  `);
}, 10000);
