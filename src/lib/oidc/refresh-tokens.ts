"use client";

import type { HostTokenInput } from "@/lib/oidc/host-sso";

export type ClientRefreshResult =
  | {
      ok: true;
      tokens: HostTokenInput;
      tokenRefreshAttempted: true;
      tokenRefreshSucceeded: true;
    }
  | {
      ok: false;
      code: string;
      message?: string;
      tokenRefreshAttempted: boolean;
      tokenRefreshSucceeded: false;
      refreshErrorCode?: string;
    };

export async function refreshKeycloakTokensFromApi(
  refreshToken: string,
): Promise<ClientRefreshResult> {
  const response = await fetch("/api/oidc/refresh", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ refresh_token: refreshToken }),
  });

  const payload = (await response.json().catch(() => null)) as
    | {
        ok?: boolean;
        access_token?: string;
        id_token?: string;
        refresh_token?: string;
        code?: string;
        message?: string;
        refreshErrorCode?: string;
        tokenRefreshAttempted?: boolean;
        tokenRefreshSucceeded?: boolean;
      }
    | null;

  if (!response.ok || !payload?.ok || !payload.access_token) {
    return {
      ok: false,
      code: payload?.code ?? "refresh_token_expired_or_invalid",
      message: payload?.message,
      tokenRefreshAttempted: payload?.tokenRefreshAttempted ?? true,
      tokenRefreshSucceeded: false,
      refreshErrorCode: payload?.refreshErrorCode,
    };
  }

  return {
    ok: true,
    tokens: {
      access_token: payload.access_token,
      id_token: payload.id_token,
      refresh_token: refreshToken,
    },
    tokenRefreshAttempted: true,
    tokenRefreshSucceeded: true,
  };
}
