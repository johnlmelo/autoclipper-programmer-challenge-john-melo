import "dotenv/config"
import { worker } from "./queue.js"
import { initBundle } from "./render.js"

async function bootstrap() {
  await initBundle()
  await worker.waitUntilReady()
  console.log("Worker ready")
}

bootstrap()
