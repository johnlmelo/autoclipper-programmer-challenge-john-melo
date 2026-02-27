"use client";

import { useEffect, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { useRouter } from "next/navigation";
import { AssetsSidebar } from "./AssetsSidebar";
import { EditorPreview } from "./EditorPreview";
import { PropertiesPanel } from "./PropertiesPanel";
import { TimelinePanel } from "./TimelinePanel";
import { EditorTopBar } from "./EditorTopBar";
import { RenderModal } from "./RenderModal";
import {
  getBrowserProjectById,
  loadPersistedProject,
  savePersistedProject,
} from "./persistence";
import { createRender, uploadAssetFile } from "./renderApi";
import { buildRenderRequest, type RenderProfile } from "./renderPayload";
import type {
  AudioAdjustments,
  AssetDropPayload,
  AssetItem,
  CaptionAdjustments,
  ImageAdjustments,
  PropertiesTargetType,
  TimelineClip,
  TimelineClipMovePayload,
  TimelineClipResizePayload,
  TimelineClipSelection,
  TimelineTrack,
} from "./types";

const RESIZER_SIZE = 8;
const MIN_LEFT = 180;
const MIN_CENTER = 360;
const MIN_RIGHT = 200;
const MIN_TOP = 260;
const MIN_TIMELINE = 160;
const DEFAULT_TIMELINE_DURATION = 50;
const DEFAULT_TIMELINE_TRACKS: TimelineTrack[] = [
  { id: "track-image", name: "IMAGEM", clips: [] },
  { id: "track-audio", name: "AUDIO", clips: [] },
  { id: "track-caption", name: "LEGENDA", clips: [] },
];

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function parseDurationMarkers(markers: string[]) {
  const last = markers[markers.length - 1];
  if (!last) {
    return 60;
  }

  const numeric = Number.parseFloat(last.replace(/[^\d.]/g, ""));
  if (!Number.isFinite(numeric) || numeric <= 0) {
    return 60;
  }
  return numeric;
}

function formatDurationLabel(seconds?: number) {
  if (!seconds || !Number.isFinite(seconds)) {
    return "--:--";
  }
  const total = Math.max(0, Math.round(seconds));
  const minutes = Math.floor(total / 60)
    .toString()
    .padStart(2, "0");
  const secs = (total % 60).toString().padStart(2, "0");
  return `${minutes}:${secs}`;
}

function buildTimelineMarkers(duration: number) {
  const step = 5;
  const max = Math.max(step, Math.ceil(duration / step) * step);
  const markers: string[] = [];
  for (let second = 0; second <= max; second += step) {
    markers.push(`${second}s`);
  }
  return markers;
}

function isRemoteHttpUrl(value?: string): boolean {
  if (!value) {
    return false;
  }

  return value.startsWith("http://") || value.startsWith("https://");
}

function scaleTracks(tracks: TimelineTrack[], factor: number) {
  return tracks.map((track) => ({
    ...track,
    clips: track.clips.map((clip) => ({
      ...clip,
      start: clip.start * factor,
      width: clip.width * factor,
    })),
  }));
}

function getMediaDurationInSeconds(file: File, objectUrl: string): Promise<number | undefined> {
  if (!file.type.startsWith("audio/") && !file.type.startsWith("video/")) {
    return Promise.resolve(undefined);
  }

  return new Promise((resolve) => {
    const element = file.type.startsWith("audio/")
      ? document.createElement("audio")
      : document.createElement("video");

    const cleanup = () => {
      element.removeAttribute("src");
      element.load();
    };

    element.preload = "metadata";
    element.onloadedmetadata = () => {
      const seconds = Number.isFinite(element.duration) ? element.duration : undefined;
      cleanup();
      resolve(seconds);
    };
    element.onerror = () => {
      cleanup();
      resolve(undefined);
    };
    element.src = objectUrl;
  });
}

function ensureCoreTracks(tracks: TimelineTrack[]) {
  const imageClips = tracks
    .filter((track) => track.id === "track-image" || track.id === "track-video")
    .flatMap((track) => track.clips);
  const audioClips = tracks
    .filter((track) => track.id === "track-audio")
    .flatMap((track) => track.clips);
  const captionClips = tracks
    .filter((track) => track.id === "track-caption")
    .flatMap((track) => track.clips);

  const extraTracks = tracks.filter(
    (track) =>
      track.id !== "track-image" &&
      track.id !== "track-video" &&
      track.id !== "track-audio" &&
      track.id !== "track-caption",
  );

  return [
    { id: "track-image", name: "IMAGEM", clips: imageClips },
    { id: "track-audio", name: "AUDIO", clips: audioClips },
    { id: "track-caption", name: "LEGENDA", clips: captionClips },
    ...extraTracks,
  ];
}

function getDefaultImageAdjustments(): ImageAdjustments {
  return {
    opacity: 100,
    brightness: 100,
    contrast: 100,
    saturation: 100,
    positionX: 0,
    positionY: 0,
    scale: 100,
  };
}

function getDefaultAudioAdjustments(): AudioAdjustments {
  return {
    volume: 100,
    normalizationEnabled: false,
    normalizationTargetDb: -3,
    fadeInSeconds: 0,
    fadeOutSeconds: 0,
  };
}

function getDefaultCaptionAdjustments(): CaptionAdjustments {
  return {
    fontSize: 20,
    positionX: 0,
    positionY: 0,
    textColor: "#ffffff",
    backgroundColor: "#000000B3",
  };
}

type DragType = "left" | "right" | "timeline" | null;

type DragState = {
  type: DragType;
  startX: number;
  startY: number;
  startLeft: number;
  startRight: number;
  startPreview: number;
  containerWidth: number;
  containerHeight: number;
} | null;

function Divider({
  direction,
  onPointerDown,
  label,
}: {
  direction: "vertical" | "horizontal";
  onPointerDown: (event: ReactPointerEvent<HTMLButtonElement>) => void;
  label: string;
}) {
  const isVertical = direction === "vertical";

  return (
    <button
      type="button"
      onPointerDown={onPointerDown}
      aria-label={label}
      className={`group relative bg-[#14233d] transition hover:bg-blue-500/60 ${
        isVertical ? "w-2 cursor-col-resize" : "h-2 cursor-row-resize"
      }`}
    >
      <span
        className={`pointer-events-none absolute bg-slate-300/60 transition group-hover:bg-white ${
          isVertical
            ? "left-1/2 top-1/2 h-8 w-px -translate-x-1/2 -translate-y-1/2"
            : "left-1/2 top-1/2 h-px w-8 -translate-x-1/2 -translate-y-1/2"
        }`}
      />
    </button>
  );
}

type EditorWorkspaceProps = {
  projectId: string;
  assets?: AssetItem[];
  timelineMarkers?: string[];
  timelineTracks?: TimelineTrack[];
};

export function EditorWorkspace({
  projectId,
  assets = [],
  timelineMarkers = [],
  timelineTracks = [],
}: EditorWorkspaceProps) {
  const router = useRouter();
  const workspaceRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<DragState>(null);
  const [leftWidth, setLeftWidth] = useState(230);
  const [rightWidth, setRightWidth] = useState(230);
  const [previewHeight, setPreviewHeight] = useState(420);
  const [activeDrag, setActiveDrag] = useState<DragType>(null);
  const [uploadedAssets, setUploadedAssets] = useState<AssetItem[]>(assets);
  const [timelineState, setTimelineState] = useState<TimelineTrack[]>(
    timelineTracks.length > 0
      ? ensureCoreTracks(timelineTracks)
      : DEFAULT_TIMELINE_TRACKS,
  );
  const [selectedClip, setSelectedClip] = useState<TimelineClipSelection | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [projectName, setProjectName] = useState("Projeto sem nome");
  const [timelineDuration, setTimelineDuration] = useState(
    timelineMarkers.length > 0
      ? parseDurationMarkers(timelineMarkers)
      : DEFAULT_TIMELINE_DURATION,
  );
  const [renderModalOpen, setRenderModalOpen] = useState(false);
  const [isSubmittingRender, setIsSubmittingRender] = useState(false);
  const [renderError, setRenderError] = useState<string | null>(null);
  const objectUrlsRef = useRef<string[]>([]);
  const audioRef = useRef<HTMLAudioElement>(null);
  const activeAudioSrcRef = useRef<string | null>(null);
  const assetBlobsRef = useRef<Map<string, Blob>>(new Map());
  const uploadedAssetUrlsRef = useRef<Map<string, string>>(new Map());
  const [persistenceReady, setPersistenceReady] = useState(false);
  const objectUrlsFromPersistenceRef = useRef<string[]>([]);
  const totalDuration = timelineDuration;
  const markers = buildTimelineMarkers(totalDuration);

  const handleUploadFiles = async (files: FileList) => {
    const nextAssets = await Promise.all(Array.from(files).map(async (file, index) => {
      const objectUrl = URL.createObjectURL(file);
      objectUrlsRef.current.push(objectUrl);
      const durationSeconds = await getMediaDurationInSeconds(file, objectUrl);

      const id = `${file.name}-${file.lastModified}-${index}`;
      assetBlobsRef.current.set(id, file);

      return {
        id,
        label: file.name,
        duration: formatDurationLabel(durationSeconds),
        durationSeconds,
        sourceUrl: objectUrl,
        thumbnailUrl: file.type.startsWith("image/") ? objectUrl : undefined,
        thumbnailClassName: file.type.startsWith("video/")
          ? "bg-[linear-gradient(120deg,#6ac4ff_0%,#4b80cb_45%,#1d3159_100%)]"
          : file.type.startsWith("audio/")
            ? "bg-[linear-gradient(120deg,#3f9b8a_0%,#1d6f66_45%,#0f3440_100%)]"
            : "bg-[linear-gradient(120deg,#244067_0%,#172845_50%,#0f1d34_100%)]",
        fileSize: file.size,
        mimeType: file.type,
      } satisfies AssetItem;
    }));

    setUploadedAssets((prev) => [...nextAssets, ...prev]);
  };

  const handleAssetDrop = ({ asset, trackId, start }: AssetDropPayload) => {
    const isAudio = asset.mimeType?.startsWith("audio/");
    const isImage = asset.mimeType?.startsWith("image/");
    if (!isAudio && !isImage) {
      return;
    }

    const preferredTrackId = isAudio ? "track-audio" : "track-image";
    const audioDurationSeconds = isAudio ? asset.durationSeconds ?? 5 : 0;
    const startSeconds = (start / 100) * totalDuration;
    const requiredEndSeconds = startSeconds + audioDurationSeconds;
    const nextDuration = Math.max(totalDuration, requiredEndSeconds);
    const hasDurationExpansion = nextDuration > totalDuration;
    const durationScale = hasDurationExpansion ? totalDuration / nextDuration : 1;

    if (hasDurationExpansion) {
      setTimelineDuration(nextDuration);
    }

    setTimelineState((previous) => {
      const baseTracks = hasDurationExpansion
        ? scaleTracks(previous, durationScale)
        : previous;
      const hasPreferredTrack = baseTracks.some((track) => track.id === preferredTrackId);
      const targetTrackId = hasPreferredTrack ? preferredTrackId : trackId;
      const normalizedStart = hasDurationExpansion
        ? (startSeconds / nextDuration) * 100
        : start;
      const clip: TimelineClip = {
        id: `${asset.id}-${Date.now()}`,
        sourceAssetId: asset.id,
        label: asset.label,
        start: normalizedStart,
        width: isAudio
          ? (audioDurationSeconds / nextDuration) * 100
          : 22 * durationScale,
        colorClassName: isAudio
          ? "bg-emerald-700/35 border-emerald-300/40"
          : "bg-slate-400/30 border-slate-200/40",
        imageAdjustments: isImage ? getDefaultImageAdjustments() : undefined,
        audioAdjustments: isAudio ? getDefaultAudioAdjustments() : undefined,
      };

      return baseTracks.map((track) =>
        track.id === targetTrackId
          ? { ...track, clips: [...track.clips, clip] }
          : track,
      );
    });
  };

  const handleClipMove = ({
    clipId,
    fromTrackId,
    toTrackId,
    start,
  }: TimelineClipMovePayload) => {
    setTimelineState((previous) => {
      const sourceTrack = previous.find((track) => track.id === fromTrackId);
      if (!sourceTrack) {
        return previous;
      }

      const movingClip = sourceTrack.clips.find((clip) => clip.id === clipId);

      if (!movingClip) {
        return previous;
      }

      const removed = previous.map((track) =>
        track.id === fromTrackId
          ? { ...track, clips: track.clips.filter((clip) => clip.id !== clipId) }
          : track,
      );

      const sourceAsset = uploadedAssets.find(
        (asset) => asset.id === movingClip?.sourceAssetId,
      );
      const isImageAsset = sourceAsset?.mimeType?.startsWith("image/");
      const isAudioAsset = sourceAsset?.mimeType?.startsWith("audio/");
      const targetIsImageTrack = toTrackId === "track-image";
      const targetIsAudioTrack = toTrackId === "track-audio";
      const targetIsCaptionTrack = toTrackId === "track-caption";

      if (targetIsImageTrack && !isImageAsset) {
        return previous;
      }

      if (targetIsAudioTrack && !isAudioAsset) {
        return previous;
      }

      if (targetIsCaptionTrack && movingClip.sourceAssetId) {
        return previous;
      }

      const updatedClip: TimelineClip = { ...movingClip, start };
      return removed.map((track) =>
        track.id === toTrackId
          ? { ...track, clips: [...track.clips, updatedClip] }
          : track,
      );
    });
  };

  const handleClipResize = ({
    clipId,
    trackId,
    start,
    width,
  }: TimelineClipResizePayload) => {
    setTimelineState((previous) =>
      previous.map((track) =>
        track.id === trackId
          ? {
              ...track,
              clips: track.clips.map((clip) =>
                clip.id === clipId ? { ...clip, start, width } : clip,
              ),
            }
          : track,
      ),
    );
  };

  const handleClipSelect = (selection: TimelineClipSelection | null) => {
    setSelectedClip(selection);
  };

  const handleImageAdjustmentsChange = (patch: Partial<ImageAdjustments>) => {
    if (!selectedClip || selectedClip.trackId !== "track-image") {
      return;
    }

    setTimelineState((previous) =>
      previous.map((track) =>
        track.id === selectedClip.trackId
          ? {
              ...track,
              clips: track.clips.map((clip) =>
                clip.id === selectedClip.clipId
                  ? {
                      ...clip,
                      imageAdjustments: {
                        ...getDefaultImageAdjustments(),
                        ...clip.imageAdjustments,
                        ...patch,
                      },
                    }
                  : clip,
              ),
            }
          : track,
      ),
    );
  };

  const handleAudioAdjustmentsChange = (patch: Partial<AudioAdjustments>) => {
    if (!selectedClip || selectedClip.trackId !== "track-audio") {
      return;
    }

    setTimelineState((previous) =>
      previous.map((track) =>
        track.id === selectedClip.trackId
          ? {
              ...track,
              clips: track.clips.map((clip) =>
                clip.id === selectedClip.clipId
                  ? {
                      ...clip,
                      audioAdjustments: {
                        ...getDefaultAudioAdjustments(),
                        ...clip.audioAdjustments,
                        ...patch,
                      },
                    }
                  : clip,
              ),
            }
          : track,
      ),
    );
  };

  const handleCaptionAdjustmentsChange = (patch: Partial<CaptionAdjustments>) => {
    if (!selectedClip || selectedClip.trackId !== "track-caption") {
      return;
    }

    setTimelineState((previous) =>
      previous.map((track) =>
        track.id === selectedClip.trackId
          ? {
              ...track,
              clips: track.clips.map((clip) =>
                clip.id === selectedClip.clipId
                  ? {
                      ...clip,
                      captionAdjustments: {
                        ...getDefaultCaptionAdjustments(),
                        ...clip.captionAdjustments,
                        ...patch,
                      },
                    }
                  : clip,
              ),
            }
          : track,
      ),
    );
  };

  const handleCaptionTextChange = (value: string) => {
    if (!selectedClip || selectedClip.trackId !== "track-caption") {
      return;
    }

    setTimelineState((previous) =>
      previous.map((track) =>
        track.id === selectedClip.trackId
          ? {
              ...track,
              clips: track.clips.map((clip) =>
                clip.id === selectedClip.clipId ? { ...clip, label: value } : clip,
              ),
            }
          : track,
      ),
    );
  };

  const handleSeek = (seconds: number) => {
    setCurrentTime(clamp(seconds, 0, totalDuration));
  };

  const handleStep = (delta: number) => {
    setCurrentTime((previous) => clamp(previous + delta, 0, totalDuration));
  };

  const handleTogglePlay = () => {
    if (currentTime >= totalDuration) {
      setCurrentTime(0);
      setIsPlaying(true);
      return;
    }
    setIsPlaying((previous) => !previous);
  };

  const handleAddCaptionClip = () => {
    const captionTrackState = timelineState.find((track) => track.id === "track-caption");
    const lastCaptionEnd = Math.max(
      0,
      ...(captionTrackState?.clips.map((clip) => clip.start + clip.width) ?? [0]),
    );
    const captionWidth = 18;
    const startPercent = clamp(lastCaptionEnd, 0, Math.max(0, 100 - captionWidth));
    const clip: TimelineClip = {
      id: `caption-${Date.now()}`,
      label: "Nova legenda",
      start: startPercent,
      width: captionWidth,
      colorClassName: "bg-blue-700/45 border-blue-300/60",
      captionAdjustments: getDefaultCaptionAdjustments(),
    };

    setTimelineState((previous) =>
      previous.map((track) =>
        track.id === "track-caption"
          ? { ...track, clips: [...track.clips, clip] }
          : track,
      ),
    );
    setSelectedClip({ clipId: clip.id, trackId: "track-caption" });
  };

  const handleEditCaptionClip = (clipId: string) => {
    const track = timelineState.find((item) => item.id === "track-caption");
    const clip = track?.clips.find((item) => item.id === clipId);
    if (!clip) {
      return;
    }

    const nextLabel = window.prompt("Editar legenda:", clip.label);
    if (nextLabel === null) {
      return;
    }

    const trimmed = nextLabel.trim();
    if (!trimmed) {
      return;
    }

    setTimelineState((previous) =>
      previous.map((item) =>
        item.id === "track-caption"
          ? {
              ...item,
              clips: item.clips.map((caption) =>
                caption.id === clipId ? { ...caption, label: trimmed } : caption,
              ),
            }
          : item,
      ),
    );
  };

  const handleOpenRenderModal = () => {
    setRenderError(null);
    setRenderModalOpen(true);
  };

  const handleCloseRenderModal = () => {
    if (isSubmittingRender) {
      return;
    }
    setRenderModalOpen(false);
    setRenderError(null);
  };

  const handleRenderSubmit = async (profile: RenderProfile) => {
    try {
      setIsSubmittingRender(true);
      setRenderError(null);

      const usedAssetIds = new Set<string>();
      for (const track of timelineState) {
        if (track.id !== "track-image" && track.id !== "track-audio") {
          continue;
        }

        for (const clip of track.clips) {
          if (clip.sourceAssetId) {
            usedAssetIds.add(clip.sourceAssetId);
          }
        }
      }

      const remoteSourceUrlByAssetId = new Map<string, string>();
      for (const asset of uploadedAssets) {
        if (!usedAssetIds.has(asset.id)) {
          continue;
        }

        const cachedSourceUrl = uploadedAssetUrlsRef.current.get(asset.id);
        if (cachedSourceUrl) {
          remoteSourceUrlByAssetId.set(asset.id, cachedSourceUrl);
          continue;
        }

        if (isRemoteHttpUrl(asset.sourceUrl)) {
          remoteSourceUrlByAssetId.set(asset.id, asset.sourceUrl!);
          uploadedAssetUrlsRef.current.set(asset.id, asset.sourceUrl!);
          continue;
        }

        const blob = assetBlobsRef.current.get(asset.id);
        if (!blob) {
          throw new Error(`Arquivo do asset "${asset.label}" nao encontrado para upload.`);
        }

        const uploaded = await uploadAssetFile({
          fileName: asset.label,
          contentType: asset.mimeType || blob.type || "application/octet-stream",
          blob,
        });
        remoteSourceUrlByAssetId.set(asset.id, uploaded.sourceUrl);
        uploadedAssetUrlsRef.current.set(asset.id, uploaded.sourceUrl);
      }

      const assetsForRender = uploadedAssets.map((asset) => {
        const remoteSourceUrl = remoteSourceUrlByAssetId.get(asset.id);
        if (!remoteSourceUrl) {
          return asset;
        }

        return {
          ...asset,
          sourceUrl: remoteSourceUrl,
        };
      });

      const payload = buildRenderRequest({
        projectId,
        projectName,
        profile,
        timelineDuration,
        timelineState,
        assets: assetsForRender,
      });
      const result = await createRender(payload);
      setRenderModalOpen(false);
      router.push(`/espera/${result.id}`);
    } catch (error) {
      setRenderError(
        error instanceof Error ? error.message : "Nao foi possivel iniciar a renderizacao.",
      );
    } finally {
      setIsSubmittingRender(false);
    }
  };

  useEffect(() => {
    if (!isPlaying) {
      return;
    }

    const interval = window.setInterval(() => {
      setCurrentTime((previous) => {
        const next = previous + 0.05;
        if (next >= totalDuration) {
          window.clearInterval(interval);
          setIsPlaying(false);
          return totalDuration;
        }
        return next;
      });
    }, 50);

    return () => window.clearInterval(interval);
  }, [isPlaying, totalDuration]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!selectedClip) {
        return;
      }

      const target = event.target as HTMLElement | null;
      const isTypingTarget =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.isContentEditable;

      if (isTypingTarget) {
        return;
      }

      if (event.key !== "Delete" && event.key !== "Backspace") {
        return;
      }

      event.preventDefault();
      setTimelineState((previous) =>
        previous.map((track) =>
          track.id === selectedClip.trackId
            ? {
                ...track,
                clips: track.clips.filter((clip) => clip.id !== selectedClip.clipId),
              }
            : track,
        ),
      );
      setSelectedClip(null);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selectedClip]);

  const imageTrack = timelineState.find((track) => track.id === "track-image");
  const audioTrack = timelineState.find((track) => track.id === "track-audio");
  const captionTrack = timelineState.find((track) => track.id === "track-caption");
  const timeToPercent = (currentTime / totalDuration) * 100;
  const activeVideoClip = [...(imageTrack?.clips ?? [])]
    .reverse()
    .find(
      (clip) =>
        timeToPercent >= clip.start &&
        timeToPercent <= clip.start + clip.width,
    );
  const activeAudioClip = [...(audioTrack?.clips ?? [])]
    .reverse()
    .find(
      (clip) =>
        timeToPercent >= clip.start &&
        timeToPercent <= clip.start + clip.width,
    );
  const activeCaptionClip = [...(captionTrack?.clips ?? [])]
    .reverse()
    .find(
      (clip) =>
        timeToPercent >= clip.start &&
        timeToPercent <= clip.start + clip.width,
    );
  const activeVideoAsset = uploadedAssets.find(
    (asset) => asset.id === activeVideoClip?.sourceAssetId,
  );
  const activeAudioAsset = uploadedAssets.find(
    (asset) => asset.id === activeAudioClip?.sourceAssetId,
  );
  const selectedTrack = selectedClip
    ? timelineState.find((track) => track.id === selectedClip.trackId)
    : null;
  const selectedTimelineClip = selectedTrack?.clips.find(
    (clip) => clip.id === selectedClip?.clipId,
  );
  const selectedAsset = uploadedAssets.find(
    (asset) => asset.id === selectedTimelineClip?.sourceAssetId,
  );
  let selectedPropertiesType: PropertiesTargetType = null;
  if (selectedClip?.trackId === "track-caption") {
    selectedPropertiesType = "caption";
  } else if (selectedAsset?.mimeType?.startsWith("audio/")) {
    selectedPropertiesType = "audio";
  } else if (selectedAsset?.mimeType?.startsWith("image/")) {
    selectedPropertiesType = "image";
  }
  const selectedPropertiesLabel = selectedTimelineClip?.label ?? null;
  const selectedImageAdjustments =
    selectedPropertiesType === "image"
      ? {
          ...getDefaultImageAdjustments(),
          ...selectedTimelineClip?.imageAdjustments,
        }
      : null;
  const selectedAudioAdjustments =
    selectedPropertiesType === "audio"
      ? {
          ...getDefaultAudioAdjustments(),
          ...selectedTimelineClip?.audioAdjustments,
        }
      : null;
  const selectedCaptionAdjustments =
    selectedPropertiesType === "caption"
      ? {
          ...getDefaultCaptionAdjustments(),
          ...selectedTimelineClip?.captionAdjustments,
        }
      : null;

  useEffect(() => {
    const audioElement = audioRef.current;
    if (!audioElement) {
      return;
    }

    const sourceUrl = activeAudioAsset?.sourceUrl;
    const isAudioAsset = activeAudioAsset?.mimeType?.startsWith("audio/");

    if (!activeAudioClip || !sourceUrl || !isAudioAsset) {
      audioElement.pause();
      audioElement.removeAttribute("src");
      activeAudioSrcRef.current = null;
      return;
    }

    if (activeAudioSrcRef.current !== sourceUrl) {
      audioElement.src = sourceUrl;
      activeAudioSrcRef.current = sourceUrl;
    }

    const clipStartSeconds = (activeAudioClip.start / 100) * totalDuration;
    const clipDurationSeconds = (activeAudioClip.width / 100) * totalDuration;
    const offsetInClip = clamp(currentTime - clipStartSeconds, 0, clipDurationSeconds);
    const adjustments = {
      ...getDefaultAudioAdjustments(),
      ...activeAudioClip.audioAdjustments,
    };

    const safeClipDuration = Math.max(0.001, clipDurationSeconds);
    const safeFadeIn = Math.min(Math.max(0, adjustments.fadeInSeconds), safeClipDuration);
    const safeFadeOut = Math.min(Math.max(0, adjustments.fadeOutSeconds), safeClipDuration);
    let fadeGain = 1;
    if (safeFadeIn > 0) {
      fadeGain = Math.min(fadeGain, clamp(offsetInClip / safeFadeIn, 0, 1));
    }
    if (safeFadeOut > 0) {
      const remaining = safeClipDuration - offsetInClip;
      fadeGain = Math.min(fadeGain, clamp(remaining / safeFadeOut, 0, 1));
    }

    const baseGain = clamp(adjustments.volume / 100, 0, 1);
    const normalizationGain = adjustments.normalizationEnabled
      ? Math.pow(10, adjustments.normalizationTargetDb / 20)
      : 1;
    audioElement.volume = clamp(baseGain * normalizationGain * fadeGain, 0, 1);

    if (Math.abs(audioElement.currentTime - offsetInClip) > 0.15) {
      try {
        audioElement.currentTime = offsetInClip;
      } catch {
        // Ignore transient seeks before metadata is available.
      }
    }

    if (isPlaying) {
      void audioElement.play().catch(() => undefined);
    } else {
      audioElement.pause();
    }
  }, [activeAudioAsset, activeAudioClip, currentTime, isPlaying, totalDuration]);

  useEffect(() => {
    let cancelled = false;

    const loadSnapshot = async () => {
      try {
        const snapshot = await loadPersistedProject(projectId);
        if (cancelled || !snapshot) {
          const meta = await getBrowserProjectById(projectId);
          if (!cancelled && meta?.name) {
            setProjectName(meta.name);
          }
          setPersistenceReady(true);
          return;
        }

        objectUrlsFromPersistenceRef.current = snapshot.objectUrls;
        assetBlobsRef.current = snapshot.assetBlobs;
        setProjectName(snapshot.projectName ?? "Projeto sem nome");
        setUploadedAssets(snapshot.assets);
        setTimelineState(ensureCoreTracks(snapshot.timelineState));
        setTimelineDuration(snapshot.timelineDuration);
      } catch {
        // Silent fallback to in-memory state if persistence fails.
      } finally {
        if (!cancelled) {
          setPersistenceReady(true);
        }
      }
    };

    void loadSnapshot();

    return () => {
      cancelled = true;
    };
  }, [projectId]);

  useEffect(() => {
    if (!persistenceReady) {
      return;
    }

    const timeout = window.setTimeout(() => {
      void savePersistedProject({
        projectId,
        assets: uploadedAssets,
        assetBlobs: assetBlobsRef.current,
        timelineState,
        timelineDuration,
        projectName,
      });
    }, 350);

    return () => window.clearTimeout(timeout);
  }, [
    projectId,
    projectName,
    uploadedAssets,
    timelineState,
    timelineDuration,
    persistenceReady,
  ]);

  useEffect(() => {
    const audioElement = audioRef.current;
    return () => {
      if (audioElement) {
        audioElement.pause();
        audioElement.removeAttribute("src");
      }
      for (const persistedObjectUrl of objectUrlsFromPersistenceRef.current) {
        URL.revokeObjectURL(persistedObjectUrl);
      }
      objectUrlsFromPersistenceRef.current = [];
      for (const objectUrl of objectUrlsRef.current) {
        URL.revokeObjectURL(objectUrl);
      }
      objectUrlsRef.current = [];
    };
  }, []);

  useEffect(() => {
    const onPointerMove = (event: PointerEvent) => {
      const drag = dragRef.current;
      if (!drag) {
        return;
      }

      if (drag.type === "left") {
        const maxLeft =
          drag.containerWidth - drag.startRight - MIN_CENTER - RESIZER_SIZE * 2;
        const nextWidth = Math.max(
          MIN_LEFT,
          Math.min(maxLeft, drag.startLeft + (event.clientX - drag.startX)),
        );
        setLeftWidth(nextWidth);
      }

      if (drag.type === "right") {
        const maxRight =
          drag.containerWidth - drag.startLeft - MIN_CENTER - RESIZER_SIZE * 2;
        const nextWidth = Math.max(
          MIN_RIGHT,
          Math.min(maxRight, drag.startRight - (event.clientX - drag.startX)),
        );
        setRightWidth(nextWidth);
      }

      if (drag.type === "timeline") {
        const maxPreview = Math.max(
          MIN_TOP,
          drag.containerHeight - MIN_TIMELINE - RESIZER_SIZE,
        );
        const nextHeight = Math.max(
          MIN_TOP,
          Math.min(maxPreview, drag.startPreview + (event.clientY - drag.startY)),
        );
        setPreviewHeight(nextHeight);
      }
    };

    const onPointerUp = () => {
      if (!dragRef.current) {
        return;
      }

      dragRef.current = null;
      setActiveDrag(null);
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);

    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };
  }, []);

  const startDrag = (
    type: Exclude<DragType, null>,
    event: ReactPointerEvent<HTMLButtonElement>,
  ) => {
    const container = workspaceRef.current;
    if (!container) {
      return;
    }

    event.preventDefault();
    const rect = container.getBoundingClientRect();

    dragRef.current = {
      type,
      startX: event.clientX,
      startY: event.clientY,
      startLeft: leftWidth,
      startRight: rightWidth,
      startPreview: previewHeight,
      containerWidth: rect.width,
      containerHeight: rect.height,
    };

    setActiveDrag(type);
    document.body.style.userSelect = "none";
    document.body.style.cursor =
      type === "timeline" ? "row-resize" : "col-resize";
  };

  return (
    <main className="flex min-h-screen flex-col bg-[#050f22] text-slate-100">
      <EditorTopBar
        projectName={projectName}
        onProjectNameChange={setProjectName}
        onRenderClick={handleOpenRenderModal}
      />

      <div ref={workspaceRef} className="flex-1 min-h-0">
        <div className="flex h-full min-h-0 flex-col lg:hidden">
          <AssetsSidebar assets={uploadedAssets} onUploadFiles={handleUploadFiles} />
          <EditorPreview
            currentTime={currentTime}
            totalDuration={totalDuration}
            isPlaying={isPlaying}
            onTogglePlay={handleTogglePlay}
            onSeek={handleSeek}
            onStep={handleStep}
            activeVideoLabel={activeVideoClip?.label ?? null}
            activeVideoSourceUrl={activeVideoAsset?.sourceUrl}
            activeVideoIsImage={activeVideoAsset?.mimeType?.startsWith("image/")}
            activeImageAdjustments={{
              ...getDefaultImageAdjustments(),
              ...activeVideoClip?.imageAdjustments,
            }}
            activeAudioLabel={activeAudioClip?.label ?? null}
            activeCaptionLabel={activeCaptionClip?.label ?? null}
            activeCaptionAdjustments={{
              ...getDefaultCaptionAdjustments(),
              ...activeCaptionClip?.captionAdjustments,
            }}
          />
          <PropertiesPanel
            selectedType={selectedPropertiesType}
            selectedLabel={selectedPropertiesLabel}
            imageAdjustments={selectedImageAdjustments}
            onImageAdjustmentsChange={handleImageAdjustmentsChange}
            audioAdjustments={selectedAudioAdjustments}
            onAudioAdjustmentsChange={handleAudioAdjustmentsChange}
            captionAdjustments={selectedCaptionAdjustments}
            onCaptionAdjustmentsChange={handleCaptionAdjustmentsChange}
            onCaptionTextChange={handleCaptionTextChange}
          />
          <TimelinePanel
            markers={markers}
            tracks={timelineState}
            onAssetDrop={handleAssetDrop}
            onClipMove={handleClipMove}
            onClipResize={handleClipResize}
            selectedClipId={selectedClip?.clipId ?? null}
            onClipSelect={handleClipSelect}
            currentTime={currentTime}
            totalDuration={totalDuration}
            onSeek={handleSeek}
            onAddCaptionClip={handleAddCaptionClip}
            onEditCaptionClip={handleEditCaptionClip}
          />
        </div>

        <div
          className="hidden h-full min-h-0 lg:grid"
          style={{
            gridTemplateRows: `${previewHeight}px ${RESIZER_SIZE}px minmax(${MIN_TIMELINE}px, 1fr)`,
          }}
        >
          <section
            className="grid min-h-0"
            style={{
              gridTemplateColumns: `${leftWidth}px ${RESIZER_SIZE}px minmax(${MIN_CENTER}px, 1fr) ${RESIZER_SIZE}px ${rightWidth}px`,
            }}
          >
            <div className="min-h-0 overflow-auto">
              <AssetsSidebar
                assets={uploadedAssets}
                onUploadFiles={handleUploadFiles}
                className="h-full border-r-0"
              />
            </div>

            <Divider
              direction="vertical"
              label="Resize assets sidebar"
              onPointerDown={(event) => startDrag("left", event)}
            />

            <div className="min-h-0 overflow-auto">
              <EditorPreview
                className="h-full"
                currentTime={currentTime}
                totalDuration={totalDuration}
                isPlaying={isPlaying}
                onTogglePlay={handleTogglePlay}
                onSeek={handleSeek}
                onStep={handleStep}
                activeVideoLabel={activeVideoClip?.label ?? null}
                activeVideoSourceUrl={activeVideoAsset?.sourceUrl}
                activeVideoIsImage={activeVideoAsset?.mimeType?.startsWith("image/")}
                activeImageAdjustments={{
                  ...getDefaultImageAdjustments(),
                  ...activeVideoClip?.imageAdjustments,
                }}
                activeAudioLabel={activeAudioClip?.label ?? null}
                activeCaptionLabel={activeCaptionClip?.label ?? null}
                activeCaptionAdjustments={{
                  ...getDefaultCaptionAdjustments(),
                  ...activeCaptionClip?.captionAdjustments,
                }}
              />
            </div>

            <Divider
              direction="vertical"
              label="Resize properties panel"
              onPointerDown={(event) => startDrag("right", event)}
            />

            <div className="min-h-0 overflow-auto">
              <PropertiesPanel
                className="h-full border-l-0"
                selectedType={selectedPropertiesType}
                selectedLabel={selectedPropertiesLabel}
                imageAdjustments={selectedImageAdjustments}
                onImageAdjustmentsChange={handleImageAdjustmentsChange}
                audioAdjustments={selectedAudioAdjustments}
                onAudioAdjustmentsChange={handleAudioAdjustmentsChange}
                captionAdjustments={selectedCaptionAdjustments}
                onCaptionAdjustmentsChange={handleCaptionAdjustmentsChange}
                onCaptionTextChange={handleCaptionTextChange}
              />
            </div>
          </section>

          <Divider
            direction="horizontal"
            label="Resize timeline"
            onPointerDown={(event) => startDrag("timeline", event)}
          />

          <div className="min-h-0 overflow-auto">
            <TimelinePanel
              markers={markers}
              tracks={timelineState}
              onAssetDrop={handleAssetDrop}
              onClipMove={handleClipMove}
              onClipResize={handleClipResize}
              selectedClipId={selectedClip?.clipId ?? null}
              onClipSelect={handleClipSelect}
              currentTime={currentTime}
              totalDuration={totalDuration}
              onSeek={handleSeek}
              onAddCaptionClip={handleAddCaptionClip}
              onEditCaptionClip={handleEditCaptionClip}
              className="h-full border-t-0"
            />
          </div>
        </div>
      </div>

      {activeDrag && (
        <div className="pointer-events-none fixed inset-0 z-50 bg-blue-500/5" />
      )}
      <RenderModal
        isOpen={renderModalOpen}
        isSubmitting={isSubmittingRender}
        error={renderError}
        onClose={handleCloseRenderModal}
        onSubmit={handleRenderSubmit}
      />
      <audio ref={audioRef} className="hidden" preload="auto" />
    </main>
  );
}
