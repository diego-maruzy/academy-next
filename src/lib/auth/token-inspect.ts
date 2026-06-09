export type TokenPresence = {
  hasAccessToken: boolean;
  hasIdToken: boolean;
  hasRefreshToken: boolean;
  accessTokenLength: number;
  idTokenLength: number;
  refreshTokenLength: number;
};

export type DecodedTokenClaims = {
  iss?: string;
  aud?: string | string[];
  azp?: string;
  exp?: number;
  iat?: number;
  sub?: string;
  email?: string;
  preferred_username?: string;
  roles?: string[];
  realm_access_roles?: string[];
};

export type HostTokenValidationCode =
  | "ok"
  | "missing_token"
  | "missing_id_token"
  | "missing_access_token"
  | "malformed_token"
  | "token_truncated"
  | "invalid_issuer"
  | "invalid_audience"
  | "token_expired"
  | "jwks_error"
  | "signature_invalid"
  | "missing_email"
  | "missing_sub"
  | "session_failed";

export function maskTokenPreview(token: string) {
  if (!token) {
    return "";
  }

  if (token.length <= 20) {
    return `${token.slice(0, 4)}…(${token.length})`;
  }

  return `${token.slice(0, 12)}…${token.slice(-6)} (${token.length})`;
}

export function normalizeTokenFromQuery(value: string | null | undefined) {
  if (!value) {
    return "";
  }

  let token = value.trim();

  try {
    token = decodeURIComponent(token);
  } catch {
    // keep raw value when not URI-encoded
  }

  return token.replace(/ /g, "+");
}

export function decodeJwtPayloadUnsafe(
  token: string,
): Record<string, unknown> | null {
  try {
    const parts = token.split(".");

    if (parts.length !== 3) {
      return null;
    }

    const payload = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = payload.padEnd(
      payload.length + ((4 - (payload.length % 4)) % 4),
      "=",
    );
    const json = Buffer.from(padded, "base64").toString("utf8");

    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function inspectTokenStructure(token: string) {
  const parts = token.split(".");

  if (parts.length !== 3) {
    return { valid: false as const, reason: "malformed_token" as const };
  }

  for (const part of parts) {
    if (!part || part.length < 8) {
      return { valid: false as const, reason: "token_truncated" as const };
    }
  }

  return { valid: true as const };
}

export function extractDecodedClaims(
  payload: Record<string, unknown> | null,
): DecodedTokenClaims | null {
  if (!payload) {
    return null;
  }

  const realmAccess = payload.realm_access as { roles?: string[] } | undefined;

  return {
    iss: typeof payload.iss === "string" ? payload.iss : undefined,
    aud: Array.isArray(payload.aud)
      ? payload.aud.map(String)
      : typeof payload.aud === "string"
        ? payload.aud
        : undefined,
    azp: typeof payload.azp === "string" ? payload.azp : undefined,
    exp: typeof payload.exp === "number" ? payload.exp : undefined,
    iat: typeof payload.iat === "number" ? payload.iat : undefined,
    sub: typeof payload.sub === "string" ? payload.sub : undefined,
    email: typeof payload.email === "string" ? payload.email : undefined,
    preferred_username:
      typeof payload.preferred_username === "string"
        ? payload.preferred_username
        : undefined,
    roles: Array.isArray(payload.roles)
      ? payload.roles.filter((role): role is string => typeof role === "string")
      : undefined,
    realm_access_roles: realmAccess?.roles,
  };
}

export function getTokenPresence(input: {
  accessToken?: string | null;
  idToken?: string | null;
  refreshToken?: string | null;
}): TokenPresence {
  const access = input.accessToken ?? "";
  const id = input.idToken ?? "";
  const refresh = input.refreshToken ?? "";

  return {
    hasAccessToken: access.length > 0,
    hasIdToken: id.length > 0,
    hasRefreshToken: refresh.length > 0,
    accessTokenLength: access.length,
    idTokenLength: id.length,
    refreshTokenLength: refresh.length,
  };
}

export function buildSafeTokenLog(input: {
  accessToken?: string | null;
  idToken?: string | null;
  refreshToken?: string | null;
}) {
  const presence = getTokenPresence(input);
  const idClaims = input.idToken
    ? extractDecodedClaims(decodeJwtPayloadUnsafe(input.idToken))
    : null;
  const accessClaims = input.accessToken
    ? extractDecodedClaims(decodeJwtPayloadUnsafe(input.accessToken))
    : null;

  return {
    ...presence,
    accessTokenPreview: maskTokenPreview(input.accessToken ?? ""),
    idTokenPreview: maskTokenPreview(input.idToken ?? ""),
    refreshTokenPreview: maskTokenPreview(input.refreshToken ?? ""),
    idTokenClaims: idClaims,
    accessTokenClaims: accessClaims,
  };
}
