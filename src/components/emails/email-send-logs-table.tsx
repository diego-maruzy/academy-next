"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { EmailSendLog } from "@/types/email";
import { cn } from "@/lib/utils";

type EmailSendLogsTableProps = {
  logs: EmailSendLog[];
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function StatusBadge({ status }: { status: EmailSendLog["status"] }) {
  if (status === "sent") {
    return (
      <Badge className="border-emerald-400/20 bg-emerald-400/10 text-emerald-300">
        sent
      </Badge>
    );
  }

  if (status === "failed") {
    return (
      <Badge className="border-red-400/20 bg-red-400/10 text-red-300">
        failed
      </Badge>
    );
  }

  return (
    <Badge className="border-slate-500/30 bg-slate-500/10 text-slate-300">
      stub
    </Badge>
  );
}

function billingLabel(value: string | null) {
  if (value === "PREMIUM_MONTH") return "Mensal";
  if (value === "PREMIUM_YEAR") return "Anual";
  return value ?? "—";
}

function templateLabel(value: string | null) {
  if (value === "customer") return "Cliente";
  if (value === "team") return "Equipe";
  return value ?? "—";
}

export function EmailSendLogsTable({ logs }: EmailSendLogsTableProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleRefresh() {
    startTransition(() => {
      router.refresh();
    });
  }

  return (
    <section className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold text-white">Logs de envio</h2>
        <Button
          type="button"
          variant="secondary"
          className="gap-2"
          disabled={pending}
          onClick={handleRefresh}
        >
          <RefreshCw className={cn("h-4 w-4", pending && "animate-spin")} />
          Atualizar
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          {logs.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-400">
              Nenhum envio registrado ainda.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-[760px] w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-slate-400">
                    <th className="px-3 py-3 font-semibold">Data</th>
                    <th className="px-3 py-3 font-semibold">Plano</th>
                    <th className="px-3 py-3 font-semibold">Tipo</th>
                    <th className="px-3 py-3 font-semibold">Destinatário</th>
                    <th className="px-3 py-3 font-semibold">Assunto</th>
                    <th className="px-3 py-3 font-semibold">Status</th>
                    <th className="px-3 py-3 font-semibold">Erro</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr
                      key={log.id}
                      className="border-b border-white/5 text-slate-300"
                    >
                      <td className="px-3 py-4 whitespace-nowrap">
                        {formatDate(log.created_at)}
                      </td>
                      <td className="px-3 py-4">
                        {billingLabel(log.billing_type)}
                      </td>
                      <td className="px-3 py-4">
                        {templateLabel(log.template_type)}
                      </td>
                      <td className="px-3 py-4">{log.recipient}</td>
                      <td className="max-w-[220px] truncate px-3 py-4">
                        {log.subject ?? "—"}
                      </td>
                      <td className="px-3 py-4">
                        <StatusBadge status={log.status} />
                      </td>
                      <td className="max-w-[180px] truncate px-3 py-4 text-red-300/80">
                        {log.error_message ?? "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
