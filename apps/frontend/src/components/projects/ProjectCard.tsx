import Link from "next/link";
import type { Project } from "./types";
import { DotsIcon, PlusIcon } from "./icons";

type ProjectCardProps = {
  project: Project;
};

export function ProjectCard({ project }: ProjectCardProps) {
  return (
    <article className="group">
      <Link href={project.href} className="block">
        <div
          className={`relative h-24 overflow-hidden rounded-xl border border-slate-700/70 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04)] transition group-hover:border-blue-500/60 sm:h-28 ${project.thumbnailClassName}`}
        >
          <span className="absolute bottom-2 right-2 rounded bg-black/60 px-2 py-0.5 text-[11px] font-semibold text-white">
            {project.duration}
          </span>
        </div>
        <div className="mt-2 flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="truncate text-base font-semibold text-white">
              {project.name}
            </h3>
            <p className="mt-0.5 text-sm text-slate-400">{project.editedAt}</p>
          </div>
          <span
            className="mt-1 text-slate-400 transition group-hover:text-white"
            aria-hidden
          >
            <DotsIcon className="size-4" />
          </span>
        </div>
      </Link>
    </article>
  );
}

type CreateProjectCardProps = {
  onClick: () => void;
};

export function CreateProjectCard({ onClick }: CreateProjectCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="grid h-full min-h-36 place-items-center rounded-xl border border-dashed border-slate-600 bg-slate-900/40 p-4 text-center transition hover:border-blue-500/80 hover:bg-slate-900/70"
    >
      <div className="grid place-items-center">
        <span className="mb-3 grid size-12 place-items-center rounded-full bg-blue-600/20 text-blue-300">
          <PlusIcon className="size-6" />
        </span>
        <span className="text-base font-semibold text-slate-200">
          Create New Project
        </span>
      </div>
    </button>
  );
}
