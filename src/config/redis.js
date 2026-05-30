import IORedis from "ioredis";
import { config } from "../constants/config.js";

const redisConfig = {
    host: config.REDIS_HOST,
    port: config.REDIS_PORT,
    password: config.REDIS_PASSWORD || undefined,
    maxRetriesPerRequest: null
}

const redisConnection = new IORedis(redisConfig);

redisConnection.on("connect", () => {
  console.log("🚀 Successfully connected to Redis for BullMQ");
});

redisConnection.on("error", (err) => {
  console.error("❌ Redis connection error:", err);
});

export default redisConnection;