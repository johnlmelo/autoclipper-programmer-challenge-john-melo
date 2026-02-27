type ProjectsFooterProps = {
  totalProjects: number;
};

export function ProjectsFooter({ totalProjects }: ProjectsFooterProps) {
  return (
    <footer className="border-t border-slate-800/80 px-4 py-6 sm:px-6">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-400">Showing {totalProjects} projects</p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-slate-700"
          >
            Previous
          </button>
          <button
            type="button"
            className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-slate-700"
          >
            Next
          </button>
        </div>
      </div>
    </footer>
  );
}
