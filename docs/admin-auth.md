# Login admin/equipe

Autenticação própria por **email e senha**, separada do Keycloak.

## Rotas

| Rota | Proteção |
| --- | --- |
| `/admin/login` | Pública |
| `/dashboard`, `/clientes`, `/equipe`, `/admin/*`, `/pagamentos`, `/conexoes`, `/configuracoes`, `/administrador` | Cookie `checkmate_admin_session` |

## Banco de dados

Tabela: **`team_members`** (Supabase)

Campos usados no login:
- `email`
- `password_hash` (bcrypt)
- `full_name`
- `role`
- `permission` (`admin_access`, `academy_access`, `support_access`)
- `status` (`active` / `inactive`)
- `last_login_at`

Migration: `supabase/team-members-auth.sql`

## Variáveis de ambiente

```env
ADMIN_SESSION_SECRET=uma_chave_longa_aleatoria_com_no_minimo_32_caracteres
```

Gere uma chave forte e única. Não reutilize `AUTH_SECRET` do Keycloak.

## Criar ou resetar senha

```bash
npm run reset:admin-password -- email@checkmate.com MinhaSenha123
```

O membro precisa existir em `team_members` com `status = active`.

## Testar login admin

```bash
npm run dev
```

1. Aba anônima → `http://localhost:3000/admin/login`
2. Email + senha → redireciona para `/dashboard`
3. Logout no header → volta para `/admin/login`

Via API:

```bash
curl -X POST http://localhost:3000/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"email":"email@checkmate.com","password":"MinhaSenha123"}'
```

```bash
curl -X POST http://localhost:3000/api/admin/logout
```

## Permissões

| `permission` | Acesso |
| --- | --- |
| `admin_access` | Painel completo |
| `academy_access` | `/dashboard`, `/clientes` |
| `support_access` | `/dashboard`, `/clientes` |

## Importante

- Keycloak **não** concede acesso ao painel admin.
- Logout admin **não** encerra sessão Keycloak.
- Sessão admin: cookie httpOnly, `Secure` em produção, `SameSite=Lax`.
