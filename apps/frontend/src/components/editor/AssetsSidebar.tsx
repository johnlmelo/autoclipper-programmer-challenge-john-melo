"use client";

import { useRef } from "react";
import type { ChangeEvent } from "react";
import type { DragEvent } from "react";
import type { AssetItem } from "./types";
import { PlayIcon, UploadIcon } from "./icons";

type AssetsSidebarProps = {
  className?: string;
  assets?: AssetItem[];
  onUploadFiles?: (files: FileList) => void;
};

export function AssetsSidebar({
  className = "",
  assets = [],
  onUploadFiles,
}: AssetsSidebarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      onUploadFiles?.(files);
    }
    event.target.value = "";
  };

  const handleAssetDragStart = (
    event: DragEvent<HTMLButtonElement>,
    asset: AssetItem,
  ) => {
    event.dataTransfer.effectAllowed = "copy";
    event.dataTransfer.setData("application/x-editor-asset", JSON.stringify(asset));
    event.dataTransfer.setData("text/plain", asset.id);
  };

  return (
    <aside className={`border-r border-[#1a2a46] bg-[#09162f] p-3 ${className}`}>
      <div className="mb-4 flex items-center flex-col">
        <h2 className="text-xs font-semibold tracking-[0.12em] text-slate-400">
          PROJECT ASSETS
        </h2>
         <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-slate-800 px-3 py-2.5 text-sm font-semibold text-slate-200 hover:bg-slate-700"
        >
          <UploadIcon className="size-4" />
          Upload Files
        </button>
      </div>

      <div className="mt-4 border-t border-[#1a2a46] pt-4">
        {assets.length > 0 ? (
          <div className="grid grid-cols-2 gap-2">
            {assets.map((asset) => (
              <button
                key={asset.id}
                type="button"
                draggable
                onDragStart={(event) => handleAssetDragStart(event, asset)}
                className="group overflow-hidden rounded-lg border border-[#284269] bg-[#0f2142] text-left"
              >
                <div
                  className={`relative h-14 bg-cover bg-center ${asset.thumbnailClassName ?? "bg-[linear-gradient(120deg,#244067_0%,#172845_50%,#0f1d34_100%)]"}`}
                  style={
                    asset.thumbnailUrl
                      ? { backgroundImage: `url(${asset.thumbnailUrl})` }
                      : undefined
                  }
                >
                  <span className="absolute left-1.5 top-1.5 rounded bg-black/60 p-1 text-white">
                    <PlayIcon className="size-3" />
                  </span>
                  <span className="absolute bottom-1 right-1 rounded bg-black/70 px-1.5 text-[10px] text-white">
                    {asset.duration}
                  </span>
                </div>
                <p className="truncate px-2 py-1.5 text-[11px] text-slate-200 group-hover:text-white">
                  {asset.label}
                </p>
              </button>
            ))}
          </div>
        ) : (
          <p className="rounded-lg border border-dashed border-[#284269] px-3 py-6 text-center text-xs text-slate-400">
            Nenhum asset carregado.
          </p>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        multiple
        accept="video/*,image/*,audio/*"
        onChange={handleInputChange}
      />
     
    </aside>
  );
}
