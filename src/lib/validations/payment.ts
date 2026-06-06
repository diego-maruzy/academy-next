import { z } from "zod";

const optionalUrl = z.preprocess(
  (value) => (value === "" || value === undefined ? null : value),
  z.string().url("Informe uma URL válida.").nullable().optional(),
);

const optionalText = z.preprocess(
  (value) => (value === "" || value === undefined ? null : value),
  z.string().nullable().optional(),
);

export const paymentPlanSettingsUpdateSchema = z.object({
  redirect_url: optionalUrl,
  webhook_1_url: optionalUrl,
  webhook_2_url: optionalUrl,
  show_coupon_field: z.boolean(),
  default_coupon: optionalText,
});

export type PaymentPlanSettingsUpdateInput = z.infer<
  typeof paymentPlanSettingsUpdateSchema
>;

const cardSchema = z.object({
  number: z.string().min(13, "Informe o número do cartão."),
  name: z.string().min(2, "Informe o nome no cartão."),
  expMonth: z
    .string()
    .regex(/^\d{2}$/, "Informe o mês com 2 dígitos."),
  expYear: z
    .string()
    .regex(/^\d{4}$/, "Informe o ano com 4 dígitos."),
  cvc: z
    .string()
    .regex(/^\d{3,4}$/, "Informe um CVC válido."),
  address: z.string().min(3, "Informe o endereço."),
  city: z.string().min(2, "Informe a cidade."),
  state: z.string().min(2, "Informe o estado."),
  zipCode: z.string().min(4, "Informe o ZIP Code."),
  country: z.string().min(2, "Informe o país."),
});

export const checkoutPayloadSchema = z.object({
  name: z.string().min(2, "Informe o nome completo."),
  email: z.email("Informe um e-mail válido."),
  phone: z.string().min(8, "Informe o telefone."),
  password: z.string().min(1, "Senha obrigatória."),
  card: cardSchema,
  priceId: z.string().min(1, "priceId obrigatório."),
  billingType: z.enum(["PREMIUM_MONTH", "PREMIUM_YEAR"]),
  coupon: optionalText,
});

export const checkoutFormSchema = z.object({
  billingType: z.enum(["PREMIUM_MONTH", "PREMIUM_YEAR"]),
  name: z.string().min(2, "Informe o nome completo."),
  email: z.email("Informe um e-mail válido."),
  phone: z.string().min(8, "Informe o telefone."),
  coupon: optionalText,
  card: cardSchema,
});

export type CheckoutFormInput = z.infer<typeof checkoutFormSchema>;
