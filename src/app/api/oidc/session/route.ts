import { NextResponse, type NextRequest } from "next/server";
import { createHostSsoSession } from "@/lib/auth/create-host-sso-session";
import { getEmbeddedContextFromSearchParams } from "@/lib/embedded-params";
import { logHostTokenValidation, logOidcSession } from "@/lib/auth/oidc-debug-log";
import { validateHostTokens } from "@/lib/auth/host-token-validation";
import { buildSafeTokenLog } from "@/lib/auth/token-inspect";
import { resolveStudentCallbackUrl } from "@/lib/auth/route-guard";

export const dynamic = "force-dynamic";

type SessionBody = {
  id_token?: string;
  access_token?: string;
  refresh_token?: string;
  next?: string;
  callbackUrl?: string;
  auth_source?: string;
};

function shouldExposeDebugReason(request: NextRequest) {
  if (process.env.NODE_ENV === "development") {
    return true;
  }

  return request.nextUrl.searchParams.get("debug") === "1";
}

export async function POST(request: NextRequest) {
  const userAgent = request.headers.get("user-agent") ?? "";
  let body: SessionBody;

  try {
    body = (await request.json()) as SessionBody;
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const idToken = body.id_token;
  const accessToken = body.access_token;
  const destination = resolveStudentCallbackUrl(
    body.next ?? body.callbackUrl,
  );
  const destinationUrl = new URL(destination, request.nextUrl.origin);
  const embedded = getEmbeddedContextFromSearchParams(destinationUrl.searchParams);
  const authSource = body.auth_source ?? "host-tokens";
  const exposeDebug = shouldExposeDebugReason(request);

  const tokenLog = buildSafeTokenLog({
    accessToken,
    idToken,
    refreshToken: body.refresh_token,
  });

  const validation = await validateHostTokens({
    idToken,
    accessToken,
    refreshToken: body.refresh_token,
    tokenSource: "body",
  });

  logHostTokenValidation({
    userAgent,
    code: validation.ok ? "ok" : validation.code,
    clientId: validation.ok ? validation.clientId : undefined,
    tokenLog,
    embedded,
  });

  if (!validation.ok) {
    logOidcSession({
      userAgent,
      hasSession: false,
      destination,
      source: authSource,
      validationCode: validation.code,
      embedded,
      pathname: "/api/oidc/session",
    });

    return NextResponse.json(
      {
        ok: false,
        error: validation.code,
        message: validation.message,
        ...(exposeDebug
          ? {
              debug: {
                code: validation.code,
                details: validation.details,
                tokens: tokenLog,
              },
            }
          : {}),
      },
      { status: 401 },
    );
  }

  const sessionResult = await createHostSsoSession({
    sub: validation.sub,
    email: validation.email,
    name: validation.name,
    roles: validation.roles.roles,
    ignoredRoles: validation.roles.ignoredRoles,
    appRole: validation.roles.appRole,
    rolesSource: "host-tokens",
  });

  if (!sessionResult.ok) {
    logOidcSession({
      userAgent,
      hasSession: false,
      destination,
      source: authSource,
      validationCode: "session_failed",
      clientId: validation.clientId,
      embedded,
      pathname: "/api/oidc/session",
    });

    return NextResponse.json(
      {
        ok: false,
        error: sessionResult.error,
        ...(exposeDebug
          ? {
              debug: {
                code: sessionResult.error,
                detail: sessionResult.detail,
                tokens: tokenLog,
              },
            }
          : {}),
      },
      { status: 401 },
    );
  }

  logOidcSession({
    userAgent,
    hasSession: true,
    destination,
    source: authSource,
    validationCode: "ok",
    clientId: validation.clientId,
    embedded,
    pathname: "/api/oidc/session",
  });

  return NextResponse.json({
    ok: true,
    redirect: destination,
  });
}
