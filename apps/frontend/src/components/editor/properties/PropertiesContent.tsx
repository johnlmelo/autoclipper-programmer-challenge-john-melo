import type {
  AudioAdjustments,
  CaptionAdjustments,
  ImageAdjustments,
  PropertiesTargetType,
} from "../types";
import { AudioProperties } from "./AudioProperties";
import { CaptionProperties } from "./CaptionProperties";
import { ImageProperties } from "./ImageProperties";
import { PropertiesEmptyState } from "./PropertiesEmptyState";

type PropertiesContentProps = {
  selectedType: PropertiesTargetType;
  selectedLabel?: string | null;
  imageAdjustments?: ImageAdjustments | null;
  onImageAdjustmentsChange?: (patch: Partial<ImageAdjustments>) => void;
  audioAdjustments?: AudioAdjustments | null;
  onAudioAdjustmentsChange?: (patch: Partial<AudioAdjustments>) => void;
  captionAdjustments?: CaptionAdjustments | null;
  onCaptionAdjustmentsChange?: (patch: Partial<CaptionAdjustments>) => void;
  onCaptionTextChange?: (value: string) => void;
};

export function PropertiesContent({
  selectedType,
  selectedLabel,
  imageAdjustments,
  onImageAdjustmentsChange,
  audioAdjustments,
  onAudioAdjustmentsChange,
  captionAdjustments,
  onCaptionAdjustmentsChange,
  onCaptionTextChange,
}: PropertiesContentProps) {
  if (selectedType === "image") {
    if (!imageAdjustments || !onImageAdjustmentsChange) {
      return <PropertiesEmptyState />;
    }
    return (
      <ImageProperties
        selectedLabel={selectedLabel}
        adjustments={imageAdjustments}
        onChange={onImageAdjustmentsChange}
      />
    );
  }

  if (selectedType === "audio") {
    if (!audioAdjustments || !onAudioAdjustmentsChange) {
      return <PropertiesEmptyState />;
    }
    return (
      <AudioProperties
        selectedLabel={selectedLabel}
        adjustments={audioAdjustments}
        onChange={onAudioAdjustmentsChange}
      />
    );
  }

  if (selectedType === "caption") {
    if (!captionAdjustments || !onCaptionAdjustmentsChange || !onCaptionTextChange) {
      return <PropertiesEmptyState />;
    }
    return (
      <CaptionProperties
        selectedLabel={selectedLabel}
        adjustments={captionAdjustments}
        onChange={onCaptionAdjustmentsChange}
        onTextChange={onCaptionTextChange}
      />
    );
  }

  return <PropertiesEmptyState />;
}
