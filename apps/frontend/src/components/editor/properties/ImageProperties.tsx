import type { ImageAdjustments } from "../types";

type ImagePropertiesProps = {
  selectedLabel?: string | null;
  adjustments: ImageAdjustments;
  onChange: (patch: Partial<ImageAdjustments>) => void;
};

function SliderField({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="block space-y-1">
      <div className="flex items-center justify-between text-xs text-slate-300">
        <span>{label}</span>
        <span>{value}</span>
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

export function ImageProperties({
  selectedLabel,
  adjustments,
  onChange,
}: ImagePropertiesProps) {
  return (
    <div className="space-y-4">
      <section>
        <h3 className="text-xs font-semibold tracking-[0.12em] text-slate-400">
          IMAGEM
        </h3>
        <p className="mt-2 rounded-lg bg-slate-800 px-3 py-2 text-sm text-slate-200">
          {selectedLabel ?? "Imagem selecionada"}
        </p>
      </section>
      <section>
        <h3 className="text-xs font-semibold tracking-[0.12em] text-slate-400">
          APARENCIA
        </h3>
        <div className="mt-2 space-y-3 rounded-lg bg-slate-800 p-3">
          <SliderField
            label="Opacidade"
            min={0}
            max={100}
            step={1}
            value={adjustments.opacity}
            onChange={(value) => onChange({ opacity: value })}
          />
          <SliderField
            label="Brilho"
            min={0}
            max={200}
            step={1}
            value={adjustments.brightness}
            onChange={(value) => onChange({ brightness: value })}
          />
          <SliderField
            label="Contraste"
            min={0}
            max={200}
            step={1}
            value={adjustments.contrast}
            onChange={(value) => onChange({ contrast: value })}
          />
          <SliderField
            label="Saturacao"
            min={0}
            max={200}
            step={1}
            value={adjustments.saturation}
            onChange={(value) => onChange({ saturation: value })}
          />
        </div>
      </section>
      <section>
        <h3 className="text-xs font-semibold tracking-[0.12em] text-slate-400">
          TRANSFORM
        </h3>
        <div className="mt-2 space-y-3 rounded-lg bg-slate-800 p-3">
          <SliderField
            label="Posicao X"
            min={-100}
            max={100}
            step={1}
            value={adjustments.positionX}
            onChange={(value) => onChange({ positionX: value })}
          />
          <SliderField
            label="Posicao Y"
            min={-100}
            max={100}
            step={1}
            value={adjustments.positionY}
            onChange={(value) => onChange({ positionY: value })}
          />
          <SliderField
            label="Escala"
            min={10}
            max={300}
            step={1}
            value={adjustments.scale}
            onChange={(value) => onChange({ scale: value })}
          />
        </div>
      </section>
    </div>
  );
}
