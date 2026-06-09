import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/auth";
import { getKeycloakSignInRedirect } from "@/lib/auth/keycloak-signin-redirect";
import { buildOidcSignInCallbackPath } from "@/lib/auth/oidc-callback-url";
import { logOidcStart } from "@/lib/auth/oidc-debug-log";
import { resolveStudentCallbackUrl } from "@/lib/auth/route-guard";

export const dynamic = "force-dynamic";

function withSetCookies(response: NextResponse, setCookieHeaders: string[]) {
  for (const cookie of setCookieHeaders) {
    response.headers.append("Set-Cookie", cookie);
  }

  return response;
}

export async function GET(request: NextRequest) {
  const session = await auth();
  const userAgent = request.headers.get("user-agent") ?? "";
  const destination = resolveStudentCallbackUrl(
    request.nextUrl.searchParams.get("next") ??
      request.nextUrl.searchParams.get("callbackUrl"),
  );

  if (session?.user) {
    logOidcStart({
      userAgent,
      hasSession: true,
      destination,
      redirected: true,
    });

    return NextResponse.redirect(new URL(destination, request.url));
  }

  const signInCallbackPath = buildOidcSignInCallbackPath(destination);
  const signInRedirect = await getKeycloakSignInRedirect(
    request.nextUrl.origin,
    request.headers.get("cookie"),
    signInCallbackPath,
  );

  if (signInRedirect) {
    logOidcStart({
      userAgent,
      hasSession: false,
      destination,
      redirected: true,
    });

    return withSetCookies(
      NextResponse.redirect(signInRedirect.url),
      signInRedirect.setCookieHeaders,
    );
  }

  logOidcStart({
    userAgent,
    hasSession: false,
    destination,
    redirected: false,
  });

  const fallbackUrl = new URL("/oidc/login", request.url);
  fallbackUrl.searchParams.set("error", "start");
  fallbackUrl.searchParams.set("next", destination);

  return NextResponse.redirect(fallbackUrl);
}
