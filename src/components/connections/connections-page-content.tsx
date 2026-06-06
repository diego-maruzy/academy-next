"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Plus } from "lucide-react";
import { ConnectionForm } from "@/components/connections/connection-form";
import { WebhookCard } from "@/components/connections/webhook-card";
import { WebhookInstructions } from "@/components/connections/webhook-instructions";
import { WebhookStats } from "@/components/connections/webhook-stats";
import { ButtonLink } from "@/components/ui/button";
import {
  createWebhookConnection,
  deleteWebhookConnection,
  regenerateWebhookSecret,
  updateWebhookConnection,
} from "@/lib/actions/webhook-actions";
import type { ProgramOption } from "@/lib/admin-labels";
import type {
  WebhookConnectionView,
  WebhookStatsSummary,
} from "@/lib/webhooks-data";
import type { WebhookConnectionInput } from "@/lib/validations/webhook";

type ConnectionsPageContentProps = {
  webhooks: WebhookConnectionView[];
  stats: WebhookStatsSummary;
  programs: ProgramOption[];
};

export function ConnectionsPageContent({
  webhooks,
  stats,
  programs,
}: ConnectionsPageContentProps) {
  const router = useRouter();
  const [editingConnection, setEditingConnection] =
    useState<WebhookConnectionView | null>(null);

  async function saveConnection(
    values: WebhookConnectionInput,
    connectionId?: string,
  ) {
    const result = connectionId
      ? await updateWebhookConnection(connectionId, values)
      : await createWebhookConnection(values);

    if (!result.success) {
      return {
        error: result.error ?? "Não foi possível salvar a conexão.",
      };
    }

    router.refresh();
    return {
      error: null,
      secretToken: result.secretToken,
    };
  }

  async function deleteConnection(webhook: WebhookConnectionView) {
    const result = await deleteWebhookConnection(webhook.id);

    if (!result.success) {
      return result.error ?? "Não foi possível excluir a conexão.";
    }

    if (editingConnection?.id === webhook.id) {
      setEditingConnection(null);
    }

    router.refresh();
    return null;
  }

  async function regenerateSecret(webhook: WebhookConnectionView) {
    const result = await regenerateWebhookSecret(webhook.id);

    if (!result.success) {
      return result.error ?? "Não foi possível regenerar o token.";
    }

    router.refresh();
    return null;
  }

  async function toggleStatus(
    webhook: WebhookConnectionView,
    status: "active" | "inactive",
  ) {
    const result = await updateWebhookConnection(webhook.id, {
      name: webhook.name,
      slug: webhook.slug,
      description: webhook.description,
      type: webhook.type,
      role: webhook.role,
      program_id: webhook.program_id,
      status,
      secret_token: webhook.secret_token,
    });

    if (!result.success) {
      return result.error ?? "Não foi possível atualizar o status.";
    }

    router.refresh();
    return null;
  }

  return (
    <div className="grid gap-8">
      <section className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-300">
            Integrações
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white">
            Conexões
          </h1>
          <p className="mt-2 max-w-3xl text-slate-400">
            Crie webhooks de entrada para integrar formulários, checkouts e
            sistemas externos ao Academy.
          </p>
        </div>
        <ButtonLink href="#nova-conexao">
          <Plus className="mr-2 h-4 w-4" />
          Nova conexão
        </ButtonLink>
      </section>

      <WebhookStats stats={stats} />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="grid gap-6">
          <WebhookInstructions />

          <section className="grid gap-4">
            <div>
              <h2 className="text-2xl font-semibold text-white">
                Webhooks de entrada
              </h2>
              <p className="mt-2 text-sm text-slate-400">
                URLs públicas preparadas para receber JSON via POST.
              </p>
            </div>

            {webhooks.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center">
                <p className="text-lg font-semibold text-white">
                  Nenhuma conexão cadastrada
                </p>
                <p className="mt-2 text-sm text-slate-400">
                  Crie a primeira conexão para receber leads via webhook.
                </p>
              </div>
            ) : (
              webhooks.map((webhook) => (
                <WebhookCard
                  key={webhook.id}
                  webhook={webhook}
                  onEdit={setEditingConnection}
                  onDelete={deleteConnection}
                  onRegenerateSecret={regenerateSecret}
                  onToggleStatus={toggleStatus}
                />
              ))
            )}
          </section>
        </div>

        <aside id="nova-conexao" className="scroll-mt-24">
          <ConnectionForm
            key={editingConnection?.id ?? "new"}
            programs={programs}
            editingConnection={editingConnection}
            onCancelEdit={() => setEditingConnection(null)}
            onSave={saveConnection}
          />
        </aside>
      </div>
    </div>
  );
}
