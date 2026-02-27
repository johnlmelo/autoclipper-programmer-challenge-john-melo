import type { CaptionAdjustments } from "../types";

type CaptionPropertiesProps = {
  selectedLabel?: string | null;
  adjustments: CaptionAdjustments;
  onTextChange: (value: string) => void;
  onChange: (patch: Partial<CaptionAdjustments>) => void;
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

export function CaptionProperties({
  selectedLabel,
  adjustments,
  onTextChange,
  onChange,
}: CaptionPropertiesProps) {
  return (
    <div className="space-y-4">
      <section>
        <h3 className="text-xs font-semibold tracking-[0.12em] text-slate-400">
          LEGENDA
        </h3>
        <textarea
          value={selectedLabel ?? ""}
          onChange={(event) => onTextChange(event.target.value)}
          rows={3}
          className="mt-2 w-full rounded-lg bg-slate-800 px-3 py-2 text-sm text-slate-200 outline-none ring-blue-500/40 focus:ring-2"
          placeholder="Digite o texto da legenda..."
        />
      </section>
      <section>
        <h3 className="text-xs font-semibold tracking-[0.12em] text-slate-400">
          APARENCIA
        </h3>
        <div className="mt-2 space-y-3 rounded-lg bg-slate-800 p-3">
          <SliderField
            label="Tamanho da fonte"
            min={12}
            max={120}
            step={1}
            value={adjustments.fontSize}
            onChange={(value) => onChange({ fontSize: value })}
          />
          <label className="block text-xs text-slate-300">
            Cor do texto
            <input
              type="color"
              value={adjustments.textColor}
              onChange={(event) => onChange({ textColor: event.target.value })}
              className="mt-1 h-9 w-full rounded border border-slate-700 bg-slate-900"
            />
          </label>
          <label className="block text-xs text-slate-300">
            Cor de fundo
            <input
              type="color"
              value={adjustments.backgroundColor}
              onChange={(event) => onChange({ backgroundColor: event.target.value })}
              className="mt-1 h-9 w-full rounded border border-slate-700 bg-slate-900"
            />
          </label>
        </div>
      </section>
      <section>
        <h3 className="text-xs font-semibold tracking-[0.12em] text-slate-400">
          POSICAO
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
        </div>
      </section>
    </div>
  );
}
