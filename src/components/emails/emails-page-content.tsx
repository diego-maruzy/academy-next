"use client";

import { useMemo, useState } from "react";
import { EmailPlanConfigCard } from "@/components/emails/email-plan-config-card";
import { EmailSendLogsTable } from "@/components/emails/email-send-logs-table";
import { Card, CardContent } from "@/components/ui/card";
import type { EmailSendLog, EmailTemplate } from "@/types/email";
import { cn } from "@/lib/utils";

type EmailsPageContentProps = {
  templates: EmailTemplate[];
  logs: EmailSendLog[];
};

type BillingTab = "PREMIUM_MONTH" | "PREMIUM_YEAR";

export function EmailsPageContent({ templates, logs }: EmailsPageContentProps) {
  const [activeTab, setActiveTab] = useState<BillingTab>("PREMIUM_MONTH");

  const monthCustomer = templates.find(
    (item) =>
      item.billing_type === "PREMIUM_MONTH" && item.template_type === "customer",
  );
  const monthTeam = templates.find(
    (item) =>
      item.billing_type === "PREMIUM_MONTH" && item.template_type === "team",
  );
  const yearCustomer = templates.find(
    (item) =>
      item.billing_type === "PREMIUM_YEAR" && item.template_type === "customer",
  );
  const yearTeam = templates.find(
    (item) =>
      item.billing_type === "PREMIUM_YEAR" && item.template_type === "team",
  );

  const activePair = useMemo(() => {
    if (activeTab === "PREMIUM_YEAR") {
      return {
        billingType: "PREMIUM_YEAR" as const,
        planTitle: "Plano Anual",
        customer: yearCustomer,
        team: yearTeam,
      };
    }

    return {
      billingType: "PREMIUM_MONTH" as const,
      planTitle: "Plano Mensal",
      customer: monthCustomer,
      team: monthTeam,
    };
  }, [activeTab, monthCustomer, monthTeam, yearCustomer, yearTeam]);

  return (
    <div className="grid gap-8">
      <header className="grid gap-2">
        <h1 className="text-3xl font-semibold text-white">E-mails</h1>
        <p className="max-w-3xl text-sm text-slate-400">
          Configure os e-mails enviados após cada pagamento aprovado. Cada
          plano tem um e-mail para o cliente e um e-mail para a equipe.
        </p>
      </header>

      <div className="inline-flex w-full max-w-md rounded-2xl border border-white/10 bg-slate-950/50 p-1">
        {(
          [
            { id: "PREMIUM_MONTH" as const, label: "Mensal" },
            { id: "PREMIUM_YEAR" as const, label: "Anual" },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold transition",
              activeTab === tab.id
                ? "bg-white/10 text-white shadow-lg shadow-black/20"
                : "text-slate-400 hover:text-white",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {templates.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-sm text-slate-400">
            Nenhum template encontrado. Execute{" "}
            <code className="text-emerald-300">supabase/email-templates.sql</code>{" "}
            no Supabase.
          </CardContent>
        </Card>
      ) : activePair.customer && activePair.team ? (
        <EmailPlanConfigCard
          billingType={activePair.billingType}
          planTitle={activePair.planTitle}
          customerTemplate={activePair.customer}
          teamTemplate={activePair.team}
        />
      ) : (
        <Card>
          <CardContent className="pt-6 text-sm text-slate-400">
            Templates incompletos para este plano. Verifique os registros no
            Supabase.
          </CardContent>
        </Card>
      )}

      <EmailSendLogsTable logs={logs} />

      <Card>
        <CardContent className="grid gap-3 pt-6 text-sm text-slate-300">
          <h2 className="text-lg font-semibold text-white">Sobre o envio</h2>
          <p>
            Envios reais usam Resend quando{" "}
            <code className="text-emerald-300">RESEND_API_KEY</code> está
            configurada. Sem domínio verificado, o remetente pode usar{" "}
            <code className="text-emerald-300">onboarding@resend.dev</code>.
            Configure{" "}
            <code className="text-emerald-300">RESEND_FROM_EMAIL</code> com seu
            domínio quando estiver verificado.
          </p>
          <p>
            Variáveis suportadas no assunto e corpo:{" "}
            <code className="text-sky-300">
              {"{{name}}"}, {"{{email}}"}, {"{{phone}}"}, {"{{plan}}"},{" "}
              {"{{planLabel}}"}, {"{{price}}"}, {"{{coupon}}"}
            </code>
            .
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
