import { notFound } from "next/navigation";
import { CheckoutPage } from "@/components/checkout/checkout-page";
import { getPaymentPlanSettingByBillingType } from "@/lib/payment-settings-data";

export const dynamic = "force-dynamic";

export default async function PayMonthPage() {
  const plan = await getPaymentPlanSettingByBillingType("PREMIUM_MONTH");

  if (!plan) {
    notFound();
  }

  const loginUrl =
    process.env.NEXT_PUBLIC_CHECKOUT_LOGIN_URL ??
    "https://app.checkmateproperty.com/#/login";

  return <CheckoutPage plan={plan} loginUrl={loginUrl} />;
}
