import { Queue } from "bullmq";
import redisConnection from "../../../../config/redis.js";

export const fetchQueue = new Queue("radar-fetch", {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 5000 },
    removeOnComplete: true,
    removeOnFail: false,  // keep failed jobs for debugging
  },
});

export const analyzeQueue = new Queue("radar-analyze", {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 2,
    backoff: { type: "fixed", delay: 10000 },
    removeOnComplete: true,
    removeOnFail: false,
  },
});