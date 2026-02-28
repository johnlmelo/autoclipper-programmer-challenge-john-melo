import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import { existsSync } from "fs";
import { mkdir } from "fs/promises";
import path from "path";
import { db } from "./db.js";
import { toSignedMinioUrl, uploadFile } from "./storage.js";
const OUTPUT_DIRECTORY = "/tmp/renders";
const REMOTION_COMPOSITION_ID = "RenderComposition";
const RENDER_TIMEOUT_MS = 5 * 60 * 1000;
let bundleLocation;
const resolveRemotionEntryPoint = () => {
    const jsEntryPoint = path.resolve("./src/remotion/index.js");
    if (existsSync(jsEntryPoint)) {
        return jsEntryPoint;
    }
    const tsEntryPoint = path.resolve("./src/remotion/index.ts");
    if (existsSync(tsEntryPoint)) {
        return tsEntryPoint;
    }
    throw new Error("Remotion entry point not found. Expected ./src/remotion/index.js or ./src/remotion/index.ts");
};
export async function initBundle() {
    const entryPoint = resolveRemotionEntryPoint();
    bundleLocation = await bundle({
        entryPoint
    });
}
const withTimeout = async (promise, timeoutMs) => {
    let timeoutHandle = null;
    try {
        return await Promise.race([
            promise,
            new Promise((_, reject) => {
                timeoutHandle = setTimeout(() => {
                    reject(new Error(`Render timeout after ${timeoutMs}ms`));
                }, timeoutMs);
            })
        ]);
    }
    finally {
        if (timeoutHandle) {
            clearTimeout(timeoutHandle);
        }
    }
};
export async function processRender(renderId) {
    if (!bundleLocation) {
        throw new Error("Remotion bundle is not initialized");
    }
    const { rows } = await db.query("SELECT id, composition FROM renders WHERE id = $1", [renderId]);
    const render = rows[0];
    if (!render) {
        throw new Error(`Render ${renderId} not found`);
    }
    try {
        await db.query("UPDATE renders SET status = 'rendering', started_at = NOW(), completed_at = NULL, output_url = NULL, error = NULL WHERE id = $1", [renderId]);
        await mkdir(OUTPUT_DIRECTORY, { recursive: true });
        const outputPath = `${OUTPUT_DIRECTORY}/${renderId}.mp4`;
        const rawInputProps = render.composition;
        const rawElements = Array.isArray(rawInputProps.elements) ? rawInputProps.elements : [];
        const elements = await Promise.all(rawElements.map(async (element) => {
            if (element &&
                typeof element === "object" &&
                "sourceUrl" in element &&
                typeof element.sourceUrl === "string") {
                const signedSourceUrl = await toSignedMinioUrl(element.sourceUrl);
                return {
                    ...element,
                    sourceUrl: signedSourceUrl
                };
            }
            return element;
        }));
        const inputProps = {
            ...rawInputProps,
            elements
        };
        await withTimeout((async () => {
            const composition = await selectComposition({
                serveUrl: bundleLocation,
                id: REMOTION_COMPOSITION_ID,
                inputProps
            });
            await renderMedia({
                composition,
                serveUrl: bundleLocation,
                codec: "h264",
                outputLocation: outputPath,
                inputProps,
                timeoutInMilliseconds: RENDER_TIMEOUT_MS
            });
        })(), RENDER_TIMEOUT_MS);
        const outputObjectKey = `renders/${renderId}.mp4`;
        const publicOutputUrl = await uploadFile(outputObjectKey, outputPath);
        await db.query("UPDATE renders SET status = 'completed', completed_at = NOW(), output_url = $1, error = NULL WHERE id = $2", [publicOutputUrl, renderId]);
    }
    catch (err) {
        throw err;
    }
}
