import { CHECKOUT_BRAND_GRADIENT } from "@/components/checkout/checkout-theme";
import { SecurityBadges } from "@/components/checkout/security-badges";
import type { PaymentPlanSetting } from "@/types/payment";
import { cn } from "@/lib/utils";

const INCLUDED_FEATURES = [
  "Checkmate Property Platform",
  "Deal Analysis",
  "COMPS & ARV",
  "Off-market Search",
  "Skip Trace",
  "PDF Reports",
  "Checkmate Academy",
  "Flip House 4.0",
  "New Construction",
] as const;

type PlanStickyCardProps = {
  plan: PaymentPlanSetting;
  className?: string;
};

function getPlanTitle(billingType: string) {
  if (billingType === "PREMIUM_YEAR") {
    return "Assine a Checkmate Property Anual";
  }

  return "Assine a Checkmate Property Mensal";
}

function getPlanTypeLabel(billingType: string) {
  if (billingType === "PREMIUM_YEAR") {
    return "PLANO ANUAL";
  }

  return "PLANO MENSAL";
}

export function PlanStickyCard({ plan, className }: PlanStickyCardProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[28px] p-6 text-white shadow-2xl shadow-sky-500/25 sm:p-7 md:p-8",
        className,
      )}
      style={{ background: CHECKOUT_BRAND_GRADIENT }}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
          backgroundSize: "18px 18px",
        }}
        aria-hidden
      />
      <div className="relative">
        <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-emerald-200/90 sm:text-[11px]">
          Checkmate Property
        </p>
        <h2 className="mt-3 text-xl font-bold leading-tight tracking-tight sm:text-2xl md:text-[1.65rem]">
          {getPlanTitle(plan.billing_type)}
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-white/75 sm:text-[15px]">
          Acesse a plataforma completa, o Academy e as ferramentas de análise
          imobiliária.
        </p>

        <div className="mt-6 rounded-2xl border border-white/15 bg-black/20 p-4 backdrop-blur-sm sm:mt-7 sm:p-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-sky-200">
            {getPlanTypeLabel(plan.billing_type)}
          </p>
          <div className="mt-2 flex flex-wrap items-end gap-2">
            <p className="text-2xl font-bold tracking-tight sm:text-3xl md:text-[2rem]">
              {plan.price_label}
            </p>
            {plan.discount_label ? (
              <span className="mb-1 rounded-full bg-amber-400 px-2.5 py-0.5 text-xs font-bold text-slate-950">
                {plan.discount_label}
              </span>
            ) : null}
          </div>
          {plan.compare_price_label ? (
            <p className="mt-1 text-sm text-white/50 line-through">
              {plan.compare_price_label}
            </p>
          ) : null}
        </div>

        <div className="mt-6 sm:mt-7">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/60">
            Tudo que está incluído
          </p>
          <ul className="mt-3 grid gap-2 sm:gap-2.5">
            {INCLUDED_FEATURES.map((feature) => (
              <li
                key={feature}
                className="flex items-start gap-2.5 text-sm text-white/90"
              >
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-300" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>

        <SecurityBadges
          variant="dark"
          className="mt-6 justify-center sm:mt-8"
        />
      </div>
    </div>
  );
}
