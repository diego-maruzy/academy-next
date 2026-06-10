# Host SSO — teste local/preview sem app mobile

Rota temporária para validar o fluxo **Host SSO** (tokens do Property/Lovable) sem depender do WebView mobile.

> **Remover antes da produção final.** Não deixe `OIDC_TEST_ENABLED=true` no deploy principal.

## O que a rota faz

`GET /api/oidc/test-host-session`

1. Lê tokens **somente** de variáveis de ambiente server-side
2. Valida com a mesma lógica de `/api/oidc/session`
3. Cria sessão Auth.js via provider interno `host-sso` (`provider: oidc-host`, `source: host-tokens`)
4. Redireciona para `/dashboard` se tudo passar

A rota **não funciona** sem `OIDC_TEST_ENABLED=true`.

## Configurar `.env.local`

```env
OIDC_TEST_ENABLED=true

# Cole tokens reais temporariamente (server-side apenas)
OIDC_TEST_ACCESS_TOKEN=eyJhbGciOi...
OIDC_TEST_ID_TOKEN=eyJhbGciOi...
# Opcional — não é usado para criar sessão
OIDC_TEST_REFRESH_TOKEN=

# Keycloak (necessário para validação JWKS)
KEYCLOAK_ISSUER=https://auth.checkmateproperty.com/realms/Checkmate
KEYCLOAK_CLIENT_ID=checkmate-academy-public
KEYCLOAK_PUBLIC_CLIENT_ID=checkmate-academy-public
KEYCLOAK_HOST_CLIENT_IDS=checkmate-academy-public,checkmate-property-public,checkmate-property-private
AUTH_SECRET=...

# Opcional — teste do bridge Supabase sem tokens OIDC
OIDC_TEST_EMAIL=seu@email.com
OIDC_TEST_SUB=uuid-do-keycloak-sub
```

### Testar bridge Supabase isolado

```text
GET /api/oidc/test-supabase-bridge
```

Resposta esperada:

```json
{
  "ok": true,
  "authUserEnsured": true,
  "magicLinkGenerated": true,
  "hasHashedToken": true
}
```

Requer `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
```

**Importante:**

- Não use prefixo `NEXT_PUBLIC_` nos tokens
- Não commite tokens no git
- Tokens expiram — defina também `OIDC_TEST_REFRESH_TOKEN`; a rota renova automaticamente via Keycloak
- O Keycloak pode **invalidar o refresh_token após o primeiro uso** (rotação). Se `/api/oidc/test-host-session` retornar `refresh_token_expired_or_invalid` / `invalid_grant` / `Session not active`, pegue tokens novos no Lovable após logout/login e atualize o `.env.local`
- Cole o token **sem aspas** e **sem** prefixo `Bearer ` (a normalização remove isso automaticamente)
- Não quebre linhas no meio do JWT — use uma linha só por variável

## Testar localmente

```bash
npm run dev
```

Abra no navegador:

```text
http://localhost:3000/api/oidc/test-host-session
```

### Sucesso esperado

- Redirect para `/dashboard`
- `/auth-debug` mostra:
  - **Provider:** `oidc-host`
  - **Source:** `host-tokens`
  - **Roles:** `ROLE_USER_FREE`
  - **App role:** `free`

### Falha

A rota retorna JSON **sem tokens**:

```json
{
  "ok": false,
  "code": "token_expired",
  "message": "Token expirado.",
  "validationStep": "jwt_validation",
  "failedTokenType": "id_token",
  "tokenKid": "1ZX3ZCdkTTbKDjaZJy3SLA9bgajfeL6HvWNNdq8RjOM",
  "tokenAlg": "RS256",
  "jwksUrl": "https://auth.checkmateproperty.com/realms/Checkmate/protocol/openid-connect/certs",
  "issuer": "https://auth.checkmateproperty.com/realms/Checkmate",
  "aud": "checkmate-academy-public",
  "azp": "checkmate-academy-public",
  "hasEmail": true,
  "hasSub": true,
  "rolesFound": ["ROLE_USER_FREE"]
}
```

Códigos comuns em `jwt_validation`:

| `code` | Causa provável |
|--------|----------------|
| `token_expired` | Tokens expirados e sem `OIDC_TEST_REFRESH_TOKEN` válido |
| `refresh_token_expired_or_invalid` | Refresh token expirou, já foi usado (rotação Keycloak) ou sessão inativa — gere novos tokens no Lovable após logout/login |
| `jwks_kid_not_found` | `kid` do JWT não está no JWKS (rotação de chave) |
| `signature_invalid` | Assinatura RS256 inválida (token corrompido no env) |
| `invalid_audience` | `aud`/`azp` fora dos clients permitidos |

Exemplo quando o refresh_token já foi consumido:

```json
{
  "ok": false,
  "code": "refresh_token_expired_or_invalid",
  "message": "Session not active",
  "tokenRefreshAttempted": true,
  "tokenRefreshSucceeded": false,
  "refreshErrorCode": "invalid_grant"
}
```

No fluxo real (`/oidc/login`), esse caso vira `host_session_expired` no browser: limpa localStorage/URL e mostra "Entrar novamente" no WebView (sem abrir Keycloak automaticamente).

`validationStep` pode ser:

| Step | Significado |
|------|-------------|
| `env_check` | Rota desabilitada (`OIDC_TEST_ENABLED` ≠ `true`) |
| `token_presence` | Env sem `OIDC_TEST_ACCESS_TOKEN` / `OIDC_TEST_ID_TOKEN` |
| `jwt_validation` | Falha em assinatura, `aud`/`azp`, exp, email, etc. |
| `session_create` | Tokens OK, mas Auth.js não criou cookie |
| `redirect_dashboard` | Sucesso (só em logs server) |

## Testar na Vercel Preview

1. Em **Environment Variables** do Preview, adicione as mesmas vars
2. Defina `OIDC_TEST_ENABLED=true` **apenas no Preview**
3. Acesse:
   `https://<preview-url>/api/oidc/test-host-session`

Não habilite em **Production**.

## Token de referência (estrutura esperada)

**access_token**

- `iss`: `https://auth.checkmateproperty.com/realms/Checkmate`
- `aud`: inclui `account`, `checkmate-property-public`, etc.
- `azp`: `checkmate-academy-public`
- `resource_access["checkmate-academy-public"].roles`: `["ROLE_USER_FREE"]`

**id_token**

- `aud`: `checkmate-academy-public`
- `azp`: `checkmate-academy-public`

## Remover depois do teste

1. Apague ou desative no ambiente:
   - `OIDC_TEST_ENABLED`
   - `OIDC_TEST_ACCESS_TOKEN`
   - `OIDC_TEST_ID_TOKEN`
   - `OIDC_TEST_REFRESH_TOKEN`
2. Remova o arquivo:
   - `src/app/api/oidc/test-host-session/route.ts`
   - `src/lib/auth/oidc-test-config.ts`
3. Remova a entrada em `isKeycloakApiPath` e este documento, se não for mais necessário
