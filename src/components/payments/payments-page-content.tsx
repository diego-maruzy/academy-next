"use client";

import { PaymentPlanAdminCard } from "@/components/payments/payment-plan-admin-card";
import { Card, CardContent } from "@/components/ui/card";
import type { PaymentPlanSetting } from "@/types/payment";

type PaymentsPageContentProps = {
  plans: PaymentPlanSetting[];
};

export function PaymentsPageContent({ plans }: PaymentsPageContentProps) {
  const monthPlan = plans.find((plan) => plan.billing_type === "PREMIUM_MONTH");
  const yearPlan = plans.find((plan) => plan.billing_type === "PREMIUM_YEAR");

  return (
    <div className="grid gap-8">
      <header className="grid gap-2">
        <h1 className="text-3xl font-semibold text-white">
          Páginas de pagamento
        </h1>
        <p className="max-w-3xl text-sm text-slate-400">
          Documentação técnica das páginas públicas de checkout da Checkmate
          Property — links, configuração e payloads enviados para a API.
        </p>
      </header>

      {plans.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-sm text-slate-400">
            Nenhum plano configurado. Execute{" "}
            <code className="text-emerald-300">supabase/payment-plan-settings.sql</code>{" "}
            no Supabase.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 xl:grid-cols-2">
          {monthPlan ? <PaymentPlanAdminCard plan={monthPlan} /> : null}
          {yearPlan ? <PaymentPlanAdminCard plan={yearPlan} /> : null}
        </div>
      )}

      <section className="grid gap-4">
        <h2 className="text-xl font-semibold text-white">Endpoint e headers</h2>
        <Card>
          <CardContent className="grid gap-3 pt-6 font-mono text-sm text-slate-300">
            <p>
              <span className="text-slate-500">POST</span>{" "}
              https://api.checkmateproperty.com/api/auth/register/premium
            </p>
            <p>Content-Type: application/json</p>
            <p>Accept: application/json</p>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4">
        <h2 className="text-xl font-semibold text-white">Respostas esperadas</h2>
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardContent className="grid gap-2 pt-6 text-sm text-slate-300">
              <p className="font-medium text-emerald-300">2xx — Sucesso</p>
              <pre className="overflow-auto rounded-xl bg-slate-950/70 p-3 font-mono text-xs">
                {`{
  "message": "Conta criada com sucesso."
}`}
              </pre>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="grid gap-2 pt-6 text-sm text-slate-300">
              <p className="font-medium text-red-300">4xx — Erro de validação</p>
              <pre className="overflow-auto rounded-xl bg-slate-950/70 p-3 font-mono text-xs">
                {`{
  "errorCode": "CARD_DECLINED",
  "message": "Cartão recusado."
}`}
              </pre>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="grid gap-4">
        <h2 className="text-xl font-semibold text-white">Notas</h2>
        <Card>
          <CardContent className="grid gap-3 pt-6 text-sm text-slate-300">
            <p>
              O checkout público envia o payload para{" "}
              <code className="text-emerald-300">/api/checkout/register</code>,
              que encaminha para o endpoint configurado sem expor credenciais no
              frontend.
            </p>
            <p>
              A senha padrão é enviada automaticamente no payload e não aparece
              no formulário.
            </p>
            <p>
              Webhooks recebem apenas dados seguros (nome, e-mail, telefone,
              billingType, priceId e cupom). Dados de cartão nunca são enviados
              para webhooks.
            </p>
            <p className="text-amber-200/90">
              Em produção, recomenda-se migrar para Stripe Checkout ou Stripe
              Payment Element para reduzir escopo PCI.
            </p>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
