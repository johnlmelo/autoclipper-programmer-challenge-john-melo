"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { getRenderById, type RenderJob } from "@/components/editor/renderApi";

const POLL_INTERVAL_MS = 30_000;

function formatDate(value?: string | null) {
  if (!value) {
    return "-";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "-";
  }

  return parsed.toLocaleString("pt-BR");
}

export default function WaitingRenderPage() {
  const params = useParams<{ id: string }>();
  const renderId = useMemo(() => {
    if (!params?.id) {
      return "";
    }
    return Array.isArray(params.id) ? params.id[0] ?? "" : params.id;
  }, [params?.id]);

  const [renderJob, setRenderJob] = useState<RenderJob | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!renderId) {
      return;
    }

    let cancelled = false;

    const loadRenderJob = async () => {
      try {
        const job = await getRenderById(renderId);
        if (cancelled) {
          return;
        }

        setRenderJob(job);
        setError(null);
      } catch (requestError) {
        if (cancelled) {
          return;
        }

        setError(
          requestError instanceof Error
            ? requestError.message
            : "Nao foi possivel consultar o status da renderizacao.",
        );
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void loadRenderJob();
    const intervalId = window.setInterval(() => {
      void loadRenderJob();
    }, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [renderId]);

  const statusLabel =
    renderJob?.status === "completed"
      ? "Concluida"
      : renderJob?.status === "failed"
        ? "Falhou"
        : renderJob?.status === "processing"
          ? "Processando"
          : "Na fila";

  return (
    <main className="min-h-screen bg-[#050f22] px-4 py-10 text-slate-100">
      <div className="mx-auto w-full max-w-2xl rounded-2xl border border-[#1a2a46] bg-[#08142b] p-6">
        <h1 className="text-2xl font-semibold">Acompanhamento de renderizacao</h1>
        <p className="mt-2 text-sm text-slate-400">Render ID: {renderId || "-"}</p>

        {isLoading ? (
          <p className="mt-6 text-sm text-slate-300">Consultando status...</p>
        ) : null}

        {error ? (
          <p className="mt-6 rounded-md border border-rose-500/40 bg-rose-950/30 px-3 py-2 text-sm text-rose-200">
            {error}
          </p>
        ) : null}

        {renderJob ? (
          <div className="mt-6 space-y-3 rounded-lg border border-[#1d3052] bg-[#0b1b36] p-4 text-sm">
            <p>
              <span className="text-slate-400">Status:</span> {statusLabel}
            </p>
            <p>
              <span className="text-slate-400">Criado em:</span> {formatDate(renderJob.createdAt)}
            </p>
            <p>
              <span className="text-slate-400">Concluido em:</span> {formatDate(renderJob.completedAt)}
            </p>
            <p>
              <span className="text-slate-400">Atualizacao automatica:</span> a cada 30 segundos
            </p>
            {renderJob.outputUrl ? (
              <Link
                href={renderJob.outputUrl}
                className="inline-flex rounded-md bg-blue-600 px-3 py-1.5 font-medium text-white hover:bg-blue-500"
              >
                Abrir arquivo renderizado
              </Link>
            ) : null}
          </div>
        ) : null}

        <div className="mt-6">
          <Link
            href="/"
            className="inline-flex rounded-md border border-[#2a3e63] px-3 py-1.5 text-sm hover:bg-[#122546]"
          >
            Voltar para projetos
          </Link>
        </div>
      </div>
    </main>
  );
}
