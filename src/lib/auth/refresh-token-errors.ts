export function isRefreshTokenInvalidGrant(input: {
  code?: string;
  refreshErrorCode?: string;
  message?: string;
}) {
  const code = input.code?.toLowerCase();
  const refreshErrorCode = input.refreshErrorCode?.toLowerCase();
  const message = (input.message ?? "").toLowerCase();

  if (code === "refresh_token_expired_or_invalid") {
    return true;
  }

  if (refreshErrorCode === "invalid_grant") {
    return true;
  }

  return (
    message.includes("session not active") ||
    message.includes("invalid refresh") ||
    message.includes("refresh token")
  );
}

/** Erro de sessão host expirada — usado no browser (não na rota de teste). */
export function isHostSessionExpiredError(input: {
  code?: string;
  refreshErrorCode?: string;
  message?: string;
}) {
  if (input.code === "host_session_expired") {
    return true;
  }

  if (input.code === "token_expired") {
    return true;
  }

  return isRefreshTokenInvalidGrant(input);
}
