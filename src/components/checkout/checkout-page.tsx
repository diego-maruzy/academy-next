import { CheckoutForm } from "@/components/checkout/checkout-form";
import { CheckoutPageShell } from "@/components/checkout/checkout-page-shell";
import { PaymentStepHeader } from "@/components/checkout/payment-step-header";
import { PlanStickyCard } from "@/components/checkout/plan-sticky-card";
import type { PaymentPlanSetting } from "@/types/payment";

type CheckoutPageProps = {
  plan: PaymentPlanSetting;
  loginUrl: string;
};

export function CheckoutPage({ plan, loginUrl }: CheckoutPageProps) {
  return (
    <CheckoutPageShell>
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-start lg:gap-10 xl:gap-12">
        <div className="min-w-0 space-y-6 lg:space-y-8">
          <PaymentStepHeader />

          <div className="lg:hidden">
            <PlanStickyCard plan={plan} />
          </div>

          <CheckoutForm plan={plan} loginUrl={loginUrl} />
        </div>

        <div className="hidden lg:sticky lg:top-8 lg:block lg:self-start">
          <PlanStickyCard plan={plan} />
        </div>
      </div>
    </CheckoutPageShell>
  );
}
