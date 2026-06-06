export function getWebhookPublicUrl(slug: string) {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ??
    "http://localhost:3000";

  return `${baseUrl}/api/public/webhooks/jet/${slug}`;
}
