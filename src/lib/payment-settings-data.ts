import { createSupabaseReadServerClient } from "@/lib/supabase/server";
import type { PaymentPlanSetting } from "@/types/payment";

const paymentPlanColumns =
  "id, billing_type, plan_name, price_label, compare_price_label, discount_label, price_id, public_path, api_endpoint, redirect_url, webhook_1_url, webhook_2_url, show_coupon_field, default_coupon, default_password, status, created_at, updated_at";

export async function getPaymentPlanSettings(): Promise<PaymentPlanSetting[]> {
  const supabase = await createSupabaseReadServerClient();

  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from("payment_plan_settings")
    .select(paymentPlanColumns)
    .order("billing_type", { ascending: true });

  if (error) {
    console.error(
      "[payment-settings] Erro ao buscar planos:",
      error.message,
    );
    return [];
  }

  return (data ?? []) as PaymentPlanSetting[];
}

export async function getPaymentPlanSettingByBillingType(
  billingType: string,
): Promise<PaymentPlanSetting | null> {
  const supabase = await createSupabaseReadServerClient();

  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("payment_plan_settings")
    .select(paymentPlanColumns)
    .eq("billing_type", billingType)
    .eq("status", "active")
    .maybeSingle();

  if (error) {
    console.error(
      "[payment-settings] Erro ao buscar plano:",
      error.message,
    );
    return null;
  }

  return (data as PaymentPlanSetting | null) ?? null;
}

export function getExampleCheckoutPayload(
  billingType: "PREMIUM_MONTH" | "PREMIUM_YEAR",
) {
  if (billingType === "PREMIUM_MONTH") {
    return {
      name: "John Doe",
      email: "john@example.com",
      phone: "+1 305 555 1234",
      password: "fliphouse2026",
      card: {
        number: "4242424242424242",
        name: "JOHN DOE",
        expMonth: "12",
        expYear: "2028",
        cvc: "123",
        address: "123 Main St",
        city: "Miami",
        state: "FL",
        zipCode: "33101",
        country: "US",
      },
      priceId: "price_1MtweJIOSU7dsJH9ZsLGvC8n",
      billingType: "PREMIUM_MONTH",
      coupon: "FLIP10",
    };
  }

  return {
    name: "John Doe",
    email: "john@example.com",
    phone: "+1 305 555 1234",
    password: "fliphouse2026",
    card: {
      number: "4242424242424242",
      name: "JOHN DOE",
      expMonth: "12",
      expYear: "2028",
      cvc: "123",
      address: "123 Main St",
      city: "Miami",
      state: "FL",
      zipCode: "33101",
      country: "US",
    },
    priceId: "price_1MtweJIOSU7dsJH9EnwDsDC3",
    billingType: "PREMIUM_YEAR",
    coupon: "FLIP10",
  };
}
