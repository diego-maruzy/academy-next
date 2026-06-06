"use client";

/**
 * Esta integração envia cartão para API própria e aumenta escopo PCI.
 * Recomendado migrar para Stripe Checkout ou Stripe Payment Element.
 * Não armazenar cartão no localStorage ou sessionStorage.
 */

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
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

const inputClass =
  "h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20";

function formatCardNumber(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 16);
  return digits.replace(/(\d{4})(?=\d)/g, "$1 ").trim();
}

function digitsOnly(value: string, maxLength: number) {
  return value.replace(/\D/g, "").slice(0, maxLength);
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
            expYear: form.expYear,
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
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-8 text-center shadow-xl">
        <h2 className="text-2xl font-semibold text-emerald-900">
          Pagamento confirmado
        </h2>
        <p className="mt-3 text-slate-700">{success.message}</p>
        <p className="mt-2 text-sm text-slate-600">
          Conta criada para <strong>{success.email}</strong> no plano{" "}
          <strong>{plan.plan_name}</strong>.
        </p>
        <a
          href={loginUrl}
          className="mt-6 inline-flex h-11 items-center justify-center rounded-xl bg-emerald-600 px-5 text-sm font-semibold text-white transition hover:bg-emerald-500"
        >
          Acessar plataforma
        </a>
        {plan.redirect_url ? (
          <p className="mt-4 text-xs text-slate-500">
            Redirecionando em alguns segundos...
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-8">
      <section className="grid gap-4">
        <h3 className="text-lg font-semibold text-slate-900">Dados do cartão</h3>
        <label className="grid gap-2 text-sm font-medium text-slate-700">
          Número do cartão
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
        <label className="grid gap-2 text-sm font-medium text-slate-700">
          Nome no cartão
          <input
            className={inputClass}
            autoComplete="cc-name"
            placeholder="NOME COMO NO CARTÃO"
            value={form.cardName}
            onChange={(event) => updateField("cardName", event.target.value)}
            required
          />
        </label>
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="grid gap-2 text-sm font-medium text-slate-700">
            Expiração (mês)
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
          </label>
          <label className="grid gap-2 text-sm font-medium text-slate-700">
            Expiração (ano)
            <input
              className={inputClass}
              inputMode="numeric"
              autoComplete="cc-exp-year"
              placeholder="AAAA"
              value={form.expYear}
              onChange={(event) =>
                updateField("expYear", digitsOnly(event.target.value, 4))
              }
              required
            />
          </label>
          <label className="grid gap-2 text-sm font-medium text-slate-700">
            CVC
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
      </section>

      <section className="grid gap-4">
        <h3 className="text-lg font-semibold text-slate-900">
          Endereço de cobrança
        </h3>
        <label className="grid gap-2 text-sm font-medium text-slate-700">
          Endereço
          <input
            className={inputClass}
            autoComplete="street-address"
            value={form.address}
            onChange={(event) => updateField("address", event.target.value)}
            required
          />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-2 text-sm font-medium text-slate-700">
            Cidade
            <input
              className={inputClass}
              autoComplete="address-level2"
              value={form.city}
              onChange={(event) => updateField("city", event.target.value)}
              required
            />
          </label>
          <label className="grid gap-2 text-sm font-medium text-slate-700">
            Estado
            <input
              className={inputClass}
              autoComplete="address-level1"
              value={form.state}
              onChange={(event) => updateField("state", event.target.value)}
              required
            />
          </label>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-2 text-sm font-medium text-slate-700">
            ZIP Code
            <input
              className={inputClass}
              autoComplete="postal-code"
              value={form.zipCode}
              onChange={(event) => updateField("zipCode", event.target.value)}
              required
            />
          </label>
          <label className="grid gap-2 text-sm font-medium text-slate-700">
            País
            <input
              className={inputClass}
              autoComplete="country"
              value={form.country}
              onChange={(event) => updateField("country", event.target.value)}
              required
            />
          </label>
        </div>
      </section>

      <section className="grid gap-4">
        <h3 className="text-lg font-semibold text-slate-900">Dados de contato</h3>
        <label className="grid gap-2 text-sm font-medium text-slate-700">
          Nome completo
          <input
            className={inputClass}
            autoComplete="name"
            value={form.name}
            onChange={(event) => updateField("name", event.target.value)}
            required
          />
        </label>
        <label className="grid gap-2 text-sm font-medium text-slate-700">
          E-mail
          <input
            className={inputClass}
            type="email"
            autoComplete="email"
            value={form.email}
            onChange={(event) => updateField("email", event.target.value)}
            required
          />
        </label>
        <label className="grid gap-2 text-sm font-medium text-slate-700">
          Telefone
          <input
            className={inputClass}
            type="tel"
            autoComplete="tel"
            value={form.phone}
            onChange={(event) => updateField("phone", event.target.value)}
            required
          />
        </label>
        {plan.show_coupon_field ? (
          <label className="grid gap-2 text-sm font-medium text-slate-700">
            Cupom de desconto
            <input
              className={inputClass}
              value={form.coupon}
              onChange={(event) => updateField("coupon", event.target.value)}
              placeholder="FLIP10"
            />
          </label>
        ) : null}
      </section>

      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={submitting}
        className={cn(
          "inline-flex h-12 items-center justify-center gap-2 rounded-xl",
          "bg-emerald-600 text-sm font-semibold text-white transition",
          "hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-70",
        )}
      >
        {submitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Processando...
          </>
        ) : (
          "Ativar minha conta"
        )}
      </button>
    </form>
  );
}
