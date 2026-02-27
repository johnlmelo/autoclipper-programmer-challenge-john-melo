export const RENDER_STATUS = {
  QUEUED: "queued",
  RENDERING: "rendering",
  COMPLETED: "completed",
  FAILED: "failed"
} as const;

export type RenderStatus = (typeof RENDER_STATUS)[keyof typeof RENDER_STATUS];

export type Composition = Record<string, unknown>;

export interface RenderRecord {
  id: string;
  composition: Composition;
  status: RenderStatus;
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
  outputUrl: string | null;
  error: string | null;
}

export interface CreateRenderResult {
  id: string;
  status: RenderStatus;
}

export interface GetRenderResult {
  id: string;
  status: RenderStatus;
  createdAt: string;
  completedAt: string | null;
  outputUrl: string | null;
}
