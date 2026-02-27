export type AssetItem = {
  id: string;
  label: string;
  duration: string;
  durationSeconds?: number;
  sourceUrl?: string;
  thumbnailClassName?: string;
  thumbnailUrl?: string;
  fileSize?: number;
  mimeType?: string;
};

export type TimelineClip = {
  id: string;
  sourceAssetId?: string;
  label: string;
  start: number;
  width: number;
  colorClassName: string;
  imageAdjustments?: ImageAdjustments;
  audioAdjustments?: AudioAdjustments;
  captionAdjustments?: CaptionAdjustments;
};

export type TimelineTrack = {
  id: string;
  name: string;
  clips: TimelineClip[];
};

export type AssetDropPayload = {
  asset: AssetItem;
  trackId: string;
  start: number;
};

export type TimelineClipMovePayload = {
  clipId: string;
  fromTrackId: string;
  toTrackId: string;
  start: number;
};

export type TimelineClipResizePayload = {
  clipId: string;
  trackId: string;
  start: number;
  width: number;
};

export type TimelineClipSelection = {
  clipId: string;
  trackId: string;
};

export type PropertiesTargetType = "image" | "audio" | "caption" | null;

export type ImageAdjustments = {
  opacity: number;
  brightness: number;
  contrast: number;
  saturation: number;
  positionX: number;
  positionY: number;
  scale: number;
};

export type AudioAdjustments = {
  volume: number;
  normalizationEnabled: boolean;
  normalizationTargetDb: number;
  fadeInSeconds: number;
  fadeOutSeconds: number;
};

export type CaptionAdjustments = {
  fontSize: number;
  positionX: number;
  positionY: number;
  textColor: string;
  backgroundColor: string;
};
