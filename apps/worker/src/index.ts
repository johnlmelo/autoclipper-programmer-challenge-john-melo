import "dotenv/config"
import { worker } from "./queue.js"
import { initBundle } from "./render.js"

async function bootstrap() {
  await initBundle()
  console.log("Worker ready 🚀")
}

bootstrap()