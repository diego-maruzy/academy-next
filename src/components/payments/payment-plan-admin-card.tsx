"use client";

import { useMemo, useState, useTransition } from "react";
import {
  Check,
  Copy,
  ExternalLink,
  FlaskConical,
  Save,
} from "lucide-react";
import {
  testPaymentWebhook,
  updatePaymentPlanSetting,
} from "@/lib/actions/payment-settings-actions";
import { getPublicCheckoutUrl } from "@/lib/checkout/public-url";
import { getExampleCheckoutPayload } from "@/lib/payment-settings-data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/form-controls";
import type { PaymentPlanSetting } from "@/types/payment";
import { cn } from "@/lib/utils";

type PaymentPlanAdminCardProps = {
  plan: PaymentPlanSetting;
};

type CopyKey = "url" | "billingType" | "priceId" | "endpoint" | "password" | "json";

function ConfigCopyRow({
  label,
  value,
  copyKey,
  copiedKey,
  onCopy,
}: {
  label: string;
  value: string;
  copyKey: CopyKey;
  copiedKey: CopyKey | null;
  onCopy: (value: string, key: CopyKey) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-xl border border-white/10 bg-slate-950/50 px-3 py-2">
      <div className="min-w-0">
        <p className="text-xs uppercase tracking-wide text-slate-500">
          {label}
        </p>
        <p className="truncate font-mono text-xs text-slate-300">{value}</p>
      </div>
      <Button
        type="button"
        variant="ghost"
        className="h-8 shrink-0 px-2"
        onClick={() => onCopy(value, copyKey)}
      >
        {copiedKey === copyKey ? (
          <Check className="h-4 w-4 text-emerald-400" />
        ) : (
          <Copy className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
}

export function PaymentPlanAdminCard({ plan }: PaymentPlanAdminCardProps) {
  const [redirectUrl, setRedirectUrl] = useState(plan.redirect_url ?? "");
  const [webhook1, setWebhook1] = useState(plan.webhook_1_url ?? "");
  const [webhook2, setWebhook2] = useState(plan.webhook_2_url ?? "");
  const [showCouponField, setShowCouponField] = useState(plan.show_coupon_field);
  const [defaultCoupon, setDefaultCoupon] = useState(plan.default_coupon ?? "");
  const [copiedKey, setCopiedKey] = useState<CopyKey | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const publicUrl = getPublicCheckoutUrl(plan.public_path);
  const examplePayload = useMemo(
    () =>
      getExampleCheckoutPayload(
        plan.billing_type as "PREMIUM_MONTH" | "PREMIUM_YEAR",
      ),
    [plan.billing_type],
  );
  const exampleJson = useMemo(
    () => JSON.stringify(examplePayload, null, 2),
    [examplePayload],
  );

  async function copyText(value: string, key: CopyKey) {
    await navigator.clipboard.writeText(value);
    setCopiedKey(key);
    window.setTimeout(() => setCopiedKey(null), 1800);
  }

  function handleSave() {
    setError(null);
    setFeedback(null);

    startTransition(async () => {
      const result = await updatePaymentPlanSetting(plan.id, {
        redirect_url: redirectUrl || null,
        webhook_1_url: webhook1 || null,
        webhook_2_url: webhook2 || null,
        show_coupon_field: showCouponField,
        default_coupon: defaultCoupon || null,
      });

      if (!result.success) {
        setError(result.error ?? "Não foi possível salvar.");
        return;
      }

      setFeedback("Configurações salvas com sucesso.");
    });
  }

  function handleTestWebhooks() {
    setError(null);
    setFeedback(null);

    startTransition(async () => {
      const result = await testPaymentWebhook(plan.id);

      if (!result.success) {
        const details = result.results
          ?.map((item) => `${item.url}: ${item.message ?? "falhou"}`)
          .join(" | ");

        setError(
          details
            ? `${result.error ?? "Falha nos webhooks."} ${details}`
            : (result.error ?? "Falha ao testar webhooks."),
        );
        return;
      }

      setFeedback("Webhooks testados com sucesso.");
    });
  }

  return (
    <Card className="h-full border-white/10 bg-white/5">
      <CardContent className="grid gap-5 pt-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-white">{plan.plan_name}</h2>
            <p className="mt-1 text-lg text-emerald-300">{plan.price_label}</p>
            {plan.compare_price_label ? (
              <p className="text-sm text-slate-400 line-through">
                {plan.compare_price_label}
              </p>
            ) : null}
            {plan.discount_label ? (
              <p className="text-sm font-medium text-amber-300">
                {plan.discount_label}
              </p>
            ) : null}
          </div>
          <Badge>{plan.billing_type}</Badge>
        </div>

        <div className="rounded-xl border border-white/10 bg-slate-950/40 p-3">
          <p className="text-xs uppercase tracking-wide text-slate-500">
            Link público
          </p>
          <p className="mt-1 break-all font-mono text-sm text-slate-200">
            {publicUrl}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              type="button"
              variant="secondary"
              className="gap-2"
              onClick={() => copyText(publicUrl, "url")}
            >
              {copiedKey === "url" ? (
                <Check className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
              Copiar URL
            </Button>
            <a href={plan.public_path} target="_blank" rel="noreferrer">
              <Button type="button" variant="ghost" className="gap-2">
                <ExternalLink className="h-4 w-4" />
                Abrir
              </Button>
            </a>
          </div>
        </div>

        <div className="grid gap-4">
          <Field label="URL de redirect após sucesso">
            <Input
              value={redirectUrl}
              onChange={(event) => setRedirectUrl(event.target.value)}
              placeholder="https://checkmateproperty.com/pay-obrigado/"
            />
          </Field>
          <Field label="Webhook 1 (opcional)">
            <Input
              value={webhook1}
              onChange={(event) => setWebhook1(event.target.value)}
              placeholder="https://..."
            />
          </Field>
          <Field label="Webhook 2 (opcional)">
            <Input
              value={webhook2}
              onChange={(event) => setWebhook2(event.target.value)}
              placeholder="https://..."
            />
          </Field>
          <label className="flex items-center gap-3 text-sm text-slate-200">
            <input
              type="checkbox"
              checked={showCouponField}
              onChange={(event) => setShowCouponField(event.target.checked)}
              className="h-4 w-4 rounded border-white/20 bg-slate-950"
            />
            Mostrar campo de cupom na página
          </label>
          <Field label="Cupom padrão (opcional)">
            <Input
              value={defaultCoupon}
              onChange={(event) => setDefaultCoupon(event.target.value)}
              placeholder="FLIP10"
            />
          </Field>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            className="gap-2"
            disabled={pending}
            onClick={handleSave}
          >
            <Save className="h-4 w-4" />
            Salvar
          </Button>
          <Button
            type="button"
            variant="secondary"
            className="gap-2"
            disabled={pending}
            onClick={handleTestWebhooks}
          >
            <FlaskConical className="h-4 w-4" />
            Testar webhooks
          </Button>
        </div>

        {feedback ? (
          <p className="text-sm text-emerald-300">{feedback}</p>
        ) : null}
        {error ? <p className="text-sm text-red-300">{error}</p> : null}

        <div className="grid gap-2">
          <p className="text-sm font-medium text-slate-200">Configuração fixa</p>
          <ConfigCopyRow
            label="billingType"
            value={plan.billing_type}
            copyKey="billingType"
            copiedKey={copiedKey}
            onCopy={copyText}
          />
          <ConfigCopyRow
            label="priceId"
            value={plan.price_id}
            copyKey="priceId"
            copiedKey={copiedKey}
            onCopy={copyText}
          />
          <ConfigCopyRow
            label="endpoint"
            value={plan.api_endpoint}
            copyKey="endpoint"
            copiedKey={copiedKey}
            onCopy={copyText}
          />
          <ConfigCopyRow
            label="password"
            value={plan.default_password}
            copyKey="password"
            copiedKey={copiedKey}
            onCopy={copyText}
          />
        </div>

        <div className="grid gap-2">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-medium text-slate-200">
              Payload de exemplo
            </p>
            <Button
              type="button"
              variant="ghost"
              className="h-8 gap-2 px-2"
              onClick={() => copyText(exampleJson, "json")}
            >
              {copiedKey === "json" ? (
                <Check className="h-4 w-4 text-emerald-400" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
              Copiar JSON
            </Button>
          </div>
          <pre
            className={cn(
              "max-h-72 overflow-auto rounded-xl border border-white/10",
              "bg-slate-950/70 p-3 font-mono text-xs text-slate-300",
            )}
          >
            {exampleJson}
          </pre>
        </div>
      </CardContent>
    </Card>
  );
}
