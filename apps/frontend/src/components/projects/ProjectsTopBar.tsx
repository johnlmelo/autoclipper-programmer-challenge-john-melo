import { BellIcon, PlusIcon, SearchIcon } from "./icons";

type ProjectsTopBarProps = {
  onCreateProject: () => void;
};

export function ProjectsTopBar({ onCreateProject }: ProjectsTopBarProps) {
  return (
    <header className="border-b border-slate-800/80 px-4 py-3 sm:px-6">
      <div className="mx-auto flex w-full max-w-7xl items-center gap-3">
        <div className="relative flex-1">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            placeholder="Search projects, templates or assets..."
            className="h-10 w-full rounded-lg border border-slate-800 bg-slate-900/70 pl-10 pr-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
        <button
          type="button"
          className="grid size-10 place-items-center rounded-lg border border-slate-800 bg-slate-900/70 text-slate-300 transition hover:text-white"
          aria-label="Notifications"
        >
          <BellIcon className="size-5" />
        </button>
        <button
          type="button"
          onClick={onCreateProject}
          className="inline-flex h-10 items-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white transition hover:bg-blue-500"
        >
          <PlusIcon className="size-4" />
          New Project
        </button>
      </div>
    </header>
  );
}
