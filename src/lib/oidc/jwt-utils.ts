export type DecodedJwtPayload = Record<string, unknown> & {
  iss?: string;
  sub?: string;
  exp?: number;
  iat?: number;
  email?: string;
  preferred_username?: string;
  name?: string;
  given_name?: string;
  family_name?: string;
  realm_access?: { roles?: string[] };
  resource_access?: Record<string, { roles?: string[] } | undefined>;
};

export function decodeJwtPayload(token: string): DecodedJwtPayload | null {
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
    const json = atob(padded);

    return JSON.parse(json) as DecodedJwtPayload;
  } catch {
    return null;
  }
}

export function getJwtExpirationEpoch(token: string) {
  const payload = decodeJwtPayload(token);
  return typeof payload?.exp === "number" ? payload.exp : null;
}

export function isJwtExpired(token: string, skewSeconds = 30) {
  const exp = getJwtExpirationEpoch(token);

  if (exp === null) {
    return true;
  }

  const now = Math.floor(Date.now() / 1000);
  return exp <= now + skewSeconds;
}

export function extractEmailFromPayload(payload: DecodedJwtPayload | null) {
  if (!payload) {
    return null;
  }

  if (typeof payload.email === "string" && payload.email.includes("@")) {
    return payload.email;
  }

  if (
    typeof payload.preferred_username === "string" &&
    payload.preferred_username.includes("@")
  ) {
    return payload.preferred_username;
  }

  return null;
}
