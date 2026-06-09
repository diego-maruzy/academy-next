import { summarizeUserAgent } from "@/lib/auth/detect-webview";
import type { EmbeddedContext } from "@/lib/embedded-params";
import {
  buildSafeTokenLog,
  type HostTokenValidationCode,
} from "@/lib/auth/token-inspect";

type OidcLoginAccessLog = {
  userAgent: string;
  hasSession: boolean;
  destination?: string;
  pathname?: string;
  embedded?: EmbeddedContext;
  tokenPresence?: ReturnType<typeof buildSafeTokenLog>;
};

type OidcSessionLog = {
  userAgent: string;
  hasSession: boolean;
  destination: string;
  source?: string;
  validationCode?: HostTokenValidationCode;
  clientId?: string;
  embedded?: EmbeddedContext;
  pathname?: string;
};

export function logOidcLoginAccess(input: OidcLoginAccessLog) {
  console.info("[oidc/login] access", {
    client: summarizeUserAgent(input.userAgent),
    hasSession: input.hasSession,
    pathname: input.pathname ?? "/oidc/login",
    destination: input.destination ?? "/dashboard",
    embedded: input.embedded?.embedded ?? false,
    hasReturnUrl: Boolean(input.embedded?.returnUrl),
    tokens: input.tokenPresence,
  });
}

export function logOidcSession(input: OidcSessionLog) {
  console.info("[oidc/session]", {
    client: summarizeUserAgent(input.userAgent),
    hasSession: input.hasSession,
    pathname: input.pathname,
    destination: input.destination,
    source: input.source ?? "unknown",
    validationCode: input.validationCode ?? "ok",
    clientId: input.clientId,
    embedded: input.embedded?.embedded ?? false,
    hasReturnUrl: Boolean(input.embedded?.returnUrl),
    redirectedToDashboard: input.hasSession,
  });
}

export function logOidcStart(input: OidcSessionLog & { redirected: boolean }) {
  console.info("[oidc/start] oauth", {
    client: summarizeUserAgent(input.userAgent),
    hasSession: input.hasSession,
    destination: input.destination,
    redirected: input.redirected,
    source: input.source ?? "authjs",
    embedded: input.embedded?.embedded ?? false,
    hasReturnUrl: Boolean(input.embedded?.returnUrl),
  });
}

export function logHostTokenValidation(input: {
  userAgent: string;
  code: HostTokenValidationCode;
  clientId?: string;
  tokenLog: ReturnType<typeof buildSafeTokenLog>;
  embedded?: EmbeddedContext;
}) {
  console.info("[oidc/host-tokens] validation", {
    client: summarizeUserAgent(input.userAgent),
    code: input.code,
    clientId: input.clientId,
    embedded: input.embedded?.embedded ?? false,
    hasReturnUrl: Boolean(input.embedded?.returnUrl),
    tokens: input.tokenLog,
  });
}

export function logEmbeddedNavigation(input: {
  userAgent?: string;
  from: string;
  to: string;
  embedded?: EmbeddedContext;
  action: "dashboard" | "retry" | "return-host";
}) {
  console.info("[embedded] navigation", {
    client: summarizeUserAgent(input.userAgent ?? ""),
    from: input.from,
    to: input.to,
    action: input.action,
    embedded: input.embedded?.embedded ?? false,
    hasReturnUrl: Boolean(input.embedded?.returnUrl),
  });
}
