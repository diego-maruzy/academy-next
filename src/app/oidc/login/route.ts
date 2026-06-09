import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/auth";
import {
  fetchAuthCsrf,
  getKeycloakSignInRedirect,
} from "@/lib/auth/keycloak-signin-redirect";
import {
  buildDashboardBridgeHtml,
  buildKeycloakBridgeHtml,
  buildOidcErrorHtml,
  buildSignInFormHtml,
} from "@/lib/auth/oidc-login-html";
import { resolveStudentCallbackUrl } from "@/lib/auth/route-guard";

export const dynamic = "force-dynamic";

function htmlResponse(
  html: string,
  setCookieHeaders: string[] = [],
  status = 200,
) {
  const response = new NextResponse(html, {
    status,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });

  for (const cookie of setCookieHeaders) {
    response.headers.append("Set-Cookie", cookie);
  }

  return response;
}

export async function GET(request: NextRequest) {
  const session = await auth();
  const redirectTo = resolveStudentCallbackUrl(
    request.nextUrl.searchParams.get("callbackUrl") ??
      request.nextUrl.searchParams.get("next"),
  );

  if (session?.user) {
    const dashboardUrl = new URL(redirectTo, request.url).toString();
    return htmlResponse(buildDashboardBridgeHtml(dashboardUrl));
  }

  const signInRedirect = await getKeycloakSignInRedirect(
    request.nextUrl.origin,
    request.headers.get("cookie"),
    redirectTo,
  );

  if (signInRedirect) {
    return htmlResponse(
      buildKeycloakBridgeHtml(signInRedirect.url),
      signInRedirect.setCookieHeaders,
    );
  }

  const csrf = await fetchAuthCsrf(
    request.nextUrl.origin,
    request.headers.get("cookie"),
  );

  if (!csrf) {
    return htmlResponse(buildOidcErrorHtml(), [], 500);
  }

  return htmlResponse(
    buildSignInFormHtml(
      request.nextUrl.origin,
      redirectTo,
      csrf.csrfToken,
    ),
    csrf.setCookieHeaders,
  );
}
