import { Worker } from "bullmq";
import redisConnection from "../../../../config/redis.js";
import { getIO } from "../../../../config/socketConfig.js";
import { processAnalyzeJobs, processFetchJobs } from "./processor.js";
import RadarSyncLog from "../radarSyncModel.js";

export const fetchWorker = new Worker("radar-fetch", processFetchJobs, {
  connection: redisConnection,
  concurrency: 5, // 5 categories fetched in parallel
});

export const analyzeWorker = new Worker("radar-analyze", processAnalyzeJobs, {
  connection: redisConnection,
  concurrency: 2, // respect Gemini rate limits
});

fetchWorker.on("failed", (job, err) => {
  console.error(
    `Fetch job failed for category ${job.data.category}:`,
    err.message,
  );
  emitRadarFailure(job, err, "radar-fetch");
  markRadarFailed(job?.data?.workspaceId).catch((error) => {
    console.error("Failed to update radar status:", error.message);
  });
});

analyzeWorker.on("failed", (job, err) => {
  console.error(
    `Analyze job failed for category ${job.data.category}:`,
    err.message,
  );
  emitRadarFailure(job, err, "radar-analyze");
  markRadarFailed(job?.data?.workspaceId).catch((error) => {
    console.error("Failed to update radar status:", error.message);
  });
});

function emitRadarFailure(job, err, queueName) {
  const workspaceId = job?.data?.workspaceId;
  if (!workspaceId) return;

  const io = getIO();
  io.to(workspaceId).emit("radar:error", {
    workspaceId,
    category: job?.data?.category,
    queue: queueName,
    message: err?.message || "Radar job failed",
  });
}

async function markRadarFailed(workspaceId) {
  if (!workspaceId) return;
  await RadarSyncLog.findOneAndUpdate({ workspaceId }, { status: "failed" });
}
