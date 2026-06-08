# Keycloak SSO — Checkmate Academy Next

Autenticação via **Auth.js (NextAuth v5)** com Keycloak, client público e **PKCE** (sem `client_secret`).

## Variáveis de ambiente

| Variável | Obrigatória | Exemplo |
| --- | --- | --- |
| `KEYCLOAK_ISSUER` | Sim | `https://auth.checkmateproperty.com/realms/Checkmate` |
| `KEYCLOAK_CLIENT_ID` | Sim | `checkmate-next` |
| `AUTH_SECRET` | Sim | gere com `npm run generate:auth-secret` |
| `AUTH_URL` | Sim (prod) | `https://academy-next-pi.vercel.app` |
| `APP_URL` | Recomendado | mesma URL pública do app |

**Não configure** `KEYCLOAK_CLIENT_SECRET` — o client é público.

## Keycloak (client `checkmate-next`)

- Standard flow: ON
- Client authentication: OFF
- Valid redirect URIs:
  - `https://academy-next-pi.vercel.app/api/auth/callback/keycloak`
  - `https://play.checkmateproperty.com/api/auth/callback/keycloak`
  - `http://localhost:3000/api/auth/callback/keycloak` (dev)

## Roles mapeadas

| Role Keycloak | App role | Acesso |
| --- | --- | --- |
| `ROLE_USER_FREE` | `free` | `/programas`, `/reels` |
| `ROLE_USER` | `premium` | `/programas`, `/reels` + conteúdo premium |
| `ROLE_ADMIN` / `admin` | `admin` | painel admin completo |

Roles extras opcionais: `academy_access`, `support_access`.

## Testar localmente

1. Configure `.env.local` com as variáveis acima.
2. Adicione redirect URI local no Keycloak.
3. Rode:

```bash
npm run dev
```

4. Acesse `http://localhost:3000/dashboard` → redireciona para `/login`.
5. Clique em **Entrar com Checkmate**.
6. Após login, confira `/auth-debug`.

## Testar na Vercel

1. Vercel → Settings → Environment Variables:
   - `KEYCLOAK_ISSUER`
   - `KEYCLOAK_CLIENT_ID`
   - `AUTH_SECRET`
   - `AUTH_URL=https://academy-next-pi.vercel.app`
   - `APP_URL=https://academy-next-pi.vercel.app`
2. Deploy.
3. Acesse `https://academy-next-pi.vercel.app/dashboard`.

## SSO com Checkmate Property

1. Faça login no sistema Property (mesmo Keycloak/realm).
2. Abra a Academy na mesma sessão do browser.
3. Clique em entrar — o Keycloak deve reutilizar a sessão SSO sem pedir credenciais novamente.

## Logout

O botão **Sair** no header encerra a sessão Auth.js e redireciona para `/login`.

## Rotas

- `/login` — botão Entrar com Checkmate
- `/api/auth/callback/keycloak` — callback OIDC
- `/auth-debug` — debug temporário (sem tokens completos)

## PKCE / public client

Auth.js usa OIDC com PKCE automaticamente quando **não há client secret**. O fluxo é Authorization Code + PKCE, adequado para client público SPA/Next.js.
