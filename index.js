// index.js
import express from "express";
import { ExpressAdapter } from "@bull-board/express";
import { createBullBoard } from "@bull-board/api";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import { MailProducer, EmailQueue } from "./MailProducer.js";
import { getMetrics, deadLetterQueue, startWorkers } from "./MailConsumer.js";
const app = express();
const port = 3000;
startWorkers();
app.use(express.json());

// ---- Bull Board Setup ----
const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath("/admin/queues");

// Add your queues to Bull Board (BullMQAdapter for bullmq)
createBullBoard({
  queues: [new BullMQAdapter(EmailQueue), new BullMQAdapter(deadLetterQueue)],
  serverAdapter,
});

// Expose Bull Board UI
app.use("/admin/queues", serverAdapter.getRouter());

// ---- API Routes ----

// POST /send-email → add email job
app.post("/send-email", async (req, res) => {
  try {
    const result = await MailProducer(req.body);
    res.status(200).json({ message: result.status, jobID: result.jobID });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal error, try again" });
  }
});

// GET /health → check server status
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date() });
});

// GET /metrics → return JSON metrics
app.get("/metrics", (req, res) => {
  const result = getMetrics();
  res.status(200).json(result);
});

// GET / → simple hello world
app.get("/", (req, res) => {
  res.send("Hello world");
});

// ---- Start Server ----
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
  console.log(`Bull Board UI: http://localhost:${port}/admin/queues`);
});
