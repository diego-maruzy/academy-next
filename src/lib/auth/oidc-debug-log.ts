import { summarizeUserAgent } from "@/lib/auth/detect-webview";
import {
  buildSafeTokenLog,
  type HostTokenValidationCode,
} from "@/lib/auth/token-inspect";

type OidcLoginAccessLog = {
  userAgent: string;
  hasSession: boolean;
  destination?: string;
  tokenPresence?: ReturnType<typeof buildSafeTokenLog>;
};

type OidcSessionLog = {
  userAgent: string;
  hasSession: boolean;
  destination: string;
  source?: string;
  validationCode?: HostTokenValidationCode;
  clientId?: string;
};

export function logOidcLoginAccess(input: OidcLoginAccessLog) {
  console.info("[oidc/login] access", {
    client: summarizeUserAgent(input.userAgent),
    hasSession: input.hasSession,
    destination: input.destination ?? "/dashboard",
    tokens: input.tokenPresence,
  });
}

export function logOidcSession(input: OidcSessionLog) {
  console.info("[oidc/session]", {
    client: summarizeUserAgent(input.userAgent),
    hasSession: input.hasSession,
    destination: input.destination,
    source: input.source ?? "unknown",
    validationCode: input.validationCode ?? "ok",
    clientId: input.clientId,
  });
}

export function logOidcStart(input: OidcSessionLog & { redirected: boolean }) {
  console.info("[oidc/start] oauth", {
    client: summarizeUserAgent(input.userAgent),
    hasSession: input.hasSession,
    destination: input.destination,
    redirected: input.redirected,
    source: input.source ?? "authjs",
  });
}

export function logHostTokenValidation(input: {
  userAgent: string;
  code: HostTokenValidationCode;
  clientId?: string;
  tokenLog: ReturnType<typeof buildSafeTokenLog>;
}) {
  console.info("[oidc/host-tokens] validation", {
    client: summarizeUserAgent(input.userAgent),
    code: input.code,
    clientId: input.clientId,
    tokens: input.tokenLog,
  });
}
