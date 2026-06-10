import { NextResponse, type NextRequest } from "next/server";
import { createHostSsoSession } from "@/lib/auth/create-host-sso-session";
import {
  getOidcTestTokensFromEnv,
  isOidcHostTestEnabled,
} from "@/lib/auth/oidc-test-config";
import { validateHostTokens } from "@/lib/auth/host-token-validation";
import { extractApplicationRolesFromPayload } from "@/lib/auth/keycloak-roles";
import {
  buildSafeTokenLog,
  decodeJwtPayloadUnsafe,
  extractDecodedClaims,
} from "@/lib/auth/token-inspect";
import { getStudentPostLoginPath } from "@/lib/auth/route-guard";

export const dynamic = "force-dynamic";

type SafeTestFailure = {
  ok: false;
  code: string;
  message: string;
  validationStep: string;
  failedTokenType?: "access_token" | "id_token";
  tokenKid?: string;
  tokenAlg?: string;
  jwksUrl?: string;
  issuer?: string;
  aud?: string | string[];
  azp?: string;
  hasEmail: boolean;
  hasSub: boolean;
  rolesFound: string[];
  tokenRefreshAttempted?: boolean;
  tokenRefreshSucceeded?: boolean;
  refreshErrorCode?: string;
};

function buildSafeFailure(
  input: Omit<SafeTestFailure, "ok">,
): SafeTestFailure {
  return { ok: false, ...input };
}

function getDecodedSummary(tokens: {
  accessToken?: string;
  idToken?: string;
}) {
  const idPayload = tokens.idToken
    ? decodeJwtPayloadUnsafe(tokens.idToken)
    : null;
  const accessPayload = tokens.accessToken
    ? decodeJwtPayloadUnsafe(tokens.accessToken)
    : null;

  const identity = idPayload ?? accessPayload;
  const identityClaims = extractDecodedClaims(identity);
  const rolesFound = [
    ...extractApplicationRolesFromPayload(idPayload).applicationRoles,
    ...extractApplicationRolesFromPayload(accessPayload).applicationRoles,
  ];

  return {
    issuer: identityClaims?.iss,
    aud: identityClaims?.aud,
    azp: identityClaims?.azp,
    hasEmail: Boolean(identityClaims?.email),
    hasSub: Boolean(identityClaims?.sub),
    rolesFound: [...new Set(rolesFound.filter(Boolean))],
  };
}

function disabledResponse() {
  return NextResponse.json(
    buildSafeFailure({
      code: "test_disabled",
      message: "Host SSO test route is disabled.",
      validationStep: "env_check",
      hasEmail: false,
      hasSub: false,
      rolesFound: [],
    }),
    { status: 404 },
  );
}

export async function GET(request: NextRequest) {
  if (!isOidcHostTestEnabled()) {
    return disabledResponse();
  }

  const userAgent = request.headers.get("user-agent") ?? "";
  const envTokens = getOidcTestTokensFromEnv();

  if (
    !envTokens.hasAccessToken &&
    !envTokens.hasIdToken &&
    !envTokens.hasRefreshToken
  ) {
    const summary = getDecodedSummary({});

    console.info("[oidc/test-host-session] missing_env_tokens", {
      client: userAgent.slice(0, 80),
      hasAccessToken: false,
      hasIdToken: false,
    });

    return NextResponse.json(
      buildSafeFailure({
        code: "missing_env_tokens",
        message:
          "Defina OIDC_TEST_ACCESS_TOKEN, OIDC_TEST_ID_TOKEN e/ou OIDC_TEST_REFRESH_TOKEN no ambiente.",
        validationStep: "token_presence",
        hasEmail: summary.hasEmail,
        hasSub: summary.hasSub,
        rolesFound: summary.rolesFound,
      }),
      { status: 400 },
    );
  }

  const tokenLog = buildSafeTokenLog({
    accessToken: envTokens.accessToken,
    idToken: envTokens.idToken,
    refreshToken: envTokens.refreshToken,
  });

  console.info("[oidc/test-host-session] start", {
    client: userAgent.slice(0, 80),
    hasAccessToken: tokenLog.hasAccessToken,
    hasIdToken: tokenLog.hasIdToken,
    hasRefreshToken: tokenLog.hasRefreshToken,
    accessTokenLength: tokenLog.accessTokenLength,
    idTokenLength: tokenLog.idTokenLength,
  });

  const validation = await validateHostTokens({
    idToken: envTokens.idToken,
    accessToken: envTokens.accessToken,
    refreshToken: envTokens.refreshToken,
    tokenSource: "env",
  });

  const summary = getDecodedSummary({
    accessToken: envTokens.accessToken,
    idToken: envTokens.idToken,
  });

  if (!validation.ok) {
    console.info("[oidc/test-host-session] validation_failed", {
      code: validation.code,
      validationStep: "jwt_validation",
      tokenRefreshAttempted: validation.tokenRefreshAttempted ?? false,
      tokenRefreshSucceeded: validation.tokenRefreshSucceeded ?? false,
      refreshErrorCode: validation.refreshErrorCode,
      issuer: summary.issuer,
      aud: summary.aud,
      azp: summary.azp,
      hasEmail: summary.hasEmail,
      hasSub: summary.hasSub,
      rolesFound: summary.rolesFound,
    });

    return NextResponse.json(
      buildSafeFailure({
        code: validation.code,
        message: validation.message,
        validationStep: "jwt_validation",
        failedTokenType: validation.failedTokenType,
        tokenKid: validation.tokenKid,
        tokenAlg: validation.tokenAlg,
        jwksUrl: validation.jwksUrl,
        issuer: validation.issuer ?? summary.issuer,
        aud: validation.aud ?? summary.aud,
        azp: validation.azp ?? summary.azp,
        hasEmail: validation.hasEmail ?? summary.hasEmail,
        hasSub: validation.hasSub ?? summary.hasSub,
        rolesFound: summary.rolesFound,
        tokenRefreshAttempted: validation.tokenRefreshAttempted,
        tokenRefreshSucceeded: validation.tokenRefreshSucceeded,
        refreshErrorCode: validation.refreshErrorCode,
      }),
      { status: 401 },
    );
  }

  const destination =
    request.nextUrl.searchParams.get("next") ?? getStudentPostLoginPath();

  const sessionResult = await createHostSsoSession({
    sub: validation.sub,
    email: validation.email,
    name: validation.name,
    roles: validation.roles.roles,
    ignoredRoles: validation.roles.ignoredRoles,
    appRole: validation.roles.appRole,
    rolesSource: "host-tokens",
  });

  if (!sessionResult.ok) {
    console.info("[oidc/test-host-session] session_failed", {
      validationStep: "session_create",
      error: sessionResult.error,
      detail: sessionResult.detail,
      issuer: validation.claims.iss,
      aud: validation.claims.aud,
      azp: validation.claims.azp,
      hasEmail: Boolean(validation.email),
      hasSub: Boolean(validation.sub),
      rolesFound: validation.roles.roles,
    });

    return NextResponse.json(
      buildSafeFailure({
        code: sessionResult.error,
        message: "Tokens válidos, mas a sessão Auth.js não foi criada.",
        validationStep: "session_create",
        issuer: validation.claims.iss,
        aud: validation.claims.aud,
        azp: validation.claims.azp,
        hasEmail: Boolean(validation.email),
        hasSub: Boolean(validation.sub),
        rolesFound: validation.roles.roles,
      }),
      { status: 401 },
    );
  }

  console.info("[oidc/test-host-session] success", {
    validationStep: "redirect_dashboard",
    destination,
    provider: "oidc-host",
    rolesSource: "host-tokens",
    appRole: validation.roles.appRole,
    rolesFound: validation.roles.roles,
    hasEmail: Boolean(validation.email),
    hasSub: Boolean(validation.sub),
    tokenRefreshAttempted: validation.tokenRefreshAttempted ?? false,
    tokenRefreshSucceeded: validation.tokenRefreshSucceeded ?? false,
  });

  return NextResponse.redirect(new URL(destination, request.url));
}
