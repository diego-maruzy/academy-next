import type { JWTPayload } from "jose";
import {
  resolveKeycloakRolesFromAuthPayload,
  type ResolvedKeycloakRoles,
} from "@/lib/auth/keycloak-token";
import { getHostClientAuthorizationRule } from "@/lib/auth/keycloak-client-auth";
import { refreshKeycloakTokens } from "@/lib/auth/keycloak-token-refresh";
import {
  normalizeTokenFromEnv,
  normalizeTokenFromQuery,
} from "@/lib/auth/normalize-token";
import {
  decodeJwtPayloadUnsafe,
  extractDecodedClaims,
  type HostTokenValidationCode,
} from "@/lib/auth/token-inspect";
import {
  verifyKeycloakJwt,
  type KeycloakJwtVerifyError,
} from "@/lib/auth/verify-keycloak-jwt";

export type HostTokenRefreshMeta = {
  tokenRefreshAttempted?: boolean;
  tokenRefreshSucceeded?: boolean;
  refreshErrorCode?: string;
};

export type HostTokenValidationResult =
  | ({
      ok: true;
      sub: string;
      email: string;
      name: string;
      givenName?: string;
      familyName?: string;
      roles: ResolvedKeycloakRoles;
      idToken?: string;
      accessToken?: string;
      refreshToken?: string;
      clientId: string;
      claims: {
        iss: string;
        aud?: string | string[];
        azp?: string;
        exp?: number;
        iat?: number;
      };
    } & HostTokenRefreshMeta)
  | ({
      ok: false;
      code:
        | HostTokenValidationCode
        | "jwks_kid_not_found"
        | "refresh_token_expired_or_invalid"
        | "refresh_request_failed";
      message: string;
      details?: Record<string, unknown>;
      failedTokenType?: "access_token" | "id_token";
      tokenKid?: string;
      tokenAlg?: string;
      jwksUrl?: string;
      issuer?: string;
      aud?: string | string[];
      azp?: string;
      hasEmail?: boolean;
      hasSub?: boolean;
      rolesFound?: string[];
    } & HostTokenRefreshMeta);

export { getAllowedClientIds } from "@/lib/auth/keycloak-client-auth";
export { getHostClientAuthorizationRule };

function failureFromVerifyError(
  error: KeycloakJwtVerifyError,
): HostTokenValidationResult {
  return {
    ok: false,
    code: error.code,
    message: error.message,
    details: error.details,
    failedTokenType: error.failedTokenType,
    tokenKid: error.tokenKid,
    tokenAlg: error.tokenAlg,
    jwksUrl: error.jwksUrl,
    issuer: error.issuer,
    aud: error.aud,
    azp: error.azp,
    hasEmail: error.hasEmail,
    hasSub: error.hasSub,
  };
}

function extractEmail(
  primary: JWTPayload,
  secondary?: JWTPayload | null,
): string | null {
  if (typeof primary.email === "string" && primary.email.includes("@")) {
    return primary.email;
  }

  if (
    typeof primary.preferred_username === "string" &&
    primary.preferred_username.includes("@")
  ) {
    return primary.preferred_username;
  }

  if (secondary) {
    if (typeof secondary.email === "string" && secondary.email.includes("@")) {
      return secondary.email;
    }

    if (
      typeof secondary.preferred_username === "string" &&
      secondary.preferred_username.includes("@")
    ) {
      return secondary.preferred_username;
    }
  }

  return null;
}

function extractName(primary: JWTPayload, email: string) {
  if (typeof primary.name === "string" && primary.name.trim()) {
    return primary.name;
  }

  if (
    typeof primary.preferred_username === "string" &&
    primary.preferred_username.trim()
  ) {
    return primary.preferred_username;
  }

  return email;
}

async function validateHostTokensOnce(input: {
  idToken: string;
  accessToken: string;
}): Promise<HostTokenValidationResult> {
  const idToken = input.idToken;
  const accessToken = input.accessToken;

  if (!idToken && !accessToken) {
    return {
      ok: false,
      code: "missing_token",
      message: "Nenhum token recebido.",
    };
  }

  let identityPayload: JWTPayload | null = null;
  let rolesAccessToken: string | undefined;
  let clientId = "";
  let claims: {
    iss: string;
    aud?: string | string[];
    azp?: string;
    exp?: number;
    iat?: number;
  } = {
    iss:
      process.env.KEYCLOAK_ISSUER ??
      "https://auth.checkmateproperty.com/realms/Checkmate",
  };

  if (idToken) {
    const verified = await verifyKeycloakJwt(idToken, "id_token");

    if (!verified.ok) {
      return failureFromVerifyError(verified);
    }

    identityPayload = verified.payload;
    clientId = verified.clientId;
    claims = {
      iss: String(verified.payload.iss ?? claims.iss),
      aud: verified.payload.aud,
      azp:
        typeof verified.payload.azp === "string"
          ? verified.payload.azp
          : undefined,
      exp: verified.payload.exp,
      iat: verified.payload.iat,
    };

    if (accessToken) {
      const accessVerified = await verifyKeycloakJwt(accessToken, "access_token", {
        requireClient: false,
      });

      if (accessVerified.ok) {
        rolesAccessToken = accessToken;
      } else if (accessVerified.code === "token_expired") {
        return failureFromVerifyError(accessVerified);
      }
    }
  } else if (accessToken) {
    const verified = await verifyKeycloakJwt(accessToken, "access_token");

    if (!verified.ok) {
      return failureFromVerifyError(verified);
    }

    identityPayload = verified.payload;
    rolesAccessToken = accessToken;
    clientId = verified.clientId;
    claims = {
      iss: String(verified.payload.iss ?? claims.iss),
      aud: verified.payload.aud,
      azp:
        typeof verified.payload.azp === "string"
          ? verified.payload.azp
          : undefined,
      exp: verified.payload.exp,
      iat: verified.payload.iat,
    };
  }

  if (!identityPayload?.sub) {
    return {
      ok: false,
      code: "missing_sub",
      message: "Não foi possível obter subject do token.",
    };
  }

  const secondaryPayload = rolesAccessToken
    ? decodeJwtPayloadUnsafe(rolesAccessToken)
    : null;

  const email = extractEmail(
    identityPayload,
    secondaryPayload as JWTPayload | null,
  );

  if (!email) {
    return {
      ok: false,
      code: "missing_email",
      message: "Token sem email utilizável.",
      details: {
        idClaims: extractDecodedClaims(identityPayload),
        accessClaims: extractDecodedClaims(secondaryPayload),
      },
    };
  }

  const roles = resolveKeycloakRolesFromAuthPayload({
    idToken: idToken || undefined,
    accessToken: rolesAccessToken,
    profile: identityPayload as Record<string, unknown>,
    rolesSource: "host-tokens",
  });

  return {
    ok: true,
    sub: String(identityPayload.sub),
    email,
    name: extractName(identityPayload, email),
    givenName:
      typeof identityPayload.given_name === "string"
        ? identityPayload.given_name
        : undefined,
    familyName:
      typeof identityPayload.family_name === "string"
        ? identityPayload.family_name
        : undefined,
    roles,
    idToken: idToken || undefined,
    accessToken: rolesAccessToken,
    clientId,
    claims,
  };
}

function shouldAttemptRefresh(result: HostTokenValidationResult) {
  return (
    !result.ok &&
    result.code === "token_expired" &&
    Boolean(result.failedTokenType)
  );
}

export async function validateHostTokens(input: {
  idToken?: string | null;
  accessToken?: string | null;
  refreshToken?: string | null;
  tokenSource?: "env" | "query" | "body";
}): Promise<HostTokenValidationResult> {
  const normalize =
    input.tokenSource === "query"
      ? normalizeTokenFromQuery
      : normalizeTokenFromEnv;

  let idToken = normalize(input.idToken) ?? "";
  let accessToken = normalize(input.accessToken) ?? "";
  let refreshToken = normalize(input.refreshToken) ?? "";

  let tokenRefreshAttempted = false;
  let tokenRefreshSucceeded = false;

  if (!idToken && !accessToken && refreshToken) {
    tokenRefreshAttempted = true;
    const refreshed = await refreshKeycloakTokens(refreshToken);

    if (!refreshed.ok) {
      return {
        ok: false,
        code: refreshed.code,
        message: refreshed.message,
        refreshErrorCode: refreshed.refreshErrorCode,
        tokenRefreshAttempted: true,
        tokenRefreshSucceeded: false,
      };
    }

    tokenRefreshSucceeded = true;
    accessToken = refreshed.access_token;
    idToken = refreshed.id_token ?? "";
    refreshToken = refreshed.refresh_token ?? refreshToken;
  }

  let result = await validateHostTokensOnce({ idToken, accessToken });

  if (shouldAttemptRefresh(result) && refreshToken) {
    tokenRefreshAttempted = true;

    const refreshed = await refreshKeycloakTokens(refreshToken);

    if (!refreshed.ok) {
      const failedResult = result.ok ? null : result;

      return {
        ok: false,
        code: refreshed.code,
        message: refreshed.message,
        refreshErrorCode: refreshed.refreshErrorCode,
        tokenRefreshAttempted: true,
        tokenRefreshSucceeded: false,
        failedTokenType: failedResult?.failedTokenType,
        issuer: failedResult?.issuer,
        aud: failedResult?.aud,
        azp: failedResult?.azp,
        hasEmail: failedResult?.hasEmail,
        hasSub: failedResult?.hasSub,
      };
    }

    tokenRefreshSucceeded = true;
    accessToken = refreshed.access_token;
    idToken = refreshed.id_token ?? idToken;
    refreshToken = refreshed.refresh_token ?? refreshToken;

    result = await validateHostTokensOnce({ idToken, accessToken });
  }

  if (!result.ok) {
    return {
      ...result,
      tokenRefreshAttempted,
      tokenRefreshSucceeded,
    };
  }

  return {
    ...result,
    refreshToken: refreshToken || undefined,
    tokenRefreshAttempted,
    tokenRefreshSucceeded,
  };
}
