import type { Provider } from "next-auth/providers";
import Keycloak from "next-auth/providers/keycloak";

const DEFAULT_KEYCLOAK_ISSUER =
  "https://auth.checkmateproperty.com/realms/Checkmate";
const DEFAULT_KEYCLOAK_CLIENT_ID = "checkmate-academy-public";

export function getKeycloakAuthEnv() {
  const issuer = (
    process.env.KEYCLOAK_ISSUER ??
    process.env.NEXT_PUBLIC_KEYCLOAK_ISSUER ??
    DEFAULT_KEYCLOAK_ISSUER
  ).trim();

  const clientId = (
    process.env.KEYCLOAK_CLIENT_ID ??
    process.env.KEYCLOAK_PUBLIC_CLIENT_ID ??
    process.env.NEXT_PUBLIC_KEYCLOAK_PUBLIC_CLIENT_ID ??
    DEFAULT_KEYCLOAK_CLIENT_ID
  ).trim();

  const clientSecret = process.env.KEYCLOAK_CLIENT_SECRET?.trim();

  return {
    issuer,
    clientId,
    clientSecret: clientSecret || undefined,
    isConfigured: Boolean(issuer && clientId),
  };
}

export function isKeycloakAuthProviderEnabled() {
  return getKeycloakAuthEnv().isConfigured;
}

export function createKeycloakAuthProvider(): Provider | null {
  const { issuer, clientId, clientSecret, isConfigured } = getKeycloakAuthEnv();

  if (!isConfigured) {
    return null;
  }

  return Keycloak({
    id: "keycloak",
    clientId,
    issuer,
    ...(clientSecret ? { clientSecret } : {}),
  });
}

export function buildPrimaryAuthProviders(): Provider[] {
  const keycloak = createKeycloakAuthProvider();

  return keycloak ? [keycloak] : [];
}
