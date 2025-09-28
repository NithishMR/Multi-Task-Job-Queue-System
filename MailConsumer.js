// MailConsumer.js
import { Worker, Queue } from "bullmq";
import IORedis from "ioredis";
import sendMail from "./sendMail.js";

const connection = new IORedis({ maxRetriesPerRequest: null });

// Metrics
let processedJobs = 0;
let failedJobs = 0;
let totalProcessingTime = 0;

// Dead Letter Queue
export const deadLetterQueue = new Queue("email-deadLetterQueue", {
  connection,
});

// Function to start workers
export const startWorkers = () => {
  console.log("Starting main email worker...");

  // Single worker with concurrency for scalability
  const mailWorker = new Worker(
    "email-queue",
    async (job) => {
      const start = Date.now();
      try {
        await job.updateProgress(50); // halfway
        const result = await sendMail(job.data);
        await job.updateProgress(90); // almost done

        if (result.status === 200) {
          console.log(`✅ Email sent successfully for job ${job.id}`);
          console.log(`Email preview: ${result.previewURL}`);
          await job.updateProgress(100); // complete
        } else {
          throw new Error(result.message || "Unknown error");
        }

        totalProcessingTime += Date.now() - start;
        processedJobs++;
      } catch (err) {
        failedJobs++;
        throw err; // triggers retries if configured
      }
    },
    {
      connection,
      concurrency: 5, // handles 5 jobs in parallel
      removeOnComplete: true,
      removeOnFail: true,
    }
  );

  // Event listeners
  mailWorker.on("completed", (job) => {
    console.log(`Job ${job.id} completed successfully`);
  });

  mailWorker.on("failed", async (job, err) => {
    console.error(
      `Job ${job.id} failed after ${job.attemptsMade} attempts: ${err.message}`
    );
    if (job.attemptsMade >= job.opts.attempts) {
      console.warn(`Moving job ${job.id} to Dead Letter Queue`);
      await deadLetterQueue.add(job.name, job.data, { attempts: 1 });
    }
  });

  // Dead Letter Queue Worker
  console.log("Starting DLQ worker...");
  const dlqWorker = new Worker(
    "email-deadLetterQueue",
    async (job) => {
      console.warn(`DLQ received job ${job.id}, data:`, job.data);
      try {
        const result = await sendMail(job.data);
        if (result.status === 200) {
          console.log(`✅ DLQ job ${job.id} retried successfully`);
          await job.remove();
        } else {
          console.error(`DLQ job ${job.id} failed on retry`);
        }
      } catch (err) {
        console.error(`DLQ job ${job.id} retry failed: ${err.message}`);
      }
    },
    { connection, concurrency: 1, removeOnComplete: true, removeOnFail: true }
  );

  dlqWorker.on("completed", (job) =>
    console.log(`DLQ job ${job.id} processed successfully`)
  );
  dlqWorker.on("failed", (job, err) =>
    console.error(`DLQ job ${job.id} failed: ${err.message}`)
  );
};

// Export metrics
export const getMetrics = () => {
  const avgProcessingTime =
    processedJobs > 0 ? totalProcessingTime / processedJobs : 0;
  return { processedJobs, failedJobs, avgProcessingTime };
};
