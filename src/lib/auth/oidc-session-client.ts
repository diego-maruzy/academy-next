"use client";

import {
  normalizeTokenFromQuery,
  type HostTokenValidationCode,
} from "@/lib/auth/token-inspect";

export type OidcHostTokens = {
  access_token?: string;
  id_token?: string;
  refresh_token?: string;
};

export function parseHostTokensFromLocation(
  location: Location,
): OidcHostTokens | null {
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

  if (!access_token && !id_token) {
    return null;
  }

  return {
    access_token: access_token || undefined,
    id_token: id_token || undefined,
    refresh_token: refresh_token || undefined,
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

export function getSanitizedLocationPath(location: Location) {
  const url = new URL(location.href);

  url.searchParams.delete("access_token");
  url.searchParams.delete("id_token");
  url.searchParams.delete("refresh_token");

  return `${url.pathname}${url.search}`;
}

export type SessionCreateResult = {
  ok: boolean;
  redirect?: string;
  error?: HostTokenValidationCode | "session_failed" | "invalid_body";
  message?: string;
  debug?: {
    code?: string;
    details?: Record<string, unknown>;
  };
};

export async function createAcademySessionFromTokens(
  tokens: OidcHostTokens,
  destination: string,
  options?: { authSource?: string; debug?: boolean },
): Promise<SessionCreateResult> {
  const response = await fetch(
    `/api/oidc/session${options?.debug ? "?debug=1" : ""}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        id_token: tokens.id_token,
        access_token: tokens.access_token,
        next: destination,
        auth_source: options?.authSource ?? "host-tokens",
      }),
    },
  );

  const payload = (await response.json().catch(() => null)) as
    | {
        ok?: boolean;
        redirect?: string;
        error?: SessionCreateResult["error"];
        message?: string;
        debug?: SessionCreateResult["debug"];
      }
    | null;

  if (!response.ok || !payload?.ok) {
    return {
      ok: false,
      error: payload?.error ?? "session_failed",
      message: payload?.message,
      debug: payload?.debug,
    };
  }

  return {
    ok: true,
    redirect: payload.redirect ?? destination,
  };
}

export async function hasAcademySession() {
  try {
    const response = await fetch("/api/auth/session", {
      credentials: "include",
      cache: "no-store",
    });

    if (!response.ok) {
      return false;
    }

    const session = (await response.json()) as { user?: unknown } | null;
    return Boolean(session?.user);
  } catch {
    return false;
  }
}
