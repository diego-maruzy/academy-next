import { createHmac, timingSafeEqual } from "node:crypto";
import type { AcademyAppRole } from "@/lib/auth/keycloak-roles";
import type { KeycloakRolesSource } from "@/lib/auth/keycloak-token";

const HOST_SSO_PAYLOAD_MAX_AGE_MS = 60_000;

export type HostSsoSignedUser = {
  sub: string;
  email: string;
  name: string;
  roles: string[];
  ignoredRoles: string[];
  appRole: AcademyAppRole;
  provider: "oidc-host";
  source: "host-tokens";
  exp: number;
};

function getAuthSecret() {
  const secret = process.env.AUTH_SECRET;

  if (!secret) {
    throw new Error("AUTH_SECRET is required for Host SSO session signing.");
  }

  return secret;
}

function signPayloadPart(encodedPayload: string) {
  return createHmac("sha256", getAuthSecret())
    .update(encodedPayload)
    .digest("base64url");
}

export function signHostSsoUserPayload(
  user: Omit<HostSsoSignedUser, "exp">,
): string {
  const payload: HostSsoSignedUser = {
    ...user,
    exp: Date.now() + HOST_SSO_PAYLOAD_MAX_AGE_MS,
  };
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = signPayloadPart(encoded);

  return `${encoded}.${signature}`;
}

export function verifyHostSsoUserPayload(
  token: string,
): HostSsoSignedUser | null {
  const [encoded, signature] = token.split(".");

  if (!encoded || !signature) {
    return null;
  }

  const expected = signPayloadPart(encoded);

  try {
    const valid = timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expected),
    );

    if (!valid) {
      return null;
    }
  } catch {
    return null;
  }

  try {
    const payload = JSON.parse(
      Buffer.from(encoded, "base64url").toString("utf8"),
    ) as HostSsoSignedUser;

    if (
      !payload.sub ||
      !payload.email ||
      !payload.name ||
      !Array.isArray(payload.roles) ||
      typeof payload.exp !== "number" ||
      payload.exp < Date.now()
    ) {
      return null;
    }

    if (payload.provider !== "oidc-host" || payload.source !== "host-tokens") {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

export type HostSsoSessionInput = {
  sub: string;
  email: string;
  name: string;
  roles: string[];
  ignoredRoles: string[];
  appRole: AcademyAppRole;
  rolesSource?: KeycloakRolesSource;
};
