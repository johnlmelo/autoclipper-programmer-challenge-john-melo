import type { AssetItem, TimelineTrack } from "./types";

const DB_NAME = "autoclipper-editor-db";
const DB_VERSION = 2;
const ASSETS_STORE = "assets";
const STATE_STORE = "state";
const PROJECTS_STORE = "projects";

const FALLBACK_THUMBNAIL =
  "bg-[radial-gradient(circle_at_15%_20%,#39a0ca_0%,#133554_45%,#0b1327_100%)]";

type AssetRecord = {
  id: string;
  projectId: string;
  assetId: string;
  blob: Blob;
  label: string;
  duration: string;
  durationSeconds?: number;
  thumbnailClassName?: string;
  fileSize?: number;
  mimeType?: string;
};

type ProjectStateRecord = {
  id: string;
  timelineState: TimelineTrack[];
  timelineDuration: number;
  assetOrder: string[];
};

type ProjectMetaRecord = {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  duration?: string;
  thumbnailClassName?: string;
};

export type BrowserProject = {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  duration: string;
  thumbnailClassName: string;
};

type PersistedProject = {
  assets: AssetItem[];
  timelineState: TimelineTrack[];
  timelineDuration: number;
  assetBlobs: Map<string, Blob>;
  objectUrls: string[];
  projectName?: string;
};

function stateKey(projectId: string) {
  return `project:${projectId}`;
}

function assetKey(projectId: string, assetId: string) {
  return `${projectId}:${assetId}`;
}

function toPromise<T>(request: IDBRequest<T>) {
  return new Promise<T>((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function waitForTx(tx: IDBTransaction) {
  return new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

function openEditorDb() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(ASSETS_STORE)) {
        const store = db.createObjectStore(ASSETS_STORE, { keyPath: "id" });
        store.createIndex("projectId", "projectId", { unique: false });
      }
      if (!db.objectStoreNames.contains(STATE_STORE)) {
        db.createObjectStore(STATE_STORE, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(PROJECTS_STORE)) {
        db.createObjectStore(PROJECTS_STORE, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function formatProjectDuration(seconds?: number) {
  if (!seconds || !Number.isFinite(seconds)) {
    return "00:00";
  }
  const total = Math.max(0, Math.round(seconds));
  const minutes = Math.floor(total / 60)
    .toString()
    .padStart(2, "0");
  const secs = (total % 60).toString().padStart(2, "0");
  return `${minutes}:${secs}`;
}

function formatEditedAt(updatedAt: number) {
  const diffMs = Date.now() - updatedAt;
  const minutes = Math.max(0, Math.floor(diffMs / 60000));
  if (minutes < 1) {
    return "Edited just now";
  }
  if (minutes < 60) {
    return `Edited ${minutes} minute${minutes > 1 ? "s" : ""} ago`;
  }
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `Edited ${hours} hour${hours > 1 ? "s" : ""} ago`;
  }
  const days = Math.floor(hours / 24);
  return `Edited ${days} day${days > 1 ? "s" : ""} ago`;
}

export function getEditedAtLabel(updatedAt: number) {
  return formatEditedAt(updatedAt);
}

export async function listBrowserProjects(): Promise<BrowserProject[]> {
  const db = await openEditorDb();
  try {
    const tx = db.transaction(PROJECTS_STORE, "readonly");
    const store = tx.objectStore(PROJECTS_STORE);
    const records = (await toPromise(
      store.getAll() as IDBRequest<ProjectMetaRecord[]>,
    )) as ProjectMetaRecord[];
    await waitForTx(tx);

    return records
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .map((record) => ({
        id: record.id,
        name: record.name,
        createdAt: record.createdAt,
        updatedAt: record.updatedAt,
        duration: record.duration ?? "00:00",
        thumbnailClassName: record.thumbnailClassName ?? FALLBACK_THUMBNAIL,
      }));
  } finally {
    db.close();
  }
}

export async function getBrowserProjectById(
  projectId: string,
): Promise<BrowserProject | null> {
  const db = await openEditorDb();
  try {
    const tx = db.transaction(PROJECTS_STORE, "readonly");
    const store = tx.objectStore(PROJECTS_STORE);
    const record = (await toPromise(
      store.get(projectId) as IDBRequest<ProjectMetaRecord | undefined>,
    )) as ProjectMetaRecord | undefined;
    await waitForTx(tx);

    if (!record) {
      return null;
    }

    return {
      id: record.id,
      name: record.name,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      duration: record.duration ?? "00:00",
      thumbnailClassName: record.thumbnailClassName ?? FALLBACK_THUMBNAIL,
    };
  } finally {
    db.close();
  }
}

export async function createBrowserProject(name?: string): Promise<BrowserProject> {
  const db = await openEditorDb();
  try {
    const now = Date.now();
    const id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `project-${now}`;
    const record: ProjectMetaRecord = {
      id,
      name: name ?? `Projeto ${new Date(now).toLocaleTimeString()}`,
      createdAt: now,
      updatedAt: now,
      duration: "00:00",
      thumbnailClassName: FALLBACK_THUMBNAIL,
    };

    const tx = db.transaction(PROJECTS_STORE, "readwrite");
    tx.objectStore(PROJECTS_STORE).put(record);
    await waitForTx(tx);

    return {
      id: record.id,
      name: record.name,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      duration: record.duration ?? "00:00",
      thumbnailClassName: record.thumbnailClassName ?? FALLBACK_THUMBNAIL,
    };
  } finally {
    db.close();
  }
}

async function upsertProjectMeta(
  db: IDBDatabase,
  projectId: string,
  updates?: Partial<ProjectMetaRecord>,
) {
  const tx = db.transaction(PROJECTS_STORE, "readwrite");
  const store = tx.objectStore(PROJECTS_STORE);
  const existing = (await toPromise(
    store.get(projectId) as IDBRequest<ProjectMetaRecord | undefined>,
  )) as ProjectMetaRecord | undefined;
  const now = Date.now();
  const record: ProjectMetaRecord = {
    id: projectId,
    name: existing?.name ?? updates?.name ?? "Projeto sem nome",
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    duration: updates?.duration ?? existing?.duration ?? "00:00",
    thumbnailClassName:
      updates?.thumbnailClassName ?? existing?.thumbnailClassName ?? FALLBACK_THUMBNAIL,
  };
  store.put(record);
  await waitForTx(tx);
}

export async function loadPersistedProject(projectId: string): Promise<PersistedProject | null> {
  const db = await openEditorDb();
  try {
    const tx = db.transaction([ASSETS_STORE, STATE_STORE, PROJECTS_STORE], "readonly");
    const assetsStore = tx.objectStore(ASSETS_STORE);
    const stateStore = tx.objectStore(STATE_STORE);
    const projectsStore = tx.objectStore(PROJECTS_STORE);

    const [state, allAssets, projectMeta] = await Promise.all([
      toPromise(
        stateStore.get(stateKey(projectId)) as IDBRequest<ProjectStateRecord | undefined>,
      ),
      toPromise(assetsStore.getAll() as IDBRequest<AssetRecord[]>),
      toPromise(
        projectsStore.get(projectId) as IDBRequest<ProjectMetaRecord | undefined>,
      ),
    ]);

    await waitForTx(tx);

    if (!state) {
      return null;
    }

    const projectAssets = allAssets.filter((asset) => asset.projectId === projectId);
    const byId = new Map(projectAssets.map((asset) => [asset.assetId, asset]));
    const orderedRecords = state.assetOrder
      .map((id) => byId.get(id))
      .filter((record): record is AssetRecord => Boolean(record));

    const objectUrls: string[] = [];
    const assetBlobs = new Map<string, Blob>();
    const assets: AssetItem[] = orderedRecords.map((record) => {
      assetBlobs.set(record.assetId, record.blob);
      const objectUrl = URL.createObjectURL(record.blob);
      objectUrls.push(objectUrl);

      return {
        id: record.assetId,
        label: record.label,
        duration: record.duration,
        durationSeconds: record.durationSeconds,
        sourceUrl: objectUrl,
        thumbnailUrl: record.mimeType?.startsWith("image/") ? objectUrl : undefined,
        thumbnailClassName: record.thumbnailClassName,
        fileSize: record.fileSize,
        mimeType: record.mimeType,
      };
    });

    return {
      assets,
      timelineState: state.timelineState,
      timelineDuration: state.timelineDuration,
      assetBlobs,
      objectUrls,
      projectName: projectMeta?.name,
    };
  } finally {
    db.close();
  }
}

export async function savePersistedProject({
  projectId,
  assets,
  assetBlobs,
  timelineState,
  timelineDuration,
  projectName,
}: {
  projectId: string;
  assets: AssetItem[];
  assetBlobs: Map<string, Blob>;
  timelineState: TimelineTrack[];
  timelineDuration: number;
  projectName?: string;
}) {
  const db = await openEditorDb();
  try {
    const tx = db.transaction([ASSETS_STORE, STATE_STORE], "readwrite");
    const assetsStore = tx.objectStore(ASSETS_STORE);
    const stateStore = tx.objectStore(STATE_STORE);

    const existingAssets = (await toPromise(
      assetsStore.getAll() as IDBRequest<AssetRecord[]>,
    )) as AssetRecord[];
    const currentIds = new Set(assets.map((asset) => asset.id));

    for (const record of existingAssets) {
      if (record.projectId === projectId && !currentIds.has(record.assetId)) {
        assetsStore.delete(record.id);
      }
    }

    for (const asset of assets) {
      const blob = assetBlobs.get(asset.id);
      if (!blob) {
        continue;
      }
      const record: AssetRecord = {
        id: assetKey(projectId, asset.id),
        projectId,
        assetId: asset.id,
        blob,
        label: asset.label,
        duration: asset.duration,
        durationSeconds: asset.durationSeconds,
        thumbnailClassName: asset.thumbnailClassName,
        fileSize: asset.fileSize,
        mimeType: asset.mimeType,
      };
      assetsStore.put(record);
    }

    const stateRecord: ProjectStateRecord = {
      id: stateKey(projectId),
      timelineState,
      timelineDuration,
      assetOrder: assets.map((asset) => asset.id),
    };
    stateStore.put(stateRecord);
    await waitForTx(tx);

    const imageClip = timelineState
      .find((track) => track.id === "track-image")
      ?.clips.at(-1);
    const imageAsset = assets.find((asset) => asset.id === imageClip?.sourceAssetId);

    await upsertProjectMeta(db, projectId, {
      name: projectName,
      duration: formatProjectDuration(timelineDuration),
      thumbnailClassName: imageAsset?.thumbnailClassName ?? FALLBACK_THUMBNAIL,
    });
  } finally {
    db.close();
  }
}
