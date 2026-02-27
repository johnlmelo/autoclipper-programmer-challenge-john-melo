import type { AudioAdjustments } from "../types";

type AudioPropertiesProps = {
  selectedLabel?: string | null;
  adjustments: AudioAdjustments;
  onChange: (patch: Partial<AudioAdjustments>) => void;
};

function SliderField({
  label,
  value,
  min,
  max,
  step,
  suffix = "",
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  suffix?: string;
  onChange: (value: number) => void;
}) {
  return (
    <label className="block space-y-1">
      <div className="flex items-center justify-between text-xs text-slate-300">
        <span>{label}</span>
        <span>
          {value}
          {suffix}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="h-1.5 w-full accent-blue-500"
      />
    </label>
  );
}

export function AudioProperties({
  selectedLabel,
  adjustments,
  onChange,
}: AudioPropertiesProps) {
  return (
    <div className="space-y-4">
      <section>
        <h3 className="text-xs font-semibold tracking-[0.12em] text-slate-400">
          AUDIO
        </h3>
        <p className="mt-2 rounded-lg bg-slate-800 px-3 py-2 text-sm text-slate-200">
          {selectedLabel ?? "Audio selecionado"}
        </p>
      </section>
      <section>
        <h3 className="text-xs font-semibold tracking-[0.12em] text-slate-400">
          MIXER
        </h3>
        <div className="mt-2 space-y-3 rounded-lg bg-slate-800 p-3">
          <SliderField
            label="Volume"
            min={0}
            max={100}
            step={1}
            value={adjustments.volume}
            suffix="%"
            onChange={(value) => onChange({ volume: value })}
          />
        </div>
      </section>
      <section>
        <h3 className="text-xs font-semibold tracking-[0.12em] text-slate-400">
          NORMALIZACAO
        </h3>
        <div className="mt-2 space-y-3 rounded-lg bg-slate-800 p-3">
          <label className="flex items-center justify-between text-sm text-slate-200">
            <span>Ativar normalizacao</span>
            <input
              type="checkbox"
              checked={adjustments.normalizationEnabled}
              onChange={(event) =>
                onChange({ normalizationEnabled: event.target.checked })
              }
              className="size-4 accent-blue-500"
            />
          </label>
          <SliderField
            label="Target"
            min={-24}
            max={-1}
            step={1}
            value={adjustments.normalizationTargetDb}
            suffix=" dB"
            onChange={(value) => onChange({ normalizationTargetDb: value })}
          />
        </div>
      </section>
      <section>
        <h3 className="text-xs font-semibold tracking-[0.12em] text-slate-400">
          FADES
        </h3>
        <div className="mt-2 space-y-3 rounded-lg bg-slate-800 p-3">
          <SliderField
            label="Fade In"
            min={0}
            max={10}
            step={0.1}
            value={adjustments.fadeInSeconds}
            suffix="s"
            onChange={(value) => onChange({ fadeInSeconds: value })}
          />
          <SliderField
            label="Fade Out"
            min={0}
            max={10}
            step={0.1}
            value={adjustments.fadeOutSeconds}
            suffix="s"
            onChange={(value) => onChange({ fadeOutSeconds: value })}
          />
        </div>
      </section>
    </div>
  );
}
