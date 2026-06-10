function getKeycloakIssuer() {
  return (
    process.env.KEYCLOAK_ISSUER ??
    "https://auth.checkmateproperty.com/realms/Checkmate"
  );
}

function getKeycloakClientId() {
  return (
    process.env.KEYCLOAK_PUBLIC_CLIENT_ID ??
    process.env.NEXT_PUBLIC_KEYCLOAK_PUBLIC_CLIENT_ID ??
    "checkmate-academy-public"
  );
}

export type KeycloakRefreshSuccess = {
  ok: true;
  access_token: string;
  id_token?: string;
  refresh_token?: string;
  expires_in?: number;
  token_type?: string;
};

export type KeycloakRefreshFailure = {
  ok: false;
  code: "refresh_token_expired_or_invalid" | "refresh_request_failed";
  message: string;
  refreshErrorCode?: string;
};

export type KeycloakRefreshResult =
  | KeycloakRefreshSuccess
  | KeycloakRefreshFailure;

type KeycloakTokenResponse = {
  access_token?: string;
  id_token?: string;
  refresh_token?: string;
  expires_in?: number;
  token_type?: string;
  error?: string;
  error_description?: string;
};

export async function refreshKeycloakTokens(
  refreshToken: string,
): Promise<KeycloakRefreshResult> {
  const issuer = getKeycloakIssuer().replace(/\/$/, "");
  const clientId = getKeycloakClientId();

  const body = new URLSearchParams({
    grant_type: "refresh_token",
    client_id: clientId,
    refresh_token: refreshToken,
  });

  let response: Response;

  try {
    response = await fetch(`${issuer}/protocol/openid-connect/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
      cache: "no-store",
    });
  } catch {
    return {
      ok: false,
      code: "refresh_request_failed",
      message: "Falha de rede ao renovar tokens no Keycloak.",
      refreshErrorCode: "network_error",
    };
  }

  const payload = (await response.json().catch(() => null)) as
    | KeycloakTokenResponse
    | null;

  if (!response.ok || !payload?.access_token) {
    const refreshErrorCode = payload?.error ?? `http_${response.status}`;

    return {
      ok: false,
      code: "refresh_token_expired_or_invalid",
      message:
        payload?.error_description ??
        "Refresh token expirado ou inválido.",
      refreshErrorCode,
    };
  }

  return {
    ok: true,
    access_token: payload.access_token,
    id_token: payload.id_token,
    refresh_token: payload.refresh_token,
    expires_in: payload.expires_in,
    token_type: payload.token_type,
  };
}
