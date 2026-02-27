import type { RenderProfile } from "./renderPayload";

type RenderModalProps = {
  isOpen: boolean;
  isSubmitting?: boolean;
  error?: string | null;
  onClose: () => void;
  onSubmit: (profile: RenderProfile) => void;
};

const OPTIONS: Array<{ id: RenderProfile; title: string; description: string }> = [
  {
    id: "slow",
    title: "Render Lento",
    description: "Maior estabilidade para processamentos completos.",
  },
  {
    id: "flash",
    title: "Render Flash",
    description: "Prioriza velocidade com FPS mais alto.",
  },
];

export function RenderModal({
  isOpen,
  isSubmitting = false,
  error = null,
  onClose,
  onSubmit,
}: RenderModalProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 px-4">
      <div className="w-full max-w-md rounded-xl border border-[#2a3e63] bg-[#0b1831] p-5 text-slate-100 shadow-2xl">
        <h2 className="text-lg font-semibold">Escolha o tipo de render</h2>
        <p className="mt-1 text-sm text-slate-400">
          O projeto será enviado para o backend e você acompanhará o progresso na tela de espera.
        </p>

        <div className="mt-4 space-y-2">
          {OPTIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              disabled={isSubmitting}
              onClick={() => onSubmit(option.id)}
              className="w-full rounded-lg border border-[#2a3e63] bg-[#122546] px-4 py-3 text-left transition hover:border-blue-400/70 hover:bg-[#17325e] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <p className="font-semibold text-white">{option.title}</p>
              <p className="mt-0.5 text-xs text-slate-300">{option.description}</p>
            </button>
          ))}
        </div>

        {error ? (
          <p className="mt-3 rounded-md border border-rose-500/40 bg-rose-950/40 px-3 py-2 text-sm text-rose-200">
            {error}
          </p>
        ) : null}

        <div className="mt-4 flex justify-end">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onClose}
            className="rounded-md border border-[#2a3e63] px-3 py-1.5 text-sm text-slate-200 hover:bg-[#1a2a46] disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
