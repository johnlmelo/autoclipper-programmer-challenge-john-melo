import type {
  AudioAdjustments,
  CaptionAdjustments,
  ImageAdjustments,
  PropertiesTargetType,
} from "./types";
import { PropertiesContent } from "./properties/PropertiesContent";

type PropertiesPanelProps = {
  className?: string;
  selectedType?: PropertiesTargetType;
  selectedLabel?: string | null;
  imageAdjustments?: ImageAdjustments | null;
  onImageAdjustmentsChange?: (patch: Partial<ImageAdjustments>) => void;
  audioAdjustments?: AudioAdjustments | null;
  onAudioAdjustmentsChange?: (patch: Partial<AudioAdjustments>) => void;
  captionAdjustments?: CaptionAdjustments | null;
  onCaptionAdjustmentsChange?: (patch: Partial<CaptionAdjustments>) => void;
  onCaptionTextChange?: (value: string) => void;
};

export function PropertiesPanel({
  className = "",
  selectedType = null,
  selectedLabel = null,
  imageAdjustments = null,
  onImageAdjustmentsChange,
  audioAdjustments = null,
  onAudioAdjustmentsChange,
  captionAdjustments = null,
  onCaptionAdjustmentsChange,
  onCaptionTextChange,
}: PropertiesPanelProps) {
  return (
    <aside className={`border-l border-[#1a2a46] bg-[#09162f] p-4 ${className}`}>
      <h2 className="text-sm font-semibold tracking-[0.12em] text-slate-300">
        PROPERTIES
      </h2>
      <p className="mt-2 text-xs uppercase tracking-[0.12em] text-slate-500">
        {selectedType ? `Tipo: ${selectedType}` : "Tipo: nenhum"}
      </p>

      <div className="mt-6">
        <PropertiesContent
          selectedType={selectedType}
          selectedLabel={selectedLabel}
          imageAdjustments={imageAdjustments}
          onImageAdjustmentsChange={onImageAdjustmentsChange}
          audioAdjustments={audioAdjustments}
          onAudioAdjustmentsChange={onAudioAdjustmentsChange}
          captionAdjustments={captionAdjustments}
          onCaptionAdjustmentsChange={onCaptionAdjustmentsChange}
          onCaptionTextChange={onCaptionTextChange}
        />
      </div>
    </aside>
  );
}
