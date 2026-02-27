import { Worker } from "bullmq"
import IORedis from "ioredis"
import { processRender } from "./render.js"

const connection = new IORedis({
  host: process.env.REDIS_HOST,
  port: Number(process.env.REDIS_PORT)
})

export const worker = new Worker(
  "render-queue",
  async (job) => {
    await processRender(job.data.renderId)
  },
  {
    connection,
    concurrency: 2
  }
)