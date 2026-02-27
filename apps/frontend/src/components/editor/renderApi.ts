import type { RenderRequest } from "./renderPayload";

export type RenderJob = {
  id: string;
  status: "queued" | "processing" | "completed" | "failed";
  createdAt: string;
  completedAt?: string | null;
  outputUrl?: string | null;
};

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000").replace(/\/+$/, "");

const apiUrl = (path: string): string => `${API_BASE_URL}${path}`;

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      const commaIndex = result.indexOf(",");

      if (commaIndex < 0) {
        reject(new Error("Invalid file content."));
        return;
      }

      resolve(result.slice(commaIndex + 1));
    };

    reader.onerror = () => reject(new Error("Failed to read file."));
    reader.readAsDataURL(blob);
  });
}

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

export async function uploadAssetFile(params: {
  fileName: string;
  contentType: string;
  blob: Blob;
}): Promise<{ key: string; sourceUrl: string }> {
  const dataBase64 = await blobToBase64(params.blob);

  const response = await fetch(apiUrl("/assets/upload"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      fileName: params.fileName,
      contentType: params.contentType,
      dataBase64,
    }),
  });

  if (!response.ok) {
    throw new Error(readErrorText(await response.text(), response.status));
  }

  const payload = (await response.json()) as { key?: string; sourceUrl?: string };

  if (!payload.key || !payload.sourceUrl) {
    throw new Error("Invalid response from asset upload endpoint.");
  }

  return { key: payload.key, sourceUrl: payload.sourceUrl };
}

export async function createRender(request: RenderRequest): Promise<{ id: string }> {
  const response = await fetch(apiUrl("/renders"), {
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
  const response = await fetch(apiUrl(`/renders/${id}`), {
    method: "GET",
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(readErrorText(await response.text(), response.status));
  }

  return (await response.json()) as RenderJob;
}
