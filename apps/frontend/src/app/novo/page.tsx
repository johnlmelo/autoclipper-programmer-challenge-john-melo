"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { EditorWorkspace } from "@/components/editor/EditorWorkspace";
import { createBrowserProject } from "@/components/editor/persistence";

function NewProjectPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [projectId, setProjectId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const ensureProject = async () => {
      const paramProjectId = searchParams.get("projectId");
      if (paramProjectId) {
        if (!cancelled) {
          setProjectId(paramProjectId);
        }
        return;
      }

      const project = await createBrowserProject();
      if (cancelled) {
        return;
      }
      setProjectId(project.id);
      router.replace(`/novo?projectId=${project.id}`);
    };

    void ensureProject();

    return () => {
      cancelled = true;
    };
  }, [router, searchParams]);

  if (!projectId) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#050f22] text-slate-200">
        Carregando projeto...
      </main>
    );
  }

  return <EditorWorkspace projectId={projectId} />;
}

export default function NewProjectPage() {
  return (
    <Suspense
      fallback={
        <main className="grid min-h-screen place-items-center bg-[#050f22] text-slate-200">
          Carregando projeto...
        </main>
      }
    >
      <NewProjectPageContent />
    </Suspense>
  );
}
