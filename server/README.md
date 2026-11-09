# Servidor (Express + TypeScript)

Implementação do protocolo da turma (`../protocolo/protocolo-cliente-servidor.yaml`).
Contexto e decisões de arquitetura: `../claude.md`.

## Primeira vez

```bash
npm install
cp .env.example .env        # ajuste HOST/PORT e os dados do ADM se quiser
npm run db:migrate          # cria o SQLite (prisma/dev.db) e aplica as migrations
npm run db:seed             # cria o ADM do .env (ADMIN_EMAIL/ADMIN_SENHA)
```

## Administradores (ADM)

Criar ADM fica **fora do protocolo**: nenhuma rota da API cria ou promove ADM (um campo `admin` no corpo é
ignorado). Aqui isso é feito por dois scripts:

```bash
npm run db:seed                              # cria o ADM do .env; se o e-mail já existe, só promove
npm run make-admin -- maria@exemplo.com      # promove um usuário já cadastrado
```

O papel é lido do banco a cada requisição, então quem é promovido não precisa logar de novo.
O ADM pode listar (`GET /users`), ler, alterar e excluir qualquer usuário. Sessões continuam sendo só do dono.

## Rodando

```bash
npm run dev                 # desenvolvimento, recarrega ao salvar
# ou
npm run build && npm start  # versão compilada
```

Escuta em `0.0.0.0:8080` por padrão, então colegas na mesma rede acessam pelo seu IP.

```bash
curl -i -X POST http://localhost:8080/api/v1/users \
  -H "Content-Type: application/json" \
  -d '{"nome":"João da Silva","email":"aluno@exemplo.com","senha":"senha123"}'

curl -i -X POST http://localhost:8080/api/v1/sessions \
  -H "Content-Type: application/json" \
  -d '{"email":"aluno@exemplo.com","senha":"senha123"}'
```

O terminal vira um painel com quem está logado agora e os últimos eventos (login, logout, cadastro,
alteração, exclusão e erros), redesenhado a cada evento:

```
┌─ Servidor http://0.0.0.0:8080/api/v1 ──────────────────────────────────────┐
│ LOGADOS (2)                                                                │
│   Administrador <admin@loja.com> (ADM) · 2 sessões                         │
│   Maria <maria@x.com> · 1 sessão                                           │
├─ ÚLTIMOS EVENTOS ──────────────────────────────────────────────────────────┤
│ 14:25:37 ENTROU    Maria <maria@x.com> (id 2) · sessão cc358e27…           │
│ 14:26:02 ALTEROU   Administrador (ADM) → Maria <maria@x.com> (id 2) · nome │
└────────────────────────────────────────────────────────────────────────────┘
```

Com `PAINEL=off` no `.env` (ou com a saída redirecionada para arquivo) volta o log em linhas, com a stack
completa dos erros 500. Os eventos ficam só em memória: reiniciar o servidor zera o feed, mas a lista de
logados vem do banco e continua certa.

Para zerar o banco: `npm run db:reset`.

## Onde fica cada coisa

| Camada | Arquivo | Papel |
|---|---|---|
| Configuração | `src/app.ts` | Ordem global: CORS → corpo cru → `/api/v1` → 404 → error handler |
| Rotas | `src/routes.ts` | Cadeia da regra 10 por rota + 405 |
| Middlewares | `src/http/middlewares/protocol-cors.ts` | CORS em toda resposta, OPTIONS → 204 (regra 5) |
| | `src/http/middlewares/authenticate.ts` | 401 |
| | `src/http/middlewares/validate-user-id.ts` | 400 do id |
| | `src/http/middlewares/ensure-owner-or-admin.ts` | 403 em `/users/{id}`: dono ou ADM, sem ir ao banco |
| | `src/http/middlewares/require-admin.ts` | 403 nas rotas só de ADM (`GET /users`) |
| | `src/http/middlewares/load-user.ts` | 404 |
| | `src/http/middlewares/fallbacks.ts` | 404 de rota e 405 (regra 15) |
| | `src/http/middlewares/error-handler.ts` | Único ponto que gera `{"mensagem": ...}` |
| Validação | `src/http/validation/rules.ts` | Email, Senha e Nome do YAML (zod) |
| | `src/http/validation/schemas.ts` | LoginRequest, UserRequest, UserPatchRequest |
| | `src/http/validation/parse-body.ts` | Lê o JSON cru e valida (400 do corpo) |
| Controllers | `src/http/controllers/*` | Finos: corpo → service → presenter |
| Presenters | `src/http/presenters/*` | Formato exato das respostas, nunca a senha |
| DTOs | `src/data/*` | Dados entre controller e service |
| Services | `src/services/*` | Regras de negócio (credenciais, sessões, e-mail único) |
| Erros | `src/errors/api-errors.ts` | Erros de domínio com status |
| Painel | `src/logging/activity-log.ts` | Painel do console: logados agora + últimos eventos |
| Scripts | `src/scripts/seed.ts`, `src/scripts/make-admin.ts` | Criar/promover ADM (fora do protocolo) |
| Ambiente | `src/env.ts` | Carrega o `.env` antes de tudo |
| Banco | `prisma/schema.prisma` | Modelos `User` (com `isAdmin`) e `Session` (whitelist) |

## Problemas comuns

**A página ou a API fica carregando para sempre.** Provavelmente o servidor foi suspenso com **Ctrl+Z**
em vez de encerrado com **Ctrl+C**. O processo suspenso continua segurando a porta, sem responder.
Para conferir e resolver:

```bash
lsof -nP -iTCP:8080 -iTCP:5173 -sTCP:LISTEN   # quem está nas portas
jobs                                          # no terminal onde rodou: "suspended" = Ctrl+Z
fg                                            # traz de volta; depois Ctrl+C para encerrar
```
