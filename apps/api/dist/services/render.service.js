import { v4 as uuidv4 } from "uuid";
import { db } from "../lib/db.js";
import { renderQueue } from "../lib/queue.js";
import { RENDER_STATUS } from "../types/render.types.js";
export class AppError extends Error {
    statusCode;
    constructor(message, statusCode) {
        super(message);
        this.name = "AppError";
        this.statusCode = statusCode;
    }
}
const mapRenderRow = (row) => ({
    id: row.id,
    composition: row.composition,
    status: row.status,
    createdAt: row.created_at.toISOString(),
    startedAt: row.started_at ? row.started_at.toISOString() : null,
    completedAt: row.completed_at ? row.completed_at.toISOString() : null,
    outputUrl: row.output_url,
    error: row.error
});
export const createRender = async (composition) => {
    const renderId = uuidv4();
    await db.query(`
      INSERT INTO renders (id, composition, status)
      VALUES ($1, $2, $3)
    `, [renderId, composition, RENDER_STATUS.QUEUED]);
    await renderQueue.add("render-job", { renderId }, {
        attempts: 3,
        backoff: {
            type: "exponential",
            delay: 5000
        },
        removeOnComplete: true,
        removeOnFail: false
    });
    return {
        id: renderId,
        status: RENDER_STATUS.QUEUED
    };
};
export const findRenderById = async (id) => {
    const result = await db.query(`
      SELECT id, composition, status, created_at, started_at, completed_at, output_url, error
      FROM renders
      WHERE id = $1
      LIMIT 1
    `, [id]);
    if (result.rows.length === 0) {
        throw new AppError("Render not found", 404);
    }
    const render = mapRenderRow(result.rows[0]);
    return {
        id: render.id,
        status: render.status,
        createdAt: render.createdAt,
        completedAt: render.completedAt,
        outputUrl: render.outputUrl
    };
};
