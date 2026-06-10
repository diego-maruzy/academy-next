import { normalizeTokenFromEnv } from "@/lib/auth/normalize-token";

export function isOidcHostTestEnabled() {
  return process.env.OIDC_TEST_ENABLED === "true";
}

export function getOidcTestIdentityFromEnv() {
  const email = normalizeTokenFromEnv(process.env.OIDC_TEST_EMAIL)?.toLowerCase();
  const sub = normalizeTokenFromEnv(process.env.OIDC_TEST_SUB);
  const name =
    normalizeTokenFromEnv(process.env.OIDC_TEST_NAME) ?? email ?? "Test User";
  const roles = (process.env.OIDC_TEST_ROLES ?? "ROLE_USER_FREE")
    .split(",")
    .map((role) => role.trim())
    .filter(Boolean);

  return {
    email,
    sub,
    name,
    roles,
    hasEmail: Boolean(email),
    hasSub: Boolean(sub),
  };
}

export function getOidcTestTokensFromEnv() {
  const accessToken = normalizeTokenFromEnv(process.env.OIDC_TEST_ACCESS_TOKEN);
  const idToken = normalizeTokenFromEnv(process.env.OIDC_TEST_ID_TOKEN);
  const refreshToken = normalizeTokenFromEnv(process.env.OIDC_TEST_REFRESH_TOKEN);

  return {
    accessToken,
    idToken,
    refreshToken,
    hasAccessToken: Boolean(accessToken),
    hasIdToken: Boolean(idToken),
    hasRefreshToken: Boolean(refreshToken),
  };
}
