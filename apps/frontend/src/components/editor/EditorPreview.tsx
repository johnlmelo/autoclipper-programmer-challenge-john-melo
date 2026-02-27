import { CaretDownIcon, PlayIcon, SkipBackIcon, SkipForwardIcon } from "./icons";
import type { CaptionAdjustments, ImageAdjustments } from "./types";

type EditorPreviewProps = {
  className?: string;
  currentTime: number;
  totalDuration: number;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onSeek: (seconds: number) => void;
  onStep: (delta: number) => void;
  activeVideoLabel?: string | null;
  activeVideoSourceUrl?: string;
  activeVideoIsImage?: boolean;
  activeImageAdjustments?: ImageAdjustments | null;
  activeAudioLabel?: string | null;
  activeCaptionLabel?: string | null;
  activeCaptionAdjustments?: CaptionAdjustments | null;
};

function formatTime(value: number) {
  const safeValue = Math.max(0, Math.floor(value));
  const minutes = Math.floor(safeValue / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (safeValue % 60).toString().padStart(2, "0");
  return `00:${minutes}:${seconds}`;
}

export function EditorPreview({
  className = "",
  currentTime,
  totalDuration,
  isPlaying,
  onTogglePlay,
  onSeek,
  onStep,
  activeVideoLabel,
  activeVideoSourceUrl,
  activeVideoIsImage,
  activeImageAdjustments,
  activeAudioLabel,
  activeCaptionLabel,
  activeCaptionAdjustments,
}: EditorPreviewProps) {
  const progressPercent =
    totalDuration > 0 ? Math.min(100, (currentTime / totalDuration) * 100) : 0;
  const hasActiveVisual = Boolean(activeVideoSourceUrl && activeVideoIsImage);

  return (
    <section className={`bg-[#09162f] p-3 sm:p-4 ${className}`}>
      <div className="mx-auto flex h-full max-w-3xl flex-col rounded-2xl border border-[#1a2a46] bg-black p-4">
        <div className="relative flex-1 rounded bg-[#030712]">
          {hasActiveVisual ? (
            <div
              className="absolute inset-0 rounded bg-cover bg-center"
              style={{
                backgroundImage: `url(${activeVideoSourceUrl})`,
                opacity:
                  activeImageAdjustments && Number.isFinite(activeImageAdjustments.opacity)
                    ? activeImageAdjustments.opacity / 100
                    : 1,
                filter: `brightness(${activeImageAdjustments?.brightness ?? 100}%) contrast(${activeImageAdjustments?.contrast ?? 100}%) saturate(${activeImageAdjustments?.saturation ?? 100}%)`,
                transform: `translate(${activeImageAdjustments?.positionX ?? 0}%, ${activeImageAdjustments?.positionY ?? 0}%) scale(${(activeImageAdjustments?.scale ?? 100) / 100})`,
                transformOrigin: "center",
              }}
              aria-label={activeVideoLabel ?? "Frame"}
            />
          ) : null}
          {activeAudioLabel ? (
            <div className="absolute bottom-2 left-2 rounded bg-black/60 px-2 py-1 text-[11px] text-slate-200">
              Audio: {activeAudioLabel}
            </div>
          ) : null}
          {hasActiveVisual && activeVideoLabel ? (
            <div className="absolute left-2 top-2 rounded bg-black/60 px-2 py-1 text-[11px] text-slate-200">
              {activeVideoLabel}
            </div>
          ) : null}
          {activeCaptionLabel ? (
            <div
              className="absolute left-1/2 top-[86%] max-w-[80%] -translate-x-1/2 -translate-y-1/2 rounded px-3 py-1.5 text-center font-semibold"
              style={{
                fontSize: `${activeCaptionAdjustments?.fontSize ?? 20}px`,
                color: activeCaptionAdjustments?.textColor ?? "#ffffff",
                backgroundColor: activeCaptionAdjustments?.backgroundColor ?? "#000000B3",
                transform: `translate(-50%, -50%) translate(${activeCaptionAdjustments?.positionX ?? 0}%, ${activeCaptionAdjustments?.positionY ?? 0}%)`,
              }}
            >
              {activeCaptionLabel}
            </div>
          ) : null}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3 text-slate-200">
          <button
            type="button"
            onClick={() => onStep(-5)}
            className="text-slate-300 hover:text-white"
          >
            <SkipBackIcon className="size-5" />
          </button>
          <button
            type="button"
            onClick={onTogglePlay}
            className="grid size-11 place-items-center rounded-full bg-blue-600 text-white shadow-[0_0_24px_rgba(37,99,235,0.45)] hover:bg-blue-500"
          >
            {isPlaying ? (
              <span className="inline-flex gap-1">
                <span className="h-4 w-1 rounded bg-white" />
                <span className="h-4 w-1 rounded bg-white" />
              </span>
            ) : (
              <PlayIcon className="size-5" />
            )}
          </button>
          <button
            type="button"
            onClick={() => onStep(5)}
            className="text-slate-300 hover:text-white"
          >
            <SkipForwardIcon className="size-5" />
          </button>
          <div className="ml-2">
            <p className="font-mono text-2xl">{formatTime(currentTime)}</p>
            <p className="text-[10px] tracking-[0.2em] text-slate-400">CURRENT TIME</p>
          </div>
          <button
            type="button"
            className="ml-auto inline-flex items-center gap-1 rounded-md border border-[#26334a] bg-[#121f33] px-2.5 py-1.5 text-xs"
          >
            16:9
            <CaretDownIcon className="size-3" />
          </button>
          <div className="w-full pt-2">
            <div className="mb-1 flex justify-between text-[10px] text-slate-400">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(totalDuration)}</span>
            </div>
            <input
              type="range"
              min={0}
              max={Math.max(1, totalDuration)}
              step={0.1}
              value={Math.min(currentTime, Math.max(1, totalDuration))}
              onChange={(event) => onSeek(Number(event.target.value))}
              className="h-1.5 w-full accent-blue-500"
              aria-label="Seek timeline"
            />
            <div
              className="mt-1 h-0.5 rounded bg-blue-500/30"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
