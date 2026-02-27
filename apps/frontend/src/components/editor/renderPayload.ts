import type {
  AssetItem,
  AudioAdjustments,
  CaptionAdjustments,
  ImageAdjustments,
  TimelineTrack,
} from "./types";

export type RenderProfile = "slow" | "flash";

type RenderTextElement = {
  type: "text";
  content: string;
  startInSeconds: number;
  endInSeconds: number;
  style: {
    fontSize: number;
    color: string;
    backgroundColor: string;
    x: number;
    y: number;
  };
};

type RenderImageElement = {
  type: "image";
  assetId: string;
  label: string;
  startInSeconds: number;
  endInSeconds: number;
  style: {
    opacity: number;
    brightness: number;
    contrast: number;
    saturation: number;
    x: number;
    y: number;
    scale: number;
  };
};

type RenderAudioElement = {
  type: "audio";
  assetId: string;
  label: string;
  startInSeconds: number;
  endInSeconds: number;
  style: {
    volume: number;
    normalizationEnabled: boolean;
    normalizationTargetDb: number;
    fadeInSeconds: number;
    fadeOutSeconds: number;
  };
};

export type RenderRequest = {
  projectId: string;
  projectName: string;
  renderMode: RenderProfile;
  durationInSeconds: number;
  fps: number;
  width: number;
  height: number;
  elements: Array<RenderTextElement | RenderImageElement | RenderAudioElement>;
};

const PRESET_BY_PROFILE: Record<RenderProfile, { fps: number; width: number; height: number }> = {
  slow: { fps: 30, width: 1920, height: 1080 },
  flash: { fps: 60, width: 1920, height: 1080 },
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function roundSeconds(value: number) {
  return Math.round(value * 1000) / 1000;
}

function defaultImageAdjustments(value?: ImageAdjustments) {
  return {
    opacity: value?.opacity ?? 100,
    brightness: value?.brightness ?? 100,
    contrast: value?.contrast ?? 100,
    saturation: value?.saturation ?? 100,
    positionX: value?.positionX ?? 0,
    positionY: value?.positionY ?? 0,
    scale: value?.scale ?? 100,
  };
}

function defaultAudioAdjustments(value?: AudioAdjustments) {
  return {
    volume: value?.volume ?? 100,
    normalizationEnabled: value?.normalizationEnabled ?? false,
    normalizationTargetDb: value?.normalizationTargetDb ?? -3,
    fadeInSeconds: value?.fadeInSeconds ?? 0,
    fadeOutSeconds: value?.fadeOutSeconds ?? 0,
  };
}

function defaultCaptionAdjustments(value?: CaptionAdjustments) {
  return {
    fontSize: value?.fontSize ?? 20,
    positionX: value?.positionX ?? 0,
    positionY: value?.positionY ?? 0,
    textColor: value?.textColor ?? "#ffffff",
    backgroundColor: value?.backgroundColor ?? "#000000B3",
  };
}

export function buildRenderRequest({
  projectId,
  projectName,
  profile,
  timelineDuration,
  timelineState,
  assets,
}: {
  projectId: string;
  projectName: string;
  profile: RenderProfile;
  timelineDuration: number;
  timelineState: TimelineTrack[];
  assets: AssetItem[];
}): RenderRequest {
  const preset = PRESET_BY_PROFILE[profile];
  const safeDuration = Math.max(1, timelineDuration);
  const assetsById = new Map(assets.map((asset) => [asset.id, asset]));

  const elements = timelineState
    .flatMap((track) =>
      track.clips.map((clip) => {
        const startInSeconds = roundSeconds((clamp(clip.start, 0, 100) / 100) * safeDuration);
        const endPercent = clamp(clip.start + clip.width, 0, 100);
        const endInSeconds = roundSeconds((endPercent / 100) * safeDuration);

        if (track.id === "track-caption") {
          const adjustments = defaultCaptionAdjustments(clip.captionAdjustments);
          return {
            type: "text",
            content: clip.label,
            startInSeconds,
            endInSeconds,
            style: {
              fontSize: adjustments.fontSize,
              color: adjustments.textColor,
              backgroundColor: adjustments.backgroundColor,
              x: adjustments.positionX,
              y: adjustments.positionY,
            },
          } satisfies RenderTextElement;
        }

        const asset = clip.sourceAssetId ? assetsById.get(clip.sourceAssetId) : null;

        if (track.id === "track-image" && asset?.mimeType?.startsWith("image/")) {
          const adjustments = defaultImageAdjustments(clip.imageAdjustments);
          return {
            type: "image",
            assetId: asset.id,
            label: clip.label,
            startInSeconds,
            endInSeconds,
            style: {
              opacity: adjustments.opacity,
              brightness: adjustments.brightness,
              contrast: adjustments.contrast,
              saturation: adjustments.saturation,
              x: adjustments.positionX,
              y: adjustments.positionY,
              scale: adjustments.scale,
            },
          } satisfies RenderImageElement;
        }

        if (track.id === "track-audio" && asset?.mimeType?.startsWith("audio/")) {
          const adjustments = defaultAudioAdjustments(clip.audioAdjustments);
          return {
            type: "audio",
            assetId: asset.id,
            label: clip.label,
            startInSeconds,
            endInSeconds,
            style: {
              volume: adjustments.volume,
              normalizationEnabled: adjustments.normalizationEnabled,
              normalizationTargetDb: adjustments.normalizationTargetDb,
              fadeInSeconds: adjustments.fadeInSeconds,
              fadeOutSeconds: adjustments.fadeOutSeconds,
            },
          } satisfies RenderAudioElement;
        }

        return null;
      }),
    )
    .filter((element): element is RenderTextElement | RenderImageElement | RenderAudioElement => Boolean(element))
    .sort((a, b) => a.startInSeconds - b.startInSeconds);

  return {
    projectId,
    projectName,
    renderMode: profile,
    durationInSeconds: roundSeconds(safeDuration),
    fps: preset.fps,
    width: preset.width,
    height: preset.height,
    elements,
  };
}
