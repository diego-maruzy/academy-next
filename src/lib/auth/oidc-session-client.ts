"use client";

export type OidcHostTokens = {
  access_token: string;
  id_token: string;
};

export function parseHostTokensFromLocation(location: Location): OidcHostTokens | null {
  const search = new URLSearchParams(location.search);
  const hash = new URLSearchParams(location.hash.replace(/^#/, ""));

  const access_token =
    search.get("access_token") ?? hash.get("access_token") ?? "";
  const id_token = search.get("id_token") ?? hash.get("id_token") ?? "";

  if (!access_token || !id_token) {
    return null;
  }

  return { access_token, id_token };
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

export async function createAcademySessionFromTokens(
  tokens: OidcHostTokens,
  destination: string,
): Promise<{ ok: boolean; redirect?: string; error?: string }> {
  const response = await fetch("/api/oidc/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({
      id_token: tokens.id_token,
      access_token: tokens.access_token,
      next: destination,
    }),
  });

  const payload = (await response.json().catch(() => null)) as
    | { ok?: boolean; redirect?: string; error?: string }
    | null;

  if (!response.ok || !payload?.ok) {
    return {
      ok: false,
      error: payload?.error ?? "session_failed",
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
