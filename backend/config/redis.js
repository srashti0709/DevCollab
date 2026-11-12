
import "dotenv/config";
import Redis from "ioredis";

const redisUrl =
    process.env.REDIS_URL || "redis://127.0.0.1:6379";

const redis = new Redis(redisUrl, {
    // Stop individual Redis commands from waiting indefinitely.
    connectTimeout: 10000,

    // Limit retries for individual commands.
    maxRetriesPerRequest: 3,

    // Retry reconnection with a capped delay.
    retryStrategy(times) {
        return Math.min(times * 200, 2000);
    },
});

redis.on("connect", () => {
    console.log("Redis connected successfully!");
});

redis.on("error", (error) => {
    console.error("Redis connection error:", error.message);
});

export default redis;
