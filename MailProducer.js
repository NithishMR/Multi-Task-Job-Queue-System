// MailProducer.js
import { Queue } from "bullmq";
import IORedis from "ioredis";

const connection = new IORedis({ maxRetriesPerRequest: null });
export const EmailQueue = new Queue("email-queue", { connection });

export const MailProducer = async ({ from, to, subject, text, html }) => {
  const result = await EmailQueue.add(
    "Email-Job",
    { from, to, subject, text, html },
    {
      attempts: 3,
      backoff: { type: "fixed", delay: 5000 },
    }
  );
  console.log(`Email from ${from} added to queue (jobID: ${result.id})`);
  return { status: "Email Job Queued", jobID: result.id };
};
