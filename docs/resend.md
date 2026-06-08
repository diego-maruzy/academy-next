# Resend — Checkmate Academy Next

Integração server-side com [Resend](https://resend.com). A API key **nunca** deve ir para o front-end.

## Variáveis de ambiente

| Variável | Obrigatória | Descrição |
| --- | --- | --- |
| `RESEND_API_KEY` | Sim (envio real) | Chave da API Resend. Apenas no servidor. |
| `RESEND_FROM_EMAIL` | Sim (teste e produção) | Remetente verificado. Ex.: `Checkmate Academy <academy@checkmateproperty.com>` |
| `ADMIN_TEST_EMAIL` | Sim (rota de teste) | Destinatário fixo do e-mail de teste. |
| `TEST_EMAIL_SECRET` | Sim (rota de teste) | Segredo exigido no header `x-test-secret`. |
| `CHECKMATE_EMAIL_FROM` | Não | Fallback legado se `RESEND_FROM_EMAIL` não estiver definida. |

Configure no `.env.local` para desenvolvimento. **Não commite** `.env.local`.

## Arquivos principais

- `src/lib/resend.ts` — cliente Resend centralizado (server-only)
- `src/lib/email/email-service.ts` — envios de templates/checkout
- `src/app/api/test-resend/route.ts` — rota de teste protegida

## Testar localmente

1. Preencha as variáveis no `.env.local`.
2. Inicie o servidor:

```bash
npm run dev
```

3. Envie o teste:

```bash
curl -X POST http://localhost:3000/api/test-resend \
  -H "x-test-secret: SEU_TEST_EMAIL_SECRET"
```

Resposta esperada:

```json
{ "success": true, "data": { "id": "..." } }
```

O e-mail deve chegar em `ADMIN_TEST_EMAIL`.

## Testar na Vercel

1. Vercel → Project → **Settings** → **Environment Variables**
2. Adicione para **Production**, **Preview** e **Development**:
   - `RESEND_API_KEY`
   - `RESEND_FROM_EMAIL`
   - `ADMIN_TEST_EMAIL`
   - `TEST_EMAIL_SECRET`
3. Faça um novo deploy.
4. Teste:

```bash
curl -X POST https://SUA-URL-VERCEL.vercel.app/api/test-resend \
  -H "x-test-secret: SEU_TEST_EMAIL_SECRET"
```

## Segurança

- Não use `NEXT_PUBLIC_RESEND_API_KEY`.
- A rota `/api/test-resend` envia **somente** para `ADMIN_TEST_EMAIL` (não aceita destinatário na request).
- Exige header `x-test-secret` igual a `TEST_EMAIL_SECRET`.
- Não altere o domínio `play.checkmateproperty.com` até validar envio e DNS do Resend.

## Antes de apontar o domínio

- [ ] E-mail de teste recebido localmente
- [ ] E-mail de teste recebido na Vercel (URL temporária)
- [ ] Domínio `checkmateproperty.com` verificado no Resend (SPF/DKIM)
- [ ] `RESEND_FROM_EMAIL` usando endereço do domínio verificado
- [ ] Variáveis configuradas em Production na Vercel
- [ ] Keycloak e callbacks — **ainda não alterar** até a troca de domínio planejada
