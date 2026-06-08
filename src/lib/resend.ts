import "server-only";

import { Resend } from "resend";

const DEFAULT_FROM = "onboarding@resend.dev";

let resendClient: Resend | null = null;

export function getResendApiKey(): string | null {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  return apiKey || null;
}

export function getResendFromEmail(): string {
  return (
    process.env.RESEND_FROM_EMAIL?.trim() ||
    process.env.CHECKMATE_EMAIL_FROM?.trim() ||
    DEFAULT_FROM
  );
}

export function getResendClient(): Resend | null {
  const apiKey = getResendApiKey();

  if (!apiKey) {
    return null;
  }

  if (!resendClient) {
    resendClient = new Resend(apiKey);
  }

  return resendClient;
}
