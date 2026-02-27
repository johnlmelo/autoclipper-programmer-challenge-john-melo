import { bundle } from "@remotion/bundler"
import { renderMedia } from "@remotion/renderer"
import path from "path"
import { db } from "./db.js"
import { uploadFile } from "./storage.js"

let bundleLocation: string

export async function initBundle() {
  bundleLocation = await bundle({
    entryPoint: path.resolve("./src/remotion/index.ts")
  })
}

export async function processRender(renderId: string) {
  const { rows } = await db.query(
    "SELECT * FROM renders WHERE id = $1",
    [renderId]
  )

  const render = rows[0]

  try {
    await db.query(
      "UPDATE renders SET status = 'rendering', started_at = NOW() WHERE id = $1",
      [renderId]
    )

    const outputPath = `/tmp/${renderId}.mp4`

    await renderMedia({
      serveUrl: bundleLocation,
      composition: render.composition,
      codec: "h264",
      outputLocation: outputPath
    })

    const url = await uploadFile(`${renderId}.mp4`, outputPath)

    await db.query(
      "UPDATE renders SET status = 'completed', completed_at = NOW(), output_url = $1 WHERE id = $2",
      [url, renderId]
    )

  } catch (err) {
    await db.query(
      "UPDATE renders SET status = 'failed', error = $1 WHERE id = $2",
      [String(err), renderId]
    )
    throw err
  }
}