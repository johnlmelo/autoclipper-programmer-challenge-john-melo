import type { RenderRequest } from "./renderPayload";

export type RenderJob = {
  id: string;
  status: "queued" | "processing" | "completed" | "failed";
  createdAt: string;
  completedAt?: string | null;
  outputUrl?: string | null;
};

function readErrorText(text: string, status: number) {
  const trimmed = text.trim();
  if (!trimmed) {
    return `Request failed with status ${status}`;
  }

  try {
    const parsed = JSON.parse(trimmed) as { message?: string };
    if (parsed.message) {
      return parsed.message;
    }
  } catch {
    // Ignore parse failures and fallback to plain text.
  }

  return trimmed;
}

export async function createRender(request: RenderRequest): Promise<{ id: string }> {
  const response = await fetch("/renders", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error(readErrorText(await response.text(), response.status));
  }

  const payload = (await response.json()) as { id?: string };
  if (!payload.id) {
    throw new Error("Invalid response from render endpoint: missing id.");
  }

  return { id: payload.id };
}

export async function getRenderById(id: string): Promise<RenderJob> {
  const response = await fetch(`/renders/${id}`, {
    method: "GET",
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(readErrorText(await response.text(), response.status));
  }

  return (await response.json()) as RenderJob;
}
