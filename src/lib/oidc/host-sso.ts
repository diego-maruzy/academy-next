"use client";

import { User, type UserProfile } from "oidc-client-ts";
import { normalizeTokenFromQuery } from "@/lib/auth/normalize-token";
import {
  decodeJwtPayload,
  extractEmailFromPayload,
  isJwtExpired,
  type DecodedJwtPayload,
} from "@/lib/oidc/jwt-utils";
import { extractAllRolesFromPayload } from "@/lib/oidc/roles";
import { getOidcAuthority } from "@/lib/oidc/config-service";
import { isRefreshTokenInvalidGrant } from "@/lib/auth/refresh-token-errors";
import { storeOidcUser } from "@/lib/oidc/auth-service";
import { refreshKeycloakTokensFromApi } from "@/lib/oidc/refresh-tokens";
import { clearInvalidOidcSession } from "@/lib/oidc/session-cleanup";

export type HostTokenInput = {
  access_token?: string;
  id_token?: string;
  refresh_token?: string;
};

export type HostBootstrapResult =
  | {
      ok: true;
      user: User;
      roles: string[];
      email: string;
      tokenRefreshAttempted?: boolean;
      tokenRefreshSucceeded?: boolean;
    }
  | {
      ok: false;
      code: string;
      message: string;
      tokenRefreshAttempted?: boolean;
      tokenRefreshSucceeded?: boolean;
      refreshErrorCode?: string;
    };

const EXPECTED_ISSUER = getOidcAuthority();

export function hasHostTokensInUrl(location: Location = window.location) {
  return parseTokensFromLocation(location) !== null;
}

function parseTokensFromLocation(location: Location): HostTokenInput | null {
  const search = new URLSearchParams(location.search);
  const hash = new URLSearchParams(location.hash.replace(/^#/, ""));

  const access_token = normalizeTokenFromQuery(
    search.get("access_token") ?? hash.get("access_token"),
  );
  const id_token = normalizeTokenFromQuery(
    search.get("id_token") ?? hash.get("id_token"),
  );
  const refresh_token = normalizeTokenFromQuery(
    search.get("refresh_token") ?? hash.get("refresh_token"),
  );

  if (!access_token && !id_token && !refresh_token) {
    return null;
  }

  return {
    access_token: access_token || undefined,
    id_token: id_token || undefined,
    refresh_token: refresh_token || undefined,
  };
}

function tokensNeedRefresh(tokens: HostTokenInput) {
  const identityToken = tokens.id_token ?? tokens.access_token;

  if (identityToken && isJwtExpired(identityToken)) {
    return true;
  }

  if (tokens.access_token && isJwtExpired(tokens.access_token)) {
    return true;
  }

  return false;
}

type FreshHostTokensResult =
  | {
      ok: true;
      tokens: HostTokenInput;
      tokenRefreshAttempted: boolean;
      tokenRefreshSucceeded: boolean;
    }
  | Extract<HostBootstrapResult, { ok: false }>;

async function ensureFreshHostTokens(
  tokens: HostTokenInput,
): Promise<FreshHostTokensResult> {
  if (!tokensNeedRefresh(tokens)) {
    return {
      ok: true,
      tokens,
      tokenRefreshAttempted: false,
      tokenRefreshSucceeded: false,
    };
  }

  if (!tokens.refresh_token) {
    await clearInvalidOidcSession();

    return {
      ok: false,
      code: "host_session_expired",
      message: "Sua sessão expirou. Entre novamente.",
      tokenRefreshAttempted: false,
      tokenRefreshSucceeded: false,
    };
  }

  const refreshed = await refreshKeycloakTokensFromApi(tokens.refresh_token);

  if (!refreshed.ok) {
    await clearInvalidOidcSession();

    const message =
      refreshed.message ??
      "Não foi possível renovar os tokens com o refresh_token.";

    return {
      ok: false,
      code: isRefreshTokenInvalidGrant({
        code: refreshed.code,
        refreshErrorCode: refreshed.refreshErrorCode,
        message,
      })
        ? "host_session_expired"
        : refreshed.code,
      message: isRefreshTokenInvalidGrant({
        code: refreshed.code,
        refreshErrorCode: refreshed.refreshErrorCode,
        message,
      })
        ? "Sua sessão expirou. Entre novamente."
        : message,
      tokenRefreshAttempted: refreshed.tokenRefreshAttempted,
      tokenRefreshSucceeded: false,
      refreshErrorCode: refreshed.refreshErrorCode,
    };
  }

  return {
    ok: true,
    tokens: {
      access_token: refreshed.tokens.access_token,
      id_token: refreshed.tokens.id_token ?? tokens.id_token,
      refresh_token: refreshed.tokens.refresh_token ?? tokens.refresh_token,
    },
    tokenRefreshAttempted: true,
    tokenRefreshSucceeded: true,
  };
}

function validateIssuer(payload: DecodedJwtPayload | null) {
  return payload?.iss === EXPECTED_ISSUER;
}

function buildProfile(
  identity: DecodedJwtPayload,
  roles: string[],
  email: string,
): UserProfile {
  return {
    ...identity,
    sub: String(identity.sub),
    email,
    roles,
    aud: Array.isArray(identity.aud)
      ? identity.aud.map(String)
      : typeof identity.aud === "string"
        ? identity.aud
        : "checkmate-academy-public",
  } as UserProfile;
}

function buildOidcUser(tokens: HostTokenInput) {
  const identityToken = tokens.id_token ?? tokens.access_token;

  if (!identityToken) {
    return {
      ok: false as const,
      code: "missing_token",
      message: "Nenhum token recebido na URL.",
    };
  }

  const identityPayload = decodeJwtPayload(identityToken);
  const accessPayload = tokens.access_token
    ? decodeJwtPayload(tokens.access_token)
    : null;

  if (!identityPayload?.sub) {
    return {
      ok: false as const,
      code: "missing_sub",
      message: "Token sem subject (sub).",
    };
  }

  if (!validateIssuer(identityPayload)) {
    return {
      ok: false as const,
      code: "invalid_issuer",
      message: "Issuer do token inválido.",
    };
  }

  if (isJwtExpired(identityToken)) {
    return {
      ok: false as const,
      code: "token_expired",
      message: "Token expirado.",
    };
  }

  if (tokens.access_token && isJwtExpired(tokens.access_token)) {
    return {
      ok: false as const,
      code: "token_expired",
      message: "Access token expirado.",
    };
  }

  const email =
    extractEmailFromPayload(identityPayload) ??
    extractEmailFromPayload(accessPayload);

  if (!email) {
    return {
      ok: false as const,
      code: "missing_email",
      message: "Token sem email utilizável.",
    };
  }

  const roles = [
    ...new Set([
      ...extractAllRolesFromPayload(identityPayload),
      ...extractAllRolesFromPayload(accessPayload),
    ]),
  ];

  const expSource = tokens.access_token ?? identityToken;
  const exp = decodeJwtPayload(expSource)?.exp;
  const expires_at =
    typeof exp === "number" ? exp : Math.floor(Date.now() / 1000) + 300;

  const user = new User({
    id_token: tokens.id_token ?? identityToken,
    access_token: tokens.access_token ?? identityToken,
    refresh_token: tokens.refresh_token,
    token_type: "Bearer",
    scope: "openid profile email roles",
    expires_at,
    profile: buildProfile(identityPayload, roles, email),
  });

  return {
    ok: true as const,
    user,
    roles,
    email,
  };
}

export function stripHostTokensFromUrl() {
  const url = new URL(window.location.href);

  url.searchParams.delete("access_token");
  url.searchParams.delete("id_token");
  url.searchParams.delete("refresh_token");
  url.hash = "";

  const next = `${url.pathname}${url.search}`;
  window.history.replaceState({}, "", next || "/oidc/login");
}

export async function bootstrapFromHostTokens(
  location: Location = window.location,
  options?: { stripUrl?: boolean },
): Promise<HostBootstrapResult> {
  const tokens = parseTokensFromLocation(location);

  if (!tokens) {
    return {
      ok: false,
      code: "missing_token",
      message: "Nenhum token na URL.",
    };
  }

  const fresh = await ensureFreshHostTokens(tokens);

  if (!fresh.ok) {
    if (fresh.code === "host_session_expired") {
      await clearInvalidOidcSession();
    }

    return fresh;
  }

  const built = buildOidcUser(fresh.tokens);

  if (!built.ok) {
    return {
      ...built,
      tokenRefreshAttempted: fresh.tokenRefreshAttempted,
      tokenRefreshSucceeded: fresh.tokenRefreshSucceeded,
    };
  }

  await storeOidcUser(built.user);

  if (options?.stripUrl !== false) {
    stripHostTokensFromUrl();
  }

  return {
    ok: true,
    user: built.user,
    roles: built.roles,
    email: built.email,
    tokenRefreshAttempted: fresh.tokenRefreshAttempted,
    tokenRefreshSucceeded: fresh.tokenRefreshSucceeded,
  };
}
