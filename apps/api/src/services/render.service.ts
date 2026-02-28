import { v4 as uuidv4 } from "uuid";
import { db } from "../lib/db.js";
import { renderQueue } from "../lib/queue.js";
import { getSignedObjectUrl } from "../lib/s3.js";
import { RENDER_STATUS, type CreateRenderResult, type GetRenderResult, type RenderRecord } from "../types/render.types.js";

export class AppError extends Error {
  public readonly statusCode: number;

  public constructor(message: string, statusCode: number) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
  }
}

const mapRenderRow = (row: {
  id: string;
  composition: Record<string, unknown>;
  status: RenderRecord["status"];
  created_at: Date;
  started_at: Date | null;
  completed_at: Date | null;
  output_url: string | null;
  error: string | null;
}): RenderRecord => ({
  id: row.id,
  composition: row.composition,
  status: row.status,
  createdAt: row.created_at.toISOString(),
  startedAt: row.started_at ? row.started_at.toISOString() : null,
  completedAt: row.completed_at ? row.completed_at.toISOString() : null,
  outputUrl: row.output_url,
  error: row.error
});

export const createRender = async (composition: Record<string, unknown>): Promise<CreateRenderResult> => {
  const renderId = uuidv4();

  await db.query(
    `
      INSERT INTO renders (id, composition, status)
      VALUES ($1, $2, $3)
    `,
    [renderId, composition, RENDER_STATUS.QUEUED]
  );

  await renderQueue.add(
    "render-job",
    { renderId },
    {
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 5000
      },
      removeOnComplete: true,
      removeOnFail: false
    }
  );

  return {
    id: renderId,
    status: RENDER_STATUS.QUEUED
  };
};

export const findRenderById = async (id: string): Promise<GetRenderResult> => {
  const result = await db.query<{
    id: string;
    composition: Record<string, unknown>;
    status: RenderRecord["status"];
    created_at: Date;
    started_at: Date | null;
    completed_at: Date | null;
    output_url: string | null;
    error: string | null;
  }>(
    `
      SELECT id, composition, status, created_at, started_at, completed_at, output_url, error
      FROM renders
      WHERE id = $1
      LIMIT 1
    `,
    [id]
  );

  if (result.rows.length === 0) {
    throw new AppError("Render not found", 404);
  }

  const render = mapRenderRow(result.rows[0]);
  const outputUrl = render.outputUrl ? await getSignedObjectUrl(render.outputUrl) : null;

  return {
    id: render.id,
    status: render.status,
    createdAt: render.createdAt,
    completedAt: render.completedAt,
    outputUrl
  };
};
