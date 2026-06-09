import { NextResponse, type NextRequest } from "next/server";
import {
  getHostClientAuthorizationRule,
  validateHostTokens,
} from "@/lib/auth/host-token-validation";
import { buildSafeTokenLog } from "@/lib/auth/token-inspect";

export const dynamic = "force-dynamic";

type DiagnoseBody = {
  id_token?: string;
  access_token?: string;
  refresh_token?: string;
};

export async function POST(request: NextRequest) {
  const userAgent = request.headers.get("user-agent") ?? "";
  let body: DiagnoseBody;

  try {
    body = (await request.json()) as DiagnoseBody;
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const tokenLog = buildSafeTokenLog({
    accessToken: body.access_token,
    idToken: body.id_token,
    refreshToken: body.refresh_token,
  });

  const validation = await validateHostTokens({
    idToken: body.id_token,
    accessToken: body.access_token,
  });

  return NextResponse.json({
    userAgent,
    authorizationRule: getHostClientAuthorizationRule(),
    tokenPresence: tokenLog,
    validation: validation.ok
      ? {
          ok: true,
          clientId: validation.clientId,
          claims: validation.claims,
          email: validation.email,
          sub: validation.sub,
          roles: validation.roles.roles,
          appRole: validation.roles.appRole,
        }
      : {
          ok: false,
          code: validation.code,
          message: validation.message,
          details: validation.details,
        },
  });
}
