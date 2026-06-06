"use client";

/**
 * Esta integração envia cartão para API própria e aumenta escopo PCI.
 * Recomendado migrar para Stripe Checkout ou Stripe Payment Element.
 * Não armazenar cartão no localStorage ou sessionStorage.
 * Não salvar cartão. Não logar CVC. Não enviar cartão para webhooks.
 */

import { useEffect, useState } from "react";
import { CheckCircle2, CreditCard, Loader2, Lock, MapPin, User } from "lucide-react";
import { checkoutBrandGradientClass } from "@/components/checkout/checkout-theme";
import { PaymentSectionCard } from "@/components/checkout/payment-section-card";
import { SecurityBadges } from "@/components/checkout/security-badges";
import type { PaymentPlanSetting } from "@/types/payment";
import { cn } from "@/lib/utils";

type CheckoutFormProps = {
  plan: PaymentPlanSetting;
  loginUrl: string;
};

type FormState = {
  cardNumber: string;
  cardName: string;
  expMonth: string;
  expYear: string;
  cvc: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  name: string;
  email: string;
  phone: string;
  coupon: string;
};

type SuccessState = {
  message: string;
  email: string;
};

const inputClass = cn(
  "h-[54px] w-full rounded-xl border border-[#E2E8F0] bg-white px-4 text-sm text-slate-900 outline-none transition",
  "placeholder:text-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20",
);

function FieldLabel({
  children,
  required,
}: {
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <span className="text-sm font-medium text-slate-700">
      {children}
      {required ? <span className="ml-0.5 text-red-500">*</span> : null}
    </span>
  );
}

function formatCardNumber(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 16);
  return digits.replace(/(\d{4})(?=\d)/g, "$1 ").trim();
}

function digitsOnly(value: string, maxLength: number) {
  return value.replace(/\D/g, "").slice(0, maxLength);
}

function normalizeExpYear(value: string) {
  const digits = digitsOnly(value, 4);
  if (digits.length === 2) {
    return `20${digits}`;
  }

  return digits;
}

function getSubmitLabel(billingType: string) {
  if (billingType === "PREMIUM_YEAR") {
    return "Assinar anual";
  }

  return "Assinar mensal";
}

export function CheckoutForm({ plan, loginUrl }: CheckoutFormProps) {
  const [form, setForm] = useState<FormState>({
    cardNumber: "",
    cardName: "",
    expMonth: "",
    expYear: "",
    cvc: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    country: "US",
    name: "",
    email: "",
    phone: "",
    coupon: plan.default_coupon ?? "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<SuccessState | null>(null);

  useEffect(() => {
    if (!success || !plan.redirect_url) {
      return;
    }

    const timer = window.setTimeout(() => {
      window.location.href = plan.redirect_url!;
    }, 3000);

    return () => window.clearTimeout(timer);
  }, [success, plan.redirect_url]);

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (submitting) {
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/checkout/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          billingType: plan.billing_type,
          name: form.name,
          email: form.email,
          phone: form.phone,
          coupon: plan.show_coupon_field
            ? form.coupon || null
            : form.coupon || plan.default_coupon || null,
          card: {
            number: form.cardNumber.replace(/\s+/g, ""),
            name: form.cardName,
            expMonth: form.expMonth,
            expYear: normalizeExpYear(form.expYear),
            cvc: form.cvc,
            address: form.address,
            city: form.city,
            state: form.state,
            zipCode: form.zipCode,
            country: form.country,
          },
        }),
      });

      const result = (await response.json()) as {
        success?: boolean;
        message?: string;
      };

      if (!response.ok || !result.success) {
        setError(
          result.message ?? "Erro inesperado ao processar pagamento.",
        );
        return;
      }

      setSuccess({
        message: result.message ?? "Conta ativada com sucesso.",
        email: form.email,
      });
    } catch {
      setError("Erro inesperado ao processar pagamento.");
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="rounded-[22px] border border-emerald-200 bg-white p-6 text-center shadow-sm sm:p-10">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
          <CheckCircle2 className="h-8 w-8" />
        </div>
        <h2 className="mt-5 text-2xl font-bold text-slate-900">
          Pagamento processado com sucesso
        </h2>
        <p className="mt-3 text-slate-600">{success.message}</p>
        <p className="mt-2 text-sm text-slate-500">
          Conta criada para{" "}
          <strong className="text-slate-700">{success.email}</strong> no plano{" "}
          <strong className="text-slate-700">{plan.plan_name}</strong>.
        </p>
        <a
          href={loginUrl}
          className={cn(
            "mt-8 inline-flex h-14 w-full max-w-sm items-center justify-center rounded-xl px-6 text-sm font-bold text-white transition",
            checkoutBrandGradientClass,
            "shadow-lg shadow-sky-500/20",
            "hover:brightness-105 active:scale-[0.99]",
          )}
        >
          Acessar plataforma
        </a>
        {plan.redirect_url ? (
          <p className="mt-4 text-xs text-slate-500">
            Você será redirecionado em instantes.
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-5 sm:gap-6">
      <PaymentSectionCard
        title="Dados do cartão"
        icon={CreditCard}
        badge="Criptografia ponta a ponta"
      >
        <label className="grid gap-2">
          <FieldLabel required>Número do cartão</FieldLabel>
          <input
            className={inputClass}
            inputMode="numeric"
            autoComplete="cc-number"
            placeholder="0000 0000 0000 0000"
            value={form.cardNumber}
            onChange={(event) =>
              updateField("cardNumber", formatCardNumber(event.target.value))
            }
            required
          />
        </label>

        <label className="grid gap-2">
          <FieldLabel required>Nome conforme escrito no cartão</FieldLabel>
          <input
            className={inputClass}
            autoComplete="cc-name"
            placeholder="NOME COMO NO CARTÃO"
            value={form.cardName}
            onChange={(event) => updateField("cardName", event.target.value)}
            required
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <FieldLabel required>Validade (MM/AA)</FieldLabel>
            <div className="grid grid-cols-2 gap-3">
              <input
                className={inputClass}
                inputMode="numeric"
                autoComplete="cc-exp-month"
                placeholder="MM"
                value={form.expMonth}
                onChange={(event) =>
                  updateField("expMonth", digitsOnly(event.target.value, 2))
                }
                required
              />
              <input
                className={inputClass}
                inputMode="numeric"
                autoComplete="cc-exp-year"
                placeholder="AA"
                value={form.expYear}
                onChange={(event) =>
                  updateField("expYear", digitsOnly(event.target.value, 2))
                }
                required
              />
            </div>
          </div>

          <label className="grid gap-2">
            <FieldLabel required>CVC</FieldLabel>
            <input
              className={inputClass}
              inputMode="numeric"
              autoComplete="cc-csc"
              placeholder="123"
              value={form.cvc}
              onChange={(event) =>
                updateField("cvc", digitsOnly(event.target.value, 4))
              }
              required
            />
          </label>
        </div>
      </PaymentSectionCard>

      <PaymentSectionCard title="Dados de cobrança" icon={MapPin}>
        <label className="grid gap-2">
          <FieldLabel required>Endereço</FieldLabel>
          <input
            className={inputClass}
            autoComplete="street-address"
            placeholder="123 Main Street"
            value={form.address}
            onChange={(event) => updateField("address", event.target.value)}
            required
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-2">
            <FieldLabel required>Cidade</FieldLabel>
            <input
              className={inputClass}
              autoComplete="address-level2"
              placeholder="Miami"
              value={form.city}
              onChange={(event) => updateField("city", event.target.value)}
              required
            />
          </label>
          <label className="grid gap-2">
            <FieldLabel required>Estado</FieldLabel>
            <input
              className={inputClass}
              autoComplete="address-level1"
              placeholder="FL"
              value={form.state}
              onChange={(event) => updateField("state", event.target.value)}
              required
            />
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-2">
            <FieldLabel required>ZIP Code</FieldLabel>
            <input
              className={inputClass}
              autoComplete="postal-code"
              placeholder="33101"
              value={form.zipCode}
              onChange={(event) => updateField("zipCode", event.target.value)}
              required
            />
          </label>
          <label className="grid gap-2">
            <FieldLabel required>País (código ISO)</FieldLabel>
            <input
              className={inputClass}
              autoComplete="country"
              placeholder="US"
              value={form.country}
              onChange={(event) => updateField("country", event.target.value)}
              required
            />
          </label>
        </div>
      </PaymentSectionCard>

      <PaymentSectionCard title="Dados de contato" icon={User}>
        <label className="grid gap-2">
          <FieldLabel required>Nome completo</FieldLabel>
          <input
            className={inputClass}
            autoComplete="name"
            placeholder="John Doe"
            value={form.name}
            onChange={(event) => updateField("name", event.target.value)}
            required
          />
        </label>

        <label className="grid gap-2">
          <FieldLabel required>E-mail</FieldLabel>
          <input
            className={inputClass}
            type="email"
            autoComplete="email"
            placeholder="john@example.com"
            value={form.email}
            onChange={(event) => updateField("email", event.target.value)}
            required
          />
        </label>

        <label className="grid gap-2">
          <FieldLabel required>WhatsApp / Telefone</FieldLabel>
          <input
            className={inputClass}
            type="tel"
            autoComplete="tel"
            placeholder="+1 305 555 1234"
            value={form.phone}
            onChange={(event) => updateField("phone", event.target.value)}
            required
          />
        </label>

        {plan.show_coupon_field ? (
          <label className="grid gap-2">
            <FieldLabel>Cupom de desconto</FieldLabel>
            <input
              className={inputClass}
              value={form.coupon}
              onChange={(event) => updateField("coupon", event.target.value)}
              placeholder="FLIP10"
            />
          </label>
        ) : null}
      </PaymentSectionCard>

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-700 sm:px-5">
          <p className="font-medium">Não foi possível processar o pagamento</p>
          <p className="mt-1 text-red-600">{error}</p>
        </div>
      ) : null}

      <div className="grid gap-4">
        <button
          type="submit"
          disabled={submitting}
          className={cn(
            "inline-flex h-[60px] w-full items-center justify-center gap-2.5 rounded-xl px-6 text-base font-bold text-white transition",
            checkoutBrandGradientClass,
            "shadow-lg shadow-sky-500/25",
            "hover:brightness-105 active:scale-[0.99]",
            "disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:brightness-100",
          )}
        >
          {submitting ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Processando...
            </>
          ) : (
            <>
              <Lock className="h-4 w-4" />
              {getSubmitLabel(plan.billing_type)}
            </>
          )}
        </button>

        <p className="text-center text-xs leading-relaxed text-slate-500 sm:text-sm">
          Ao continuar, você concorda em ser cobrado conforme o plano
          selecionado.
        </p>

        <SecurityBadges variant="light" className="justify-center" />
      </div>
    </form>
  );
}
