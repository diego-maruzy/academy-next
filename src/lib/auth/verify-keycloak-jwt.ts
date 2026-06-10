import {
  decodeProtectedHeader,
  jwtVerify,
  type JWTPayload,
  errors as joseErrors,
} from "jose";
import {
  decodeJwtPayloadUnsafe,
  extractDecodedClaims,
  inspectTokenStructure,
  type HostTokenValidationCode,
} from "@/lib/auth/token-inspect";
import { isClientAuthorized } from "@/lib/auth/keycloak-client-auth";

export type KeycloakTokenType = "access_token" | "id_token";

export type KeycloakJwtVerifyError = {
  ok: false;
  code: HostTokenValidationCode | "jwks_kid_not_found";
  message: string;
  failedTokenType: KeycloakTokenType;
  tokenKid?: string;
  tokenAlg?: string;
  jwksUrl: string;
  issuer?: string;
  aud?: string | string[];
  azp?: string;
  hasEmail: boolean;
  hasSub: boolean;
  details?: Record<string, unknown>;
};

export type KeycloakJwtVerifySuccess = {
  ok: true;
  payload: JWTPayload;
  clientId: string;
  failedTokenType: KeycloakTokenType;
};

export type KeycloakJwtVerifyResult =
  | KeycloakJwtVerifySuccess
  | KeycloakJwtVerifyError;

const CLOCK_SKEW_SECONDS = 60;

function getKeycloakIssuer() {
  return (
    process.env.KEYCLOAK_ISSUER ??
    "https://auth.checkmateproperty.com/realms/Checkmate"
  );
}

export function getKeycloakJwksUrl(issuer = getKeycloakIssuer()) {
  return `${issuer.replace(/\/$/, "")}/protocol/openid-connect/certs`;
}

let jwks: ReturnType<typeof import("jose").createRemoteJWKSet> | null = null;

async function getJwks() {
  if (!jwks) {
    const { createRemoteJWKSet } = await import("jose");
    jwks = createRemoteJWKSet(new URL(getKeycloakJwksUrl()));
  }

  return jwks;
}

function buildSafeClaims(token: string) {
  const payload = decodeJwtPayloadUnsafe(token);
  const claims = extractDecodedClaims(payload);

  return {
    issuer: claims?.iss,
    aud: claims?.aud,
    azp: claims?.azp,
    hasEmail: Boolean(claims?.email),
    hasSub: Boolean(claims?.sub),
  };
}

function isExpired(payload: JWTPayload) {
  const exp = payload.exp;

  if (typeof exp !== "number") {
    return true;
  }

  const now = Math.floor(Date.now() / 1000);
  return exp < now - CLOCK_SKEW_SECONDS;
}

async function jwksContainsKid(kid: string | undefined) {
  if (!kid) {
    return false;
  }

  try {
    const response = await fetch(getKeycloakJwksUrl(), {
      cache: "no-store",
    });

    if (!response.ok) {
      return null;
    }

    const body = (await response.json()) as { keys?: Array<{ kid?: string }> };
    return body.keys?.some((key) => key.kid === kid) ?? false;
  } catch {
    return null;
  }
}

function mapJoseError(error: unknown): HostTokenValidationCode | "jwks_kid_not_found" {
  if (error instanceof joseErrors.JWTExpired) {
    return "token_expired";
  }

  if (error instanceof joseErrors.JWTClaimValidationFailed) {
    const claim = error.claim;

    if (claim === "iss") {
      return "invalid_issuer";
    }

    if (claim === "aud" || claim === "azp") {
      return "invalid_audience";
    }

    return "signature_invalid";
  }

  if (error instanceof joseErrors.JWSSignatureVerificationFailed) {
    return "signature_invalid";
  }

  const message = error instanceof Error ? error.message.toLowerCase() : "";

  if (message.includes("jwks") || message.includes("no matching key")) {
    return "jwks_kid_not_found";
  }

  if (message.includes("expired")) {
    return "token_expired";
  }

  return "signature_invalid";
}

export async function verifyKeycloakJwt(
  token: string,
  tokenType: KeycloakTokenType,
  options?: { requireClient?: boolean },
): Promise<KeycloakJwtVerifyResult> {
  const jwksUrl = getKeycloakJwksUrl();
  const safeClaims = buildSafeClaims(token);
  const structure = inspectTokenStructure(token);

  if (!structure.valid) {
    return {
      ok: false,
      code: structure.reason,
      message:
        structure.reason === "token_truncated"
          ? "Token parece truncado."
          : "Token malformado.",
      failedTokenType: tokenType,
      jwksUrl,
      ...safeClaims,
    };
  }

  let tokenKid: string | undefined;
  let tokenAlg: string | undefined;

  try {
    const header = decodeProtectedHeader(token);
    tokenKid = header.kid;
    tokenAlg = header.alg;
  } catch {
    return {
      ok: false,
      code: "malformed_token",
      message: "Header JWT inválido.",
      failedTokenType: tokenType,
      jwksUrl,
      ...safeClaims,
    };
  }

  const kidExists = await jwksContainsKid(tokenKid);

  if (kidExists === null) {
    return {
      ok: false,
      code: "jwks_error",
      message: "Não foi possível obter JWKS do Keycloak.",
      failedTokenType: tokenType,
      tokenKid,
      tokenAlg,
      jwksUrl,
      hasEmail: safeClaims.hasEmail,
      hasSub: safeClaims.hasSub,
      issuer: safeClaims.issuer,
      aud: safeClaims.aud,
      azp: safeClaims.azp,
    };
  }

  if (kidExists === false) {
    return {
      ok: false,
      code: "jwks_kid_not_found",
      message: "kid do token não encontrado no JWKS do Keycloak.",
      failedTokenType: tokenType,
      tokenKid,
      tokenAlg,
      jwksUrl,
      hasEmail: safeClaims.hasEmail,
      hasSub: safeClaims.hasSub,
      issuer: safeClaims.issuer,
      aud: safeClaims.aud,
      azp: safeClaims.azp,
    };
  }

  const issuer = getKeycloakIssuer();

  try {
    const { payload } = await jwtVerify(token, await getJwks(), {
      issuer,
      clockTolerance: CLOCK_SKEW_SECONDS,
    });

    if (isExpired(payload)) {
      return {
        ok: false,
        code: "token_expired",
        message: "Token expirado.",
        failedTokenType: tokenType,
        tokenKid,
        tokenAlg,
        jwksUrl,
        issuer: String(payload.iss ?? safeClaims.issuer),
        aud: payload.aud,
        azp: typeof payload.azp === "string" ? payload.azp : safeClaims.azp,
        hasEmail: Boolean(
          typeof payload.email === "string"
            ? payload.email
            : safeClaims.hasEmail,
        ),
        hasSub: Boolean(payload.sub ?? safeClaims.hasSub),
      };
    }

    if (!payload.sub) {
      return {
        ok: false,
        code: "missing_sub",
        message: "Token sem subject (sub).",
        failedTokenType: tokenType,
        tokenKid,
        tokenAlg,
        jwksUrl,
        issuer: String(payload.iss ?? safeClaims.issuer),
        aud: payload.aud,
        azp: typeof payload.azp === "string" ? payload.azp : safeClaims.azp,
        hasEmail: safeClaims.hasEmail,
        hasSub: false,
      };
    }

    if (options?.requireClient !== false) {
      const client = isClientAuthorized(payload);

      if (!client.ok) {
        return {
          ok: false,
          code: "invalid_audience",
          message: "Client do token não autorizado (aud/azp).",
          failedTokenType: tokenType,
          tokenKid,
          tokenAlg,
          jwksUrl,
          issuer: String(payload.iss ?? safeClaims.issuer),
          aud: payload.aud,
          azp: typeof payload.azp === "string" ? payload.azp : safeClaims.azp,
          hasEmail: safeClaims.hasEmail,
          hasSub: true,
          details: client,
        };
      }

      return {
        ok: true,
        payload,
        clientId: client.clientId,
        failedTokenType: tokenType,
      };
    }

    return {
      ok: true,
      payload,
      clientId:
        typeof payload.azp === "string"
          ? payload.azp
          : (Array.isArray(payload.aud)
              ? payload.aud[0]
              : payload.aud) ?? "unknown",
      failedTokenType: tokenType,
    };
  } catch (error) {
    const code = mapJoseError(error);

    return {
      ok: false,
      code,
      message:
        code === "token_expired"
          ? "Token expirado."
          : code === "jwks_kid_not_found"
            ? "kid do token não encontrado no JWKS."
            : code === "invalid_issuer"
              ? "Issuer do token inválido."
              : "Assinatura do token inválida.",
      failedTokenType: tokenType,
      tokenKid,
      tokenAlg,
      jwksUrl,
      ...safeClaims,
      details:
        error instanceof Error ? { verifyMessage: error.message } : undefined,
    };
  }
}
