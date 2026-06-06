import { PaymentsPageContent } from "@/components/payments/payments-page-content";
import { getPaymentPlanSettings } from "@/lib/payment-settings-data";

export const dynamic = "force-dynamic";

export default async function PaymentsPage() {
  const plans = await getPaymentPlanSettings();

  return <PaymentsPageContent plans={plans} />;
}
