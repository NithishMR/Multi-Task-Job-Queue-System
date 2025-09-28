import { Queue } from "bullmq";
import IORedis from "ioredis";

const connection = new IORedis({ maxRetriesPerRequest: null });

const notificationQueue = new Queue("email-queue", { connection });

async function init() {
  // Immediate job with retries/backoff
  const res1 = await notificationQueue.add(
    "email-job-immediate",
    {
      email: "nithishmr004@gmail.com",
      subject: "Immediate Test",
      body: "This is Nithish MR - Immediate job",
    },
    {
      attempts: 3,
      backoff: { type: "fixed", delay: 5000 },
    }
  );
  console.log(`Immediate job added: ${res1.id}`);

  // Delayed job (runs after 5 seconds)
  const res2 = await notificationQueue.add(
    "email-job-delayed",
    {
      email: "nithishmr004@gmail.com",
      subject: "Delayed Test",
      body: "This is Nithish MR - Delayed job",
    },
    {
      delay: 5000, // 5 seconds
      attempts: 3,
      backoff: { type: "fixed", delay: 3000 },
    }
  );
  console.log(`Delayed job added: ${res2.id}`);

  // Recurring job (every 10 seconds)
  const res3 = await notificationQueue.add(
    "email-job-recurring",
    {
      email: "nithishmr004@gmail.com",
      subject: "Recurring Test",
      body: "This is Nithish MR - Recurring job",
    },
    {
      repeat: { every: 10000 }, // every 10 seconds
      attempts: 3,
      backoff: { type: "fixed", delay: 2000 },
    }
  );
  console.log(`Recurring job added: ${res3.id}`);
}

init();
