export function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

const BASE_STYLES = `
  * { box-sizing: border-box; }
  body {
    margin: 0;
    min-height: 100vh;
    min-height: 100dvh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
    background: #0f172a;
    color: #f8fafc;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    -webkit-font-smoothing: antialiased;
  }
  .card {
    width: 100%;
    max-width: 24rem;
    padding: 2rem 1.5rem;
    border-radius: 1.25rem;
    background: #1e293b;
    border: 1px solid rgba(255,255,255,0.12);
    text-align: center;
  }
  .logo {
    width: 3.5rem;
    height: 3.5rem;
    margin: 0 auto 1rem;
    border-radius: 1rem;
    background: #3b82f6;
    line-height: 3.5rem;
    font-size: 1.5rem;
    font-weight: 800;
  }
  h1 { font-size: 1.125rem; margin: 0.75rem 0 0.5rem; font-weight: 600; }
  p { margin: 0; color: #94a3b8; font-size: 0.9rem; line-height: 1.5; }
  .eyebrow {
    font-size: 0.65rem;
    letter-spacing: 0.24em;
    text-transform: uppercase;
    color: #64748b;
  }
  .action {
    display: inline-block;
    margin-top: 1.5rem;
    padding: 0.75rem 1.25rem;
    border-radius: 0.75rem;
    background: #3b82f6;
    color: #fff;
    text-decoration: none;
    font-weight: 600;
    font-size: 0.9rem;
    border: 0;
    cursor: pointer;
  }
  .spinner {
    width: 1.25rem;
    height: 1.25rem;
    margin: 1.25rem auto 0;
    border: 2px solid #475569;
    border-top-color: #38bdf8;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }
`;

export function buildKeycloakBridgeHtml(keycloakUrl: string) {
  const safeUrl = escapeHtml(keycloakUrl);
  const jsUrl = JSON.stringify(keycloakUrl);

  return `<!DOCTYPE html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
    <meta name="color-scheme" content="dark" />
    <meta http-equiv="refresh" content="0;url=${safeUrl}" />
    <title>Checkmate Academy</title>
    <style>${BASE_STYLES}</style>
  </head>
  <body>
    <div class="card">
      <div class="logo">C</div>
      <p class="eyebrow">Checkmate Academy</p>
      <h1>Redirecionando para o acesso Checkmate...</h1>
      <p>Aguarde um instante enquanto conectamos sua conta.</p>
      <div class="spinner" aria-hidden="true"></div>
      <a class="action" href="${safeUrl}">Continuar login</a>
    </div>
    <script>window.location.replace(${jsUrl});</script>
  </body>
</html>`;
}

export function buildDashboardBridgeHtml(dashboardUrl: string) {
  const safeUrl = escapeHtml(dashboardUrl);
  const jsUrl = JSON.stringify(dashboardUrl);

  return `<!DOCTYPE html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
    <meta name="color-scheme" content="dark" />
    <meta http-equiv="refresh" content="0;url=${safeUrl}" />
    <title>Checkmate Academy</title>
    <style>${BASE_STYLES}</style>
  </head>
  <body>
    <div class="card">
      <div class="logo">C</div>
      <p class="eyebrow">Checkmate Academy</p>
      <h1>Abrindo sua Academy...</h1>
      <p>Aguarde um instante.</p>
      <div class="spinner" aria-hidden="true"></div>
      <a class="action" href="${safeUrl}">Continuar</a>
    </div>
    <script>window.location.replace(${jsUrl});</script>
  </body>
</html>`;
}

export function buildOidcErrorHtml() {
  return `<!DOCTYPE html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
    <meta name="color-scheme" content="dark" />
    <title>Checkmate Academy</title>
    <style>${BASE_STYLES}</style>
  </head>
  <body>
    <div class="card">
      <div class="logo">C</div>
      <p class="eyebrow">Checkmate Academy</p>
      <h1>Não foi possível iniciar o login.</h1>
      <p>Tente novamente em alguns instantes.</p>
      <a class="action" href="/oidc/login">Tentar novamente</a>
    </div>
  </body>
</html>`;
}

export function buildSignInFormHtml(
  origin: string,
  redirectTo: string,
  csrfToken: string,
) {
  const safeOrigin = escapeHtml(origin);
  const safeRedirectTo = escapeHtml(redirectTo);
  const safeCsrfToken = escapeHtml(csrfToken);

  return `<!DOCTYPE html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
    <meta name="color-scheme" content="dark" />
    <title>Checkmate Academy</title>
    <style>${BASE_STYLES}</style>
  </head>
  <body>
    <div class="card">
      <div class="logo">C</div>
      <p class="eyebrow">Checkmate Academy</p>
      <h1>Redirecionando para o acesso Checkmate...</h1>
      <p>Aguarde um instante enquanto conectamos sua conta.</p>
      <form id="oidc-login-form" method="POST" action="${safeOrigin}/api/auth/signin/keycloak">
        <input type="hidden" name="callbackUrl" value="${safeRedirectTo}" />
        <input type="hidden" name="csrfToken" value="${safeCsrfToken}" />
        <button class="action" type="submit">Continuar login</button>
      </form>
    </div>
    <script>
      setTimeout(function () {
        var form = document.getElementById("oidc-login-form");
        if (form) form.submit();
      }, 300);
    </script>
  </body>
</html>`;
}
