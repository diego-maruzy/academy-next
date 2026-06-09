import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/auth";
import {
  fetchAuthCsrf,
  getKeycloakSignInRedirect,
} from "@/lib/auth/keycloak-signin-redirect";
import { resolveStudentCallbackUrl } from "@/lib/auth/route-guard";

export const dynamic = "force-dynamic";

function withSetCookies(response: NextResponse, setCookieHeaders: string[]) {
  for (const cookie of setCookieHeaders) {
    response.headers.append("Set-Cookie", cookie);
  }

  return response;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function fallbackHtml(origin: string, redirectTo: string, csrfToken: string) {
  const safeOrigin = escapeHtml(origin);
  const safeRedirectTo = escapeHtml(redirectTo);
  const safeCsrfToken = escapeHtml(csrfToken);

  return `<!DOCTYPE html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Login | Checkmate Academy</title>
    <style>
      body { margin: 0; min-height: 100vh; display: grid; place-items: center; background: #050814; color: #fff; font-family: system-ui, sans-serif; }
      .card { width: min(92vw, 28rem); border: 1px solid rgba(255,255,255,.1); border-radius: 1.5rem; padding: 2rem; text-align: center; background: rgba(255,255,255,.04); }
      button { width: 100%; height: 2.75rem; border: 0; border-radius: .75rem; background: #3b82f6; color: #fff; font-weight: 600; cursor: pointer; }
      p { color: #94a3b8; font-size: .9rem; line-height: 1.5; }
    </style>
  </head>
  <body onload="document.getElementById('oidc-login-form').submit()">
    <div class="card">
      <p style="letter-spacing:.28em;text-transform:uppercase;font-size:.7rem;color:#64748b;">Checkmate Academy</p>
      <h1 style="font-size:1.15rem;margin:1rem 0 .5rem;">Redirecionando para o acesso Checkmate...</h1>
      <p>Aguarde um instante enquanto conectamos sua conta.</p>
      <form id="oidc-login-form" method="POST" action="${safeOrigin}/api/auth/signin/keycloak">
        <input type="hidden" name="callbackUrl" value="${safeRedirectTo}" />
        <input type="hidden" name="csrfToken" value="${safeCsrfToken}" />
        <noscript>
          <button type="submit" style="margin-top:1.5rem;">Continuar login</button>
        </noscript>
      </form>
    </div>
  </body>
</html>`;
}

export async function GET(request: NextRequest) {
  const session = await auth();
  const redirectTo = resolveStudentCallbackUrl(
    request.nextUrl.searchParams.get("callbackUrl") ??
      request.nextUrl.searchParams.get("next"),
  );

  if (session?.user) {
    return NextResponse.redirect(new URL(redirectTo, request.url));
  }

  const signInRedirect = await getKeycloakSignInRedirect(
    request.nextUrl.origin,
    request.headers.get("cookie"),
    redirectTo,
  );

  if (signInRedirect) {
    return withSetCookies(
      NextResponse.redirect(signInRedirect.url),
      signInRedirect.setCookieHeaders,
    );
  }

  const csrf = await fetchAuthCsrf(
    request.nextUrl.origin,
    request.headers.get("cookie"),
  );

  if (!csrf) {
    return new NextResponse("Não foi possível iniciar o login.", { status: 500 });
  }

  const response = new NextResponse(
    fallbackHtml(request.nextUrl.origin, redirectTo, csrf.csrfToken),
    {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
      },
    },
  );

  for (const cookie of csrf.setCookieHeaders) {
    response.headers.append("Set-Cookie", cookie);
  }

  return response;
}
