import type { Project } from "./types";
import { CreateProjectCard, ProjectCard } from "./ProjectCard";

type ProjectsGridProps = {
  projects: Project[];
  onCreateProject: () => void;
};

export function ProjectsGrid({ projects, onCreateProject }: ProjectsGridProps) {
  return (
    <section className="px-4 py-8 sm:px-6">
      <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <CreateProjectCard onClick={onCreateProject} />
        {projects.map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </div>
    </section>
  );
}
