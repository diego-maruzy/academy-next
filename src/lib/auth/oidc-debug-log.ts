import { summarizeUserAgent } from "@/lib/auth/detect-webview";

type OidcLoginAccessLog = {
  userAgent: string;
  hasSession: boolean;
  destination?: string;
};

type OidcStartLog = {
  userAgent: string;
  hasSession: boolean;
  destination: string;
  redirected: boolean;
};

export function logOidcLoginAccess(input: OidcLoginAccessLog) {
  console.info("[oidc/login] access", {
    client: summarizeUserAgent(input.userAgent),
    hasSession: input.hasSession,
    destination: input.destination ?? "/dashboard",
  });
}

export function logOidcStart(input: OidcStartLog) {
  console.info("[oidc/start] oauth", {
    client: summarizeUserAgent(input.userAgent),
    hasSession: input.hasSession,
    destination: input.destination,
    redirected: input.redirected,
  });
}
