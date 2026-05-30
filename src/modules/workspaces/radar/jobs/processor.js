import RadarService from "../service.js";
import Radar from "../radarModel.js";
import RadarSyncLog from "../radarSyncModel.js";
import redisConnection from "../../../../config/redis.js";
import { getIO } from "../../../../config/socketConfig.js";
import { analyzeQueue } from "./queue.radar.js";

const radarService = new RadarService(Radar);
const LOOK_BACK_DAYS = 1000;

export async function processFetchJobs(job) {
  const io = getIO();
  const { workspaceId, category, userId, totalCategories } = job.data;
  const newPapers = await radarService.fetchLatestArxivPapers(
    category,
    LOOK_BACK_DAYS,
  );

  if (!newPapers || newPapers.length === 0) {
    io.to(workspaceId).emit("radar:category:done", {
      category,
      found: 0,
    });
    await checkAndCompleteRadar(workspaceId, totalCategories);
    return;
  }

  await analyzeQueue.add("analyze-papers", {
    workspaceId,
    category,
    userId,
    newPapers,
    totalCategories,
  });
}

export async function processAnalyzeJobs(job) {
  const io = getIO();
  const { workspaceId, category, userId, newPapers, totalCategories } =
    job.data;

  const savedPapers = await radarService.fetchPapersOfCategory(
    workspaceId,
    category,
  );

  if (!savedPapers || savedPapers.length === 0) {
    io.to(workspaceId).emit("radar:category:done", {
      category,
      found: 0,
    });
    await checkAndCompleteRadar(workspaceId, totalCategories);
    return;
  }

  const findings = await radarService.analyzeWithGemini(newPapers, savedPapers);
  for (const finding of findings) {
    if (!finding.isRelevant && !finding.hasContradiction) continue;

    const alertType = finding.hasContradiction ? "contradiction" : "relevance";

    const saved = await radarService.saveRadar(workspaceId, category, alertType, newPapers);
    io.to(workspaceId).emit("radar:finding", { finding: saved });
    await checkAndCompleteRadar(workspaceId, totalCategories);
  }
}

async function checkAndCompleteRadar(workspaceId, totalCategories) {
  const io = getIO();
  const key = `radar:progress:${workspaceId}`;
  const done = await redisConnection.incr(key);

  if (done >= totalCategories) {
    await redisConnection.del(key);
    await RadarSyncLog.findOneAndUpdate({ workspaceId }, { status: "idle" });
    io.to(workspaceId).emit("radar:complete", { workspaceId });
  }
}
