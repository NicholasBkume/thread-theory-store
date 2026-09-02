import Redis from "ioredis";
import dotenv from "dotenv";
import { logger } from "./logger.js";

dotenv.config();

export const redis = new Redis(process.env.UPSTASH_REDIS_URL, {
    lazyConnect: true,
    maxRetriesPerRequest: 1,
});

redis.on("error", (error) => {
    logger.error("Redis client error", { error: error.message });
});
