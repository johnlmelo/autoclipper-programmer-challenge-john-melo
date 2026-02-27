import { Worker } from "bullmq"
import IORedis from "ioredis"
import { db } from "./db.js"
import { processRender } from "./render.js"

const connection = new IORedis({
  host: process.env.REDIS_HOST,
  port: Number(process.env.REDIS_PORT),
  maxRetriesPerRequest: null
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

worker.on("completed", (job) => {
  console.log(`Render job completed: ${job.id}`)
})

worker.on("failed", (job, error) => {
  console.error(`Render job failed: ${job?.id}`, error)
})

worker.on("failed", async (job, error) => {
  const renderId = job?.data?.renderId as string | undefined
  if (!job || !renderId) {
    return
  }

  const maxAttempts = Number(job.opts.attempts ?? 1)
  const hasRetryRemaining = job.attemptsMade < maxAttempts

  if (hasRetryRemaining) {
    await db.query(
      "UPDATE renders SET status = 'queued', error = $1 WHERE id = $2",
      [String(error), renderId]
    )
    return
  }

  await db.query(
    "UPDATE renders SET status = 'failed', completed_at = NOW(), error = $1 WHERE id = $2",
    [String(error), renderId]
  )
})
