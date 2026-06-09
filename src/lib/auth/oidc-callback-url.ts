import { getOidcAuthCallbackPath } from "@/lib/auth/route-guard";

export function buildOidcSignInCallbackPath(destination: string) {
  const params = new URLSearchParams({ next: destination });
  return `${getOidcAuthCallbackPath()}?${params.toString()}`;
}

export function buildOidcStartUrl(destination: string) {
  const params = new URLSearchParams({ next: destination });
  return `/api/oidc/start?${params.toString()}`;
}
