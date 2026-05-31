import IORedis from "ioredis";
import { config } from "../constants/config.js";

const redisUrl = config.REDIS_URL;
const redisConnection = new IORedis(redisUrl, {maxRetriesPerRequest: null});

redisConnection.on("connect", () => {
  console.log("🚀 Successfully connected to Redis for BullMQ");
});

redisConnection.on("error", (err) => {
  console.error("❌ Redis connection error:", err);
});

export default redisConnection;