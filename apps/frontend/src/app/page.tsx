"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  createBrowserProject,
  getEditedAtLabel,
  listBrowserProjects,
} from "@/components/editor/persistence";
import { ProjectsFooter } from "@/components/projects/ProjectsFooter";
import { ProjectsGrid } from "@/components/projects/ProjectsGrid";
import { ProjectsHeader } from "@/components/projects/ProjectsHeader";
import { ProjectsTopBar } from "@/components/projects/ProjectsTopBar";
import type { Project } from "@/components/projects/types";

export default function Home() {
  const router = useRouter();
  const [browserProjects, setBrowserProjects] = useState<Project[]>([]);

  const loadProjects = useCallback(async () => {
    const projects = await listBrowserProjects();
    setBrowserProjects(
      projects.map((project) => ({
        id: project.id,
        projectId: project.id,
        name: project.name,
        href: `/novo?projectId=${project.id}`,
        editedAt: getEditedAtLabel(project.updatedAt),
        duration: project.duration,
        thumbnailClassName: project.thumbnailClassName,
      })),
    );
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadProjects();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadProjects]);

  const handleCreateProject = useCallback(async () => {
    const project = await createBrowserProject();
    await loadProjects();
    router.push(`/novo?projectId=${project.id}`);
  }, [loadProjects, router]);

  const sortedProjects = useMemo(() => browserProjects, [browserProjects]);

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#081327_0%,#050f22_100%)] font-sans">
      <ProjectsTopBar onCreateProject={handleCreateProject} />
      <ProjectsHeader />
      <ProjectsGrid projects={sortedProjects} onCreateProject={handleCreateProject} />
      <ProjectsFooter totalProjects={sortedProjects.length} />
    </main>
  );
}
