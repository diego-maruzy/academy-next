# Keycloak SSO — área do aluno

Autenticação via **Auth.js (NextAuth v5)** com Keycloak, client público e **PKCE** (sem `client_secret`).

> Login admin/equipe: [docs/admin-auth.md](admin-auth.md) — fluxo separado em `/admin/login`.

## Dois fluxos

| Área | Login | Sessão |
| --- | --- | --- |
| Aluno (`/dashboard`, `/programas`, `/reels`) | `/login` → Keycloak | cookie Auth.js |
| Admin/equipe (`/admin`, `/clientes`…) | `/admin/login` → email/senha | `checkmate_admin_session` |

Roles do Keycloak **não** abrem o painel admin. Mesmo `ROLE_ADMIN` no Keycloak exige login separado em `/admin/login` para acessar `/dashboard`.

## Variáveis de ambiente

| Variável | Obrigatória | Exemplo |
| --- | --- | --- |
| `KEYCLOAK_ISSUER` | Sim | `https://auth.checkmateproperty.com/realms/Checkmate` |
| `KEYCLOAK_CLIENT_ID` | Sim | `checkmate-next` |
| `AUTH_SECRET` | Sim | `npm run generate:auth-secret` |
| `AUTH_URL` | Sim (prod) | `https://academy-next-pi.vercel.app` |
| `APP_URL` | Recomendado | mesma URL pública |

**Não configure** `KEYCLOAK_CLIENT_SECRET`.

## Redirect URIs no Keycloak

- `https://academy-next-pi.vercel.app/api/auth/callback/keycloak`
- `https://play.checkmateproperty.com/api/auth/callback/keycloak`
- `http://localhost:3000/api/auth/callback/keycloak` (dev)

## Roles (área do aluno)

| Role Keycloak | App role | Acesso |
| --- | --- | --- |
| `ROLE_USER_FREE` | `free` | `/dashboard`, `/programas`, `/reels` |
| `ROLE_USER` | `premium` | + conteúdo premium |

## Testar localmente

```bash
npm run dev
```

1. Aba anônima → `http://localhost:3000/dashboard` → `/login`
2. **Entrar com Checkmate** → Keycloak
3. Volta para `/dashboard`
4. Confira `/auth-debug`

`/dashboard` **não** usa Keycloak — redireciona para `/admin/login`.

## Testar na Vercel

```text
https://academy-next-pi.vercel.app/programas
https://academy-next-pi.vercel.app/login
https://academy-next-pi.vercel.app/auth-debug
```

## SSO com Checkmate Property

1. Login no Property (mesmo realm Keycloak).
2. Abra `/login` na Academy no mesmo browser.
3. SSO deve autenticar sem pedir senha novamente.

## Link “Acessar Academy” (Property → Academy)

URL de entrada (mesma aba, sem popup):

`https://play.checkmateproperty.com/oidc/login`

**Correto (HTML):**

```html
<a href="https://play.checkmateproperty.com/oidc/login">Acessar Academy</a>
```

**Correto (React/JS):**

```ts
window.location.href = "https://play.checkmateproperty.com/oidc/login";
```

**Evitar:**

- `target="_blank"`
- `window.open(...)`
- `rel="noopener"` em link que abre nova aba

No app Property (`app.checkmateproperty.com`), o botão deve substituir a página atual — não abrir nova aba nem popup.

Variável opcional neste projeto:

`NEXT_PUBLIC_ACADEMY_OIDC_LOGIN_URL=https://play.checkmateproperty.com/oidc/login`

## Logout aluno

Encerrar sessão Keycloak: usar sign-out do Auth.js (quando exposto na UI do aluno). O botão **Sair** do painel admin só limpa a sessão admin.

## PKCE

Sem client secret, Auth.js usa **Authorization Code + PKCE** automaticamente.
