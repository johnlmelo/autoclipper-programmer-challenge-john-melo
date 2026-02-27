"use client";

import { useCallback, useEffect, useState } from "react";
import type { DragEvent } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import type {
  AssetDropPayload,
  AssetItem,
  TimelineClipMovePayload,
  TimelineClipResizePayload,
  TimelineClip,
  TimelineClipSelection,
  TimelineTrack,
} from "./types";
import { Plus } from 'lucide-react';


type TimelinePanelProps = {
  className?: string;
  markers?: string[];
  tracks?: TimelineTrack[];
  onAssetDrop?: (payload: AssetDropPayload) => void;
  onClipMove?: (payload: TimelineClipMovePayload) => void;
  onClipResize?: (payload: TimelineClipResizePayload) => void;
  selectedClipId?: string | null;
  onClipSelect?: (selection: TimelineClipSelection | null) => void;
  currentTime?: number;
  totalDuration?: number;
  onSeek?: (seconds: number) => void;
  onAddCaptionClip?: () => void;
  onEditCaptionClip?: (clipId: string) => void;
};

export function TimelinePanel({
  className = "",
  markers = [],
  tracks = [],
  onAssetDrop,
  onClipMove,
  onClipResize,
  selectedClipId = null,
  onClipSelect,
  currentTime = 0,
  totalDuration = 0,
  onSeek,
  onAddCaptionClip,
  onEditCaptionClip,
}: TimelinePanelProps) {
  const [hoverTrackId, setHoverTrackId] = useState<string | null>(null);
  const [draggingClip, setDraggingClip] = useState<{
    clipId: string;
    trackId: string;
    pointerStartX: number;
    initialStart: number;
    currentStart: number;
    clipWidth: number;
    trackWidth: number;
  } | null>(null);
  const [resizingClip, setResizingClip] = useState<{
    clipId: string;
    trackId: string;
    edge: "left" | "right";
    pointerStartX: number;
    initialStart: number;
    initialWidth: number;
    currentStart: number;
    currentWidth: number;
    trackWidth: number;
  } | null>(null);
  const [draggingPlayhead, setDraggingPlayhead] = useState<{
    left: number;
    width: number;
  } | null>(null);

  const parseDroppedAsset = (event: DragEvent<HTMLDivElement>) => {
    const raw = event.dataTransfer.getData("application/x-editor-asset");
    if (!raw) {
      return null;
    }

    try {
      return JSON.parse(raw) as AssetItem;
    } catch {
      return null;
    }
  };

  const parseDraggedClip = (event: DragEvent<HTMLDivElement>) => {
    const raw = event.dataTransfer.getData("application/x-editor-timeline-clip");
    if (!raw) {
      return null;
    }

    try {
      return JSON.parse(raw) as { clipId: string; fromTrackId: string };
    } catch {
      return null;
    }
  };

  const playheadPercent =
    totalDuration > 0 ? Math.min(100, (currentTime / totalDuration) * 100) : 0;

  const handleSeekFromPointer = (
    event: ReactPointerEvent<HTMLElement>,
    element: HTMLElement,
  ) => {
    if (!onSeek || totalDuration <= 0) {
      return;
    }

    const rect = element.getBoundingClientRect();
    const relativeX = event.clientX - rect.left;
    const percent = Math.max(0, Math.min(1, relativeX / rect.width));
    onSeek(percent * totalDuration);
  };

  const seekFromClientX = useCallback(
    (clientX: number, left: number, width: number) => {
      if (!onSeek || totalDuration <= 0 || width <= 0) {
        return;
      }

      const relativeX = clientX - left;
      const percent = Math.max(0, Math.min(1, relativeX / width));
      onSeek(percent * totalDuration);
    },
    [onSeek, totalDuration],
  );

  const handlePlayheadPointerDown = (
    event: ReactPointerEvent<HTMLElement>,
    element: HTMLElement,
  ) => {
    if (event.button !== 0) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    const rect = element.getBoundingClientRect();
    setDraggingPlayhead({ left: rect.left, width: rect.width });
    seekFromClientX(event.clientX, rect.left, rect.width);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>, trackId: string) => {
    event.preventDefault();
    setHoverTrackId(null);

    const draggedClip = parseDraggedClip(event);
    if (draggedClip) {
      const rect = event.currentTarget.getBoundingClientRect();
      const relativeX = event.clientX - rect.left;
      const start = Math.max(0, Math.min(95, (relativeX / rect.width) * 100));
      onClipMove?.({
        clipId: draggedClip.clipId,
        fromTrackId: draggedClip.fromTrackId,
        toTrackId: trackId,
        start,
      });
      return;
    }

    const asset = parseDroppedAsset(event);
    if (!asset) {
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();
    const relativeX = event.clientX - rect.left;
    const start = Math.max(0, Math.min(95, (relativeX / rect.width) * 100));

    onAssetDrop?.({ asset, trackId, start });
  };

  const handleClipPointerDown = (
    event: ReactPointerEvent<HTMLDivElement>,
    trackId: string,
    clip: TimelineClip,
  ) => {
    if (event.button !== 0) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    onClipSelect?.({ clipId: clip.id, trackId });
    const trackElement = event.currentTarget.parentElement;
    if (!trackElement) {
      return;
    }

    setDraggingClip({
      clipId: clip.id,
      trackId,
      pointerStartX: event.clientX,
      initialStart: clip.start,
      currentStart: clip.start,
      clipWidth: clip.width,
      trackWidth: trackElement.getBoundingClientRect().width,
    });
  };

  const handleResizePointerDown = (
    event: ReactPointerEvent<HTMLSpanElement>,
    trackId: string,
    clip: TimelineClip,
    edge: "left" | "right",
  ) => {
    if (event.button !== 0) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    const trackElement = event.currentTarget.closest(".timeline-track-area");
    if (!trackElement) {
      return;
    }

    setResizingClip({
      clipId: clip.id,
      trackId,
      edge,
      pointerStartX: event.clientX,
      initialStart: clip.start,
      initialWidth: clip.width,
      currentStart: clip.start,
      currentWidth: clip.width,
      trackWidth: trackElement.getBoundingClientRect().width,
    });
  };

  useEffect(() => {
    if (!draggingClip) {
      return;
    }

    const onPointerMove = (event: PointerEvent) => {
      setDraggingClip((previous) => {
        if (!previous) {
          return previous;
        }

        const deltaX = event.clientX - previous.pointerStartX;
        const deltaPercent = (deltaX / previous.trackWidth) * 100;
        const maxStart = Math.max(0, 100 - previous.clipWidth);
        const nextStart = Math.max(
          0,
          Math.min(maxStart, previous.initialStart + deltaPercent),
        );

        return { ...previous, currentStart: nextStart };
      });
    };

    const onPointerUp = () => {
      if (draggingClip) {
        onClipMove?.({
          clipId: draggingClip.clipId,
          fromTrackId: draggingClip.trackId,
          toTrackId: draggingClip.trackId,
          start: draggingClip.currentStart,
        });
      }
      setDraggingClip(null);
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
    };

    document.body.style.userSelect = "none";
    document.body.style.cursor = "grabbing";
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);

    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
    };
  }, [draggingClip, onClipMove]);

  useEffect(() => {
    if (!resizingClip) {
      return;
    }

    const MIN_WIDTH = 3;

    const onPointerMove = (event: PointerEvent) => {
      setResizingClip((previous) => {
        if (!previous) {
          return previous;
        }

        const deltaX = event.clientX - previous.pointerStartX;
        const deltaPercent = (deltaX / previous.trackWidth) * 100;

        if (previous.edge === "right") {
          const maxWidth = 100 - previous.initialStart;
          const nextWidth = Math.max(
            MIN_WIDTH,
            Math.min(maxWidth, previous.initialWidth + deltaPercent),
          );
          return { ...previous, currentWidth: nextWidth };
        }

        const initialEnd = previous.initialStart + previous.initialWidth;
        const nextStart = Math.max(
          0,
          Math.min(initialEnd - MIN_WIDTH, previous.initialStart + deltaPercent),
        );
        const nextWidth = initialEnd - nextStart;
        return { ...previous, currentStart: nextStart, currentWidth: nextWidth };
      });
    };

    const onPointerUp = () => {
      if (resizingClip) {
        onClipResize?.({
          clipId: resizingClip.clipId,
          trackId: resizingClip.trackId,
          start: resizingClip.currentStart,
          width: resizingClip.currentWidth,
        });
      }
      setResizingClip(null);
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
    };

    document.body.style.userSelect = "none";
    document.body.style.cursor = "ew-resize";
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);

    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
    };
  }, [resizingClip, onClipResize]);

  useEffect(() => {
    if (!draggingPlayhead) {
      return;
    }

    const onPointerMove = (event: PointerEvent) => {
      seekFromClientX(event.clientX, draggingPlayhead.left, draggingPlayhead.width);
    };

    const onPointerUp = () => {
      setDraggingPlayhead(null);
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
    };

    document.body.style.userSelect = "none";
    document.body.style.cursor = "col-resize";
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);

    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
    };
  }, [draggingPlayhead, seekFromClientX]);

  return (
    <section className={`border-t border-[#1a2a46] bg-[#08142b] ${className}`}>
      <div className="border-b border-[#1a2a46] px-3 py-2 text-xs text-slate-300">
        <div
          className="relative flex items-center"
          onPointerDown={(event) => {
            if (event.target === event.currentTarget) {
              handleSeekFromPointer(event, event.currentTarget);
            }
          }}
        >
          {markers.map((marker) => (
            <span key={marker} className="w-[9.09%] text-center text-[11px] text-slate-400">
              {marker}
            </span>
          ))}
          <button
            type="button"
            className="absolute top-0 h-7 w-4 -translate-x-1/2 cursor-col-resize"
            style={{ left: `${playheadPercent}%` }}
            onPointerDown={(event) =>
              handlePlayheadPointerDown(event, event.currentTarget.parentElement ?? event.currentTarget)
            }
            aria-label="Mover agulha da timeline"
          >
            <span className="mx-auto block h-full w-0.5 bg-blue-500" />
          </button>
        </div>
      </div>

      <div className="space-y-2 px-3 py-3">
        {tracks.length > 0 ? (
          tracks.map((track) => (
            <div key={track.id} className="flex items-center gap-3">
              <div className="flex w-24 shrink-0 items-center gap-1 text-[11px] font-semibold tracking-[0.14em] text-slate-400">
                <span>{track.name}</span>
                {track.id === "track-caption" ? (
                  <button
                    type="button"
                    onClick={onAddCaptionClip}
                    className="rounded-full border border-blue-500/50 px-0.5 py-0.5 text-[10px] tracking-normal cursor-pointer text-blue-300 hover:bg-blue-500/20"
                  >
                    <Plus />
                  </button>
                ) : null}
              </div>
              <div
                className={`timeline-track-area relative h-10 flex-1 rounded transition ${
                  hoverTrackId === track.id
                    ? "bg-blue-900/35 ring-1 ring-blue-500/60"
                    : "bg-[#0d1c37]"
                }`}
                onPointerDown={(event) => {
                  onClipSelect?.(null);
                  if (event.target === event.currentTarget) {
                    handleSeekFromPointer(event, event.currentTarget);
                  }
                }}
                onDragOver={(event) => {
                  event.preventDefault();
                  event.dataTransfer.dropEffect = "copy";
                  setHoverTrackId(track.id);
                }}
                onDragEnter={() => setHoverTrackId(track.id)}
                onDragLeave={() => setHoverTrackId((prev) => (prev === track.id ? null : prev))}
                onDrop={(event) => handleDrop(event, track.id)}
              >
                {track.clips.map((clip) => {
                  const isResizing =
                    resizingClip &&
                    resizingClip.clipId === clip.id &&
                    resizingClip.trackId === track.id;
                  const previewStart = isResizing
                    ? resizingClip.currentStart
                    : draggingClip &&
                        draggingClip.clipId === clip.id &&
                        draggingClip.trackId === track.id
                      ? draggingClip.currentStart
                      : clip.start;
                  const previewWidth = isResizing
                    ? resizingClip.currentWidth
                    : clip.width;
                  const isDragging =
                    draggingClip &&
                    draggingClip.clipId === clip.id &&
                    draggingClip.trackId === track.id;
                  const isSelected = selectedClipId === clip.id;

                  return (
                  <div
                    key={clip.id}
                    draggable={!isResizing}
                    onDragStart={(event) => {
                      event.dataTransfer.effectAllowed = "move";
                      event.dataTransfer.setData(
                        "application/x-editor-timeline-clip",
                        JSON.stringify({ clipId: clip.id, fromTrackId: track.id }),
                      );
                      event.dataTransfer.setData("text/plain", clip.id);
                    }}
                    onPointerDown={(event) =>
                      handleClipPointerDown(event, track.id, clip)
                    }
                    onDoubleClick={() => {
                      if (track.id === "track-caption") {
                        onEditCaptionClip?.(clip.id);
                      }
                    }}
                    className={`absolute top-1.5 h-7 cursor-grab rounded border px-2 text-xs font-medium leading-7 text-slate-100 ${clip.colorClassName} ${isDragging ? "opacity-85 ring-1 ring-blue-300/70" : ""} ${isSelected ? "ring-2 ring-amber-300/80" : ""}`}
                    style={{ left: `${previewStart}%`, width: `${previewWidth}%` }}
                  >
                    <span
                      className="absolute inset-y-0 left-0 w-1.5 cursor-ew-resize rounded-l bg-white/30 hover:bg-white/60"
                      onPointerDown={(event) =>
                        handleResizePointerDown(event, track.id, clip, "left")
                      }
                    />
                    <span className="block truncate">{clip.label}</span>
                    <span
                      className="absolute inset-y-0 right-0 w-1.5 cursor-ew-resize rounded-r bg-white/30 hover:bg-white/60"
                      onPointerDown={(event) =>
                        handleResizePointerDown(event, track.id, clip, "right")
                      }
                    />
                  </div>
                  );
                })}
                <button
                  type="button"
                  className="absolute top-0 h-10 w-4 -translate-x-1/2 cursor-col-resize"
                  style={{ left: `${playheadPercent}%` }}
                  onPointerDown={(event) =>
                    handlePlayheadPointerDown(event, event.currentTarget.parentElement ?? event.currentTarget)
                  }
                  aria-label="Mover agulha da timeline"
                >
                  <span className="mx-auto block h-full w-0.5 bg-blue-500" />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="flex items-center gap-3">
            <div className="h-12 w-full rounded border border-dashed border-[#284269] bg-[#0d1c37] px-3 text-xs leading-[48px] text-slate-400">
              Nenhum clipe na timeline.
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
