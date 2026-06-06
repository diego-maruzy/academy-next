"use client";

import { useState, useTransition } from "react";
import { Check, Copy, RefreshCw, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatDateTime } from "@/lib/admin-labels";
import type { WebhookConnectionView } from "@/lib/webhooks-data";
import { cn } from "@/lib/utils";

type WebhookCardProps = {
  webhook: WebhookConnectionView;
  onEdit: (webhook: WebhookConnectionView) => void;
  onDelete: (webhook: WebhookConnectionView) => Promise<string | null>;
  onRegenerateSecret: (webhook: WebhookConnectionView) => Promise<string | null>;
  onToggleStatus: (
    webhook: WebhookConnectionView,
    status: "active" | "inactive",
  ) => Promise<string | null>;
};

export function WebhookCard({
  webhook,
  onEdit,
  onDelete,
  onRegenerateSecret,
  onToggleStatus,
}: WebhookCardProps) {
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const active = webhook.status === "active";

  async function copyUrl() {
    await navigator.clipboard.writeText(webhook.url);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  function handleToggleStatus() {
    setError(null);
    startTransition(async () => {
      const toggleError = await onToggleStatus(
        webhook,
        active ? "inactive" : "active",
      );

      if (toggleError) {
        setError(toggleError);
      }
    });
  }

  function handleRegenerateSecret() {
    const confirmed = window.confirm(
      "Regenerar o token desta conexão? Integrações antigas precisarão do novo token.",
    );

    if (!confirmed) {
      return;
    }

    setError(null);
    startTransition(async () => {
      const regenerateError = await onRegenerateSecret(webhook);

      if (regenerateError) {
        setError(regenerateError);
        return;
      }

      window.alert("Token regenerado com sucesso.");
    });
  }

  function handleDelete() {
    const confirmed = window.confirm(
      "Tem certeza que deseja excluir esta conexão? Esta ação não pode ser desfeita.",
    );

    if (!confirmed) {
      return;
    }

    setError(null);
    startTransition(async () => {
      const deleteError = await onDelete(webhook);

      if (deleteError) {
        setError(deleteError);
      }
    });
  }

  return (
    <Card className="overflow-hidden">
      <CardContent className="grid gap-5 pt-6">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-xl font-semibold text-white">
                {webhook.name}
              </h3>
              <Badge>{webhook.role}</Badge>
              <span
                className={cn(
                  "rounded-full border px-2.5 py-1 text-xs font-semibold",
                  active
                    ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
                    : "border-white/10 bg-white/5 text-slate-400",
                )}
              >
                {active ? "Ativo" : "Inativo"}
              </span>
            </div>

            <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-400">
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
                {webhook.total_events} disparos
              </span>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
                Sucessos: {webhook.success_events}
              </span>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
                Erros: {webhook.error_events}
              </span>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
                Último disparo: {formatDateTime(webhook.last_event_at)}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleToggleStatus}
            disabled={pending}
            className={cn(
              "flex h-8 w-14 items-center rounded-full border p-1 transition",
              active
                ? "border-emerald-400/30 bg-emerald-400/20"
                : "border-white/10 bg-white/5",
            )}
            aria-label={active ? "Desativar webhook" : "Ativar webhook"}
          >
            <span
              className={cn(
                "h-5 w-5 rounded-full bg-white transition",
                active && "translate-x-6 bg-emerald-300",
              )}
            />
          </button>
        </div>

        <div className="grid gap-3 rounded-2xl border border-white/10 bg-slate-950/70 p-3 md:grid-cols-[1fr_auto] md:items-center">
          <code className="overflow-x-auto whitespace-nowrap text-sm text-slate-300 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {webhook.url}
          </code>
          <Button type="button" variant="secondary" onClick={copyUrl}>
            {copied ? (
              <Check className="mr-2 h-4 w-4" />
            ) : (
              <Copy className="mr-2 h-4 w-4" />
            )}
            {copied ? "Copiado" : "Copiar"}
          </Button>
        </div>

        {error ? (
          <p className="text-sm text-red-300">{error}</p>
        ) : null}

        <div className="flex flex-wrap gap-3">
          <Button
            type="button"
            variant="secondary"
            disabled={pending}
            onClick={() => onEdit(webhook)}
          >
            Editar
          </Button>
          <Button
            type="button"
            variant="secondary"
            disabled={pending}
            onClick={handleRegenerateSecret}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Regenerar token
          </Button>
          <Button
            type="button"
            variant="danger"
            disabled={pending}
            onClick={handleDelete}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Excluir
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
