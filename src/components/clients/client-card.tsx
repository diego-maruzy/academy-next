"use client";

import type { ComponentType } from "react";
import { CalendarDays, Clock3, Copy, Eye, Phone } from "lucide-react";
import { useState } from "react";
import { ClientActionsMenu } from "@/components/clients/client-actions-menu";
import { ClientPlanBadge } from "@/components/clients/client-plan-badge";
import { StatusBadge } from "@/components/crm/status-badge";
import { Button } from "@/components/ui/button";
import { getInitials } from "@/components/ui/admin-modal";
import { cn } from "@/lib/utils";
import type { Client } from "./types";

type ClientCardProps = {
  client: Client;
  onView: (client: Client) => void;
  onEdit: (client: Client) => void;
  onDelete: (client: Client) => void;
};

export function ClientCard({
  client,
  onView,
  onEdit,
  onDelete,
}: ClientCardProps) {
  const [copied, setCopied] = useState(false);

  async function copyEmail() {
    try {
      await navigator.clipboard.writeText(client.email);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      window.alert("Não foi possível copiar o e-mail.");
    }
  }

  return (
    <article className="group flex flex-col rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition hover:border-white/15 hover:bg-white/[0.04]">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-blue-400/20 bg-blue-400/10 text-sm font-semibold text-blue-200">
          {getInitials(client.fullName)}
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold leading-5 text-white">
            {client.fullName}
          </h3>
          <button
            type="button"
            onClick={copyEmail}
            className="mt-0.5 inline-flex max-w-full items-center gap-1.5 text-left text-xs text-slate-400 transition hover:text-slate-200"
            title="Clique para copiar o e-mail"
          >
            <span className="break-all">{client.email}</span>
            <Copy className="h-3 w-3 shrink-0 opacity-60" />
          </button>
          {copied ? (
            <p className="mt-1 text-[11px] text-emerald-300">E-mail copiado</p>
          ) : null}
        </div>

        <ClientActionsMenu
          onEdit={() => onEdit(client)}
          onDelete={() => onDelete(client)}
        />
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <StatusBadge status={client.status} label={client.statusLabel} />
        <ClientPlanBadge
          label={client.planLabel}
          isPremium={client.isPremium}
        />
        <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-medium text-slate-400">
          {client.sourceLabel}
        </span>
        <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-medium text-slate-400">
          {client.roleLabel}
        </span>
      </div>

      <div className="mt-3 grid gap-2 text-xs text-slate-400 sm:grid-cols-2">
        {client.phone && client.phone !== "—" ? (
          <MetaRow icon={Phone} label="Telefone" value={client.phone} />
        ) : null}
        <MetaRow
          icon={CalendarDays}
          label="Cadastro"
          value={client.createdAt}
        />
        <MetaRow
          icon={Clock3}
          label="Último acesso"
          value={client.lastSignInAt}
          className="sm:col-span-2"
        />
      </div>

      <div className="mt-4 flex items-center justify-between gap-2 border-t border-white/[0.06] pt-3">
        <Button
          type="button"
          variant="secondary"
          className="h-8 px-3 text-xs"
          onClick={() => onView(client)}
        >
          <Eye className="mr-1.5 h-3.5 w-3.5" />
          Ver ficha
        </Button>
      </div>
    </article>
  );
}

function MetaRow({
  icon: Icon,
  label,
  value,
  className,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Icon className="h-3.5 w-3.5 shrink-0 text-slate-500" />
      <span className="text-slate-500">{label}:</span>
      <span className="text-slate-300">{value}</span>
    </div>
  );
}
