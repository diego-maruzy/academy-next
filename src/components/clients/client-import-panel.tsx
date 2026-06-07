"use client";

import { useRef, useState, useTransition } from "react";
import { FileUp, Upload } from "lucide-react";
import { importClientsFromJson } from "@/lib/actions/client-import-actions";
import type { ClientImportSummary } from "@/lib/import/import-clients";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ClientImportPanelProps = {
  className?: string;
  compact?: boolean;
  onSuccess?: () => void;
};

export function ClientImportPanel({
  className,
  compact = false,
  onSuccess,
}: ClientImportPanelProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();
  const [summary, setSummary] = useState<ClientImportSummary | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    setParseError(null);
    setSummary(null);

    if (!file) {
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result ?? "[]")) as unknown;
        startTransition(async () => {
          const result = await importClientsFromJson(parsed);
          setSummary(result);

          if (result.success) {
            onSuccess?.();
          }
        });
      } catch {
        setParseError("Arquivo JSON inválido.");
      } finally {
        event.target.value = "";
      }
    };

    reader.onerror = () => {
      setParseError("Não foi possível ler o arquivo.");
      event.target.value = "";
    };

    reader.readAsText(file);
  }

  return (
    <section
      className={cn(
        "rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6",
        className,
      )}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        {compact ? null : (
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
              Importação
            </p>
            <h2 className="mt-2 text-lg font-semibold text-white">
              Importar clientes via JSON
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-slate-400">
              Envie um arquivo .json com a lista de clientes. Duplicatas por email
              são atualizadas sem reduzir permissões premium existentes.
            </p>
          </div>
        )}

        <div className="flex shrink-0 flex-col gap-2 sm:ml-auto">
          <input
            ref={inputRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={handleFileChange}
          />
          <Button
            type="button"
            variant="secondary"
            className="min-h-[44px]"
            disabled={pending}
            onClick={() => inputRef.current?.click()}
          >
            <Upload className="mr-2 h-4 w-4" />
            {pending ? "Importando..." : "Selecionar JSON"}
          </Button>
        </div>
      </div>

      {parseError ? (
        <p className="mt-4 rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {parseError}
        </p>
      ) : null}

      {summary ? (
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <Stat label="Processados" value={summary.total} />
          <Stat label="Criados" value={summary.created} accent="text-emerald-300" />
          <Stat label="Atualizados" value={summary.updated} accent="text-sky-300" />
          <Stat label="Ignorados" value={summary.skipped} accent="text-amber-200" />
          <Stat label="Erros" value={summary.errors.length} accent="text-red-300" />
        </div>
      ) : null}

      {summary && summary.errors.length > 0 ? (
        <div className="mt-4 rounded-xl border border-white/10 bg-slate-950/40 p-4">
          <p className="text-sm font-semibold text-white">Erros</p>
          <ul className="mt-2 space-y-1 text-sm text-slate-400">
            {summary.errors.map((item) => (
              <li key={`${item.email}-${item.message}`}>
                <span className="text-slate-300">{item.email}</span>:{" "}
                {item.message}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {summary && summary.success ? (
        <p className="mt-4 inline-flex items-center gap-2 text-sm text-emerald-300">
          <FileUp className="h-4 w-4" />
          Importação concluída com sucesso.
        </p>
      ) : null}
    </section>
  );
}

function Stat({
  label,
  value,
  accent = "text-white",
}: {
  label: string;
  value: number;
  accent?: string;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-slate-950/40 px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
        {label}
      </p>
      <p className={cn("mt-1 text-2xl font-bold", accent)}>{value}</p>
    </div>
  );
}
