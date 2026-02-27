import { Queue } from "bullmq";
import { Redis } from "ioredis";
const getRequiredEnv = (name) => {
    const value = process.env[name];
    if (!value) {
        throw new Error(`Missing required environment variable: ${name}`);
    }
    return value;
};
const redisPort = Number(getRequiredEnv("REDIS_PORT"));
if (Number.isNaN(redisPort)) {
    throw new Error("REDIS_PORT must be a valid number");
}
export const renderQueueName = "render-queue";
export const redisConnection = new Redis({
    host: getRequiredEnv("REDIS_HOST"),
    port: redisPort,
    maxRetriesPerRequest: null
});
export const renderQueue = new Queue(renderQueueName, {
    connection: redisConnection
});
