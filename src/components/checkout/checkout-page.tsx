import { CheckoutForm } from "@/components/checkout/checkout-form";
import type { PaymentPlanSetting } from "@/types/payment";

type CheckoutPageProps = {
  plan: PaymentPlanSetting;
  loginUrl: string;
};

export function CheckoutPage({ plan, loginUrl }: CheckoutPageProps) {
  return (
    <div className="mx-auto grid w-full max-w-5xl gap-8 lg:grid-cols-[1fr_1.1fr] lg:items-start">
      <aside className="rounded-2xl border border-white/10 bg-white/5 p-6 text-white backdrop-blur">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">
          Checkmate Property
        </p>
        <h1 className="mt-3 text-3xl font-semibold">{plan.plan_name}</h1>
        <p className="mt-2 text-2xl font-semibold text-emerald-300">
          {plan.price_label}
        </p>
        {plan.compare_price_label ? (
          <p className="mt-1 text-sm text-slate-400 line-through">
            {plan.compare_price_label}
          </p>
        ) : null}
        {plan.discount_label ? (
          <p className="mt-2 inline-flex rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-sm font-medium text-amber-200">
            {plan.discount_label}
          </p>
        ) : null}
        <ul className="mt-6 grid gap-2 text-sm text-slate-300">
          <li>Acesso completo à plataforma Checkmate Property</li>
          <li>Ativação imediata após confirmação do pagamento</li>
          <li>Suporte para operações imobiliárias premium</li>
        </ul>
      </aside>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl shadow-black/20 sm:p-8">
        <CheckoutForm plan={plan} loginUrl={loginUrl} />
      </div>
    </div>
  );
}
