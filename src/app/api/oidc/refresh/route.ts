import { NextResponse, type NextRequest } from "next/server";
import { refreshKeycloakTokens } from "@/lib/auth/keycloak-token-refresh";
import { normalizeTokenFromEnv } from "@/lib/auth/normalize-token";

export const dynamic = "force-dynamic";

type RefreshBody = {
  refresh_token?: string;
};

export async function POST(request: NextRequest) {
  let body: RefreshBody;

  try {
    body = (await request.json()) as RefreshBody;
  } catch {
    return NextResponse.json(
      { ok: false, code: "invalid_body" },
      { status: 400 },
    );
  }

  const refreshToken = normalizeTokenFromEnv(body.refresh_token);

  if (!refreshToken) {
    return NextResponse.json(
      {
        ok: false,
        code: "missing_refresh_token",
        tokenRefreshAttempted: false,
        tokenRefreshSucceeded: false,
      },
      { status: 400 },
    );
  }

  const refreshed = await refreshKeycloakTokens(refreshToken);

  if (!refreshed.ok) {
    return NextResponse.json(
      {
        ok: false,
        code: refreshed.code,
        message: refreshed.message,
        tokenRefreshAttempted: true,
        tokenRefreshSucceeded: false,
        refreshErrorCode: refreshed.refreshErrorCode,
      },
      { status: 401 },
    );
  }

  return NextResponse.json({
    ok: true,
    access_token: refreshed.access_token,
    id_token: refreshed.id_token,
    expires_in: refreshed.expires_in,
    token_type: refreshed.token_type,
    tokenRefreshAttempted: true,
    tokenRefreshSucceeded: true,
  });
}
