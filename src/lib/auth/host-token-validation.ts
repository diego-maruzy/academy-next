import { jwtVerify, type JWTPayload } from "jose";
import {
  resolveKeycloakRolesFromAuthPayload,
  type ResolvedKeycloakRoles,
} from "@/lib/auth/keycloak-token";
import {
  decodeJwtPayloadUnsafe,
  extractDecodedClaims,
  inspectTokenStructure,
  type HostTokenValidationCode,
} from "@/lib/auth/token-inspect";

export type HostTokenValidationResult =
  | {
      ok: true;
      sub: string;
      email: string;
      name: string;
      givenName?: string;
      familyName?: string;
      roles: ResolvedKeycloakRoles;
      idToken?: string;
      accessToken?: string;
      clientId: string;
      claims: {
        iss: string;
        aud?: string | string[];
        azp?: string;
        exp?: number;
        iat?: number;
      };
    }
  | {
      ok: false;
      code: HostTokenValidationCode;
      message: string;
      details?: Record<string, unknown>;
    };

const CLOCK_SKEW_SECONDS = 60;

function getKeycloakIssuer() {
  return (
    process.env.KEYCLOAK_ISSUER ??
    "https://auth.checkmateproperty.com/realms/Checkmate"
  );
}

function getAllowedClientIds() {
  const defaults = [
    process.env.KEYCLOAK_PUBLIC_CLIENT_ID ?? "checkmate-academy-public",
    process.env.KEYCLOAK_CLIENT_ID,
  ];

  const hostClients = (process.env.KEYCLOAK_HOST_CLIENT_IDS ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  return [...new Set([...defaults, ...hostClients].filter(Boolean))] as string[];
}

let jwks: ReturnType<typeof import("jose").createRemoteJWKSet> | null = null;

async function getJwks() {
  if (!jwks) {
    const { createRemoteJWKSet } = await import("jose");
    const issuer = getKeycloakIssuer();
    jwks = createRemoteJWKSet(
      new URL(`${issuer}/protocol/openid-connect/certs`),
    );
  }

  return jwks;
}

function getAudienceList(aud: JWTPayload["aud"]) {
  if (!aud) {
    return [] as string[];
  }

  return Array.isArray(aud) ? aud.map(String) : [String(aud)];
}

/**
 * Regra de client_id para tokens do realm Checkmate:
 * - aud inclui um client autorizado, OU
 * - azp é um client autorizado (comum em access_token com aud=account), OU
 * - aud=account e azp autorizado
 */
export function isClientAuthorized(payload: JWTPayload) {
  const allowed = getAllowedClientIds();
  const azp = typeof payload.azp === "string" ? payload.azp : null;
  const audiences = getAudienceList(payload.aud);

  if (azp && allowed.includes(azp)) {
    return { ok: true as const, matchedBy: "azp", clientId: azp };
  }

  const audMatch = audiences.find((audience) => allowed.includes(audience));

  if (audMatch) {
    return { ok: true as const, matchedBy: "aud", clientId: audMatch };
  }

  if (process.env.KEYCLOAK_HOST_TRUST_REALM_SSO === "true") {
    const trustedClient = azp ?? audiences[0] ?? "realm-trusted";

    return {
      ok: true as const,
      matchedBy: "realm-trust",
      clientId: trustedClient,
    };
  }

  return {
    ok: false as const,
    allowed,
    azp,
    aud: audiences,
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

async function verifySignedToken(token: string) {
  const structure = inspectTokenStructure(token);

  if (!structure.valid) {
    return {
      ok: false as const,
      code: structure.reason,
      message:
        structure.reason === "token_truncated"
          ? "Token parece truncado na URL."
          : "Token malformado.",
    };
  }

  const issuer = getKeycloakIssuer();

  try {
    const { payload } = await jwtVerify(token, await getJwks(), {
      issuer,
    });

    if (isExpired(payload)) {
      return {
        ok: false as const,
        code: "token_expired" as const,
        message: "Token expirado.",
        details: extractDecodedClaims(payload),
      };
    }

    const client = isClientAuthorized(payload);

    if (!client.ok) {
      return {
        ok: false as const,
        code: "invalid_audience" as const,
        message:
          "Client do token não autorizado para Host SSO (aud/azp).",
        details: client,
      };
    }

    if (!payload.sub) {
      return {
        ok: false as const,
        code: "missing_sub" as const,
        message: "Token sem subject (sub).",
        details: extractDecodedClaims(payload),
      };
    }

    return {
      ok: true as const,
      payload,
      clientId: client.clientId,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "verify_failed";

    if (message.toLowerCase().includes("jwks")) {
      return {
        ok: false as const,
        code: "jwks_error" as const,
        message: "Falha ao buscar/validar JWKS.",
      };
    }

    return {
      ok: false as const,
      code: "signature_invalid" as const,
      message: "Assinatura do token inválida.",
    };
  }
}

export async function validateHostTokens(input: {
  idToken?: string | null;
  accessToken?: string | null;
}): Promise<HostTokenValidationResult> {
  const idToken = input.idToken?.trim() ?? "";
  const accessToken = input.accessToken?.trim() ?? "";

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
  } = { iss: getKeycloakIssuer() };

  if (idToken) {
    const verified = await verifySignedToken(idToken);

    if (!verified.ok) {
      return {
        ok: false,
        code: verified.code,
        message: verified.message,
        details:
          "details" in verified && verified.details
            ? (verified.details as Record<string, unknown>)
            : undefined,
      };
    }

    identityPayload = verified.payload;
    clientId = verified.clientId;
    claims = {
      iss: String(verified.payload.iss ?? getKeycloakIssuer()),
      aud: verified.payload.aud,
      azp: typeof verified.payload.azp === "string" ? verified.payload.azp : undefined,
      exp: verified.payload.exp,
      iat: verified.payload.iat,
    };

    if (accessToken) {
      const accessVerified = await verifySignedToken(accessToken);

      if (accessVerified.ok) {
        rolesAccessToken = accessToken;
      }
    }
  } else if (accessToken) {
    const verified = await verifySignedToken(accessToken);

    if (!verified.ok) {
      return {
        ok: false,
        code: verified.code,
        message: verified.message,
        details:
          "details" in verified && verified.details
            ? (verified.details as Record<string, unknown>)
            : undefined,
      };
    }

    identityPayload = verified.payload;
    rolesAccessToken = accessToken;
    clientId = verified.clientId;
    claims = {
      iss: String(verified.payload.iss ?? getKeycloakIssuer()),
      aud: verified.payload.aud,
      azp: typeof verified.payload.azp === "string" ? verified.payload.azp : undefined,
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

export function getHostClientAuthorizationRule() {
  return {
    allowedClients: getAllowedClientIds(),
    rule:
      "Aceita token se azp ∈ allowedClients, ou aud ∩ allowedClients ≠ ∅, ou aud=account com azp autorizado.",
  };
}
