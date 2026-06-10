import type { JWTPayload } from "jose";

export function getAllowedClientIds() {
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

function getAudienceList(aud: JWTPayload["aud"]) {
  if (!aud) {
    return [] as string[];
  }

  return Array.isArray(aud) ? aud.map(String) : [String(aud)];
}

/**
 * Aceita token se:
 * a) azp ∈ allowedClients
 * b) aud ∩ allowedClients ≠ ∅
 * c) aud contém "account" e azp ∈ allowedClients
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

  if (audiences.includes("account") && azp && allowed.includes(azp)) {
    return { ok: true as const, matchedBy: "account+azp", clientId: azp };
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

export function getHostClientAuthorizationRule() {
  return {
    allowedClients: getAllowedClientIds(),
    resourceRoleClients: [
      process.env.KEYCLOAK_PUBLIC_CLIENT_ID ?? "checkmate-academy-public",
      ...(process.env.KEYCLOAK_HOST_CLIENT_IDS ?? "")
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean),
      "checkmate-property-public",
      "checkmate-property-private",
    ],
    rule:
      "Aceita se azp ∈ allowedClients, aud ∩ allowedClients ≠ ∅, ou aud=account com azp autorizado.",
  };
}
