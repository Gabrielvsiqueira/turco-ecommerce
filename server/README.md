# Servidor (Express + TypeScript)

Implementação do protocolo da turma (`../protocolo/protocolo-cliente-servidor.yaml`).
Contexto e decisões de arquitetura: `../claude.md`.

## Primeira vez (em qualquer computador)

Precisa do Node 22 ou mais novo (`node -v` para conferir).

```bash
cd server
npm install                 # instala as dependências
cp .env.example .env        # cria o .env (no Windows/cmd: copy .env.example .env); ajuste HOST/PORT se quiser
npx prisma generate         # gera o cliente do Prisma
npx prisma migrate dev      # cria o SQLite (prisma/dev.db) e aplica as migrations
npm run dev                 # sobe o servidor
```

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

O terminal mostra quem entra e sai (login, logout, conta excluída) e, a cada evento, quem continua logado:

```
[2026-10-03 21:17:45] ENTROU          Maria <maria@exemplo.com> (id 2) · sessão c79de5b5-…
                      ↳ logados agora: 2 · João da Silva <aluno_joao@exemplo.com> (2 sessões), Maria <maria@exemplo.com>
```

Para zerar o banco: `npm run db:reset`.

## Onde fica cada coisa

| Camada | Arquivo | Papel |
|---|---|---|
| Configuração | `src/app.ts` | Ordem global: CORS → corpo cru → `/api/v1` → 404 → error handler |
| Rotas | `src/routes.ts` | Cadeia da regra 10 por rota + 405 |
| Middlewares | `src/http/middlewares/protocol-cors.ts` | CORS em toda resposta, OPTIONS → 204 (regra 5) |
| | `src/http/middlewares/authenticate.ts` | 401 |
| | `src/http/middlewares/validate-user-id.ts` | 400 do id |
| | `src/http/middlewares/ensure-owns-user.ts` | 403, sem ir ao banco |
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
| Log | `src/logging/activity-log.ts` | Quem entrou, saiu ou excluiu a conta, e quem está logado agora |
| Banco | `prisma/schema.prisma` | Modelos `User` e `Session` (whitelist) |

## Problemas comuns

**A página ou a API fica carregando para sempre.** Provavelmente o servidor foi suspenso com **Ctrl+Z**
em vez de encerrado com **Ctrl+C**. O processo suspenso continua segurando a porta, sem responder.
Para conferir e resolver:

```bash
lsof -nP -iTCP:8080 -iTCP:5173 -sTCP:LISTEN   # quem está nas portas
jobs                                          # no terminal onde rodou: "suspended" = Ctrl+Z
fg                                            # traz de volta; depois Ctrl+C para encerrar
```
