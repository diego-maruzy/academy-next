export type PaymentPlanSetting = {
  id: string;
  billing_type: string;
  plan_name: string;
  price_label: string;
  compare_price_label: string | null;
  discount_label: string | null;
  price_id: string;
  public_path: string;
  api_endpoint: string;
  redirect_url: string | null;
  webhook_1_url: string | null;
  webhook_2_url: string | null;
  show_coupon_field: boolean;
  default_coupon: string | null;
  default_password: string;
  status: string;
  created_at: string;
  updated_at: string;
};

export type BillingType = "PREMIUM_MONTH" | "PREMIUM_YEAR";
