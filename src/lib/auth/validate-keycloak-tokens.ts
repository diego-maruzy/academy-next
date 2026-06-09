import { createRemoteJWKSet, jwtVerify } from "jose";
import {
  resolveKeycloakRolesFromAuthPayload,
  type ResolvedKeycloakRoles,
} from "@/lib/auth/keycloak-token";

export type ValidatedKeycloakIdentity = {
  sub: string;
  email: string;
  name: string;
  givenName?: string;
  familyName?: string;
  roles: ResolvedKeycloakRoles;
};

function getKeycloakIssuer() {
  return (
    process.env.KEYCLOAK_ISSUER ??
    "https://auth.checkmateproperty.com/realms/Checkmate"
  );
}

function getAllowedClientIds() {
  return [
    process.env.KEYCLOAK_PUBLIC_CLIENT_ID ?? "checkmate-academy-public",
    process.env.KEYCLOAK_CLIENT_ID,
  ].filter((value): value is string => Boolean(value));
}

let jwks: ReturnType<typeof createRemoteJWKSet> | null = null;

function getJwks() {
  if (!jwks) {
    const issuer = getKeycloakIssuer();
    jwks = createRemoteJWKSet(
      new URL(`${issuer}/protocol/openid-connect/certs`),
    );
  }

  return jwks;
}

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split(".");

    if (parts.length < 2) {
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

function isTokenExpired(payload: Record<string, unknown>) {
  const exp = payload.exp;

  if (typeof exp !== "number") {
    return true;
  }

  return exp * 1000 <= Date.now();
}

async function verifyIdToken(idToken: string) {
  const issuer = getKeycloakIssuer();
  const audience = getAllowedClientIds();

  const { payload } = await jwtVerify(idToken, getJwks(), {
    issuer,
    audience: audience.length === 1 ? audience[0] : audience,
  });

  const sub = payload.sub;
  const email = typeof payload.email === "string" ? payload.email : null;

  if (!sub || !email) {
    return null;
  }

  return {
    sub,
    email,
    name:
      typeof payload.name === "string"
        ? payload.name
        : typeof payload.preferred_username === "string"
          ? payload.preferred_username
          : email,
    givenName:
      typeof payload.given_name === "string" ? payload.given_name : undefined,
    familyName:
      typeof payload.family_name === "string" ? payload.family_name : undefined,
    payload,
  };
}

async function verifyAccessToken(accessToken: string) {
  const issuer = getKeycloakIssuer();
  const audience = getAllowedClientIds();

  try {
    await jwtVerify(accessToken, getJwks(), {
      issuer,
      audience: audience.length === 1 ? audience[0] : audience,
    });

    return true;
  } catch {
    const payload = decodeJwtPayload(accessToken);

    if (!payload || isTokenExpired(payload)) {
      return false;
    }

    const tokenIssuer = payload.iss;

    if (typeof tokenIssuer === "string" && tokenIssuer !== issuer) {
      return false;
    }

    return true;
  }
}

export async function validateKeycloakTokens(input: {
  idToken: string;
  accessToken?: string | null;
}): Promise<ValidatedKeycloakIdentity | null> {
  if (!input.idToken) {
    return null;
  }

  try {
    const identity = await verifyIdToken(input.idToken);

    if (!identity) {
      return null;
    }

    if (input.accessToken) {
      const accessValid = await verifyAccessToken(input.accessToken);

      if (!accessValid) {
        return null;
      }
    }

    const roles = resolveKeycloakRolesFromAuthPayload({
      idToken: input.idToken,
      accessToken: input.accessToken,
      profile: identity.payload,
    });

    return {
      sub: identity.sub,
      email: identity.email,
      name: identity.name,
      givenName: identity.givenName,
      familyName: identity.familyName,
      roles,
    };
  } catch {
    return null;
  }
}
