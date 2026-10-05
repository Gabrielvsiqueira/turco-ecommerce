# Cliente (React + TypeScript + Vite)

Cliente do protocolo da turma. Fala direto, pelo navegador, com o servidor escolhido
na tela de login ou cadastro: o seu ou o de qualquer colega.
Contexto e decisões: `../claude.md`.

## Rodando

```bash
npm install
npm run dev          # http://localhost:5173
```

Na tela de login, preencha **Servidor** com `ip:porta` (ex.: `192.168.0.10:8080`). O `/api/v1`
é adicionado sozinho. O endereço fica salvo no navegador; trocar de servidor descarta a sessão.

## Tipos gerados do protocolo

`src/api/schema.ts` é gerado a partir do YAML. **Não edite à mão.** Quando o protocolo mudar:

```bash
npm run gen:api      # regenera os tipos
npm run typecheck    # o TypeScript aponta o que quebrou
```

## Onde fica cada coisa

| Arquivo | Papel |
|---|---|
| `src/api/schema.ts` | Tipos gerados do YAML (openapi-typescript) |
| `src/api/client.ts` | Chamadas da API (openapi-fetch), erros viram `ApiError` com mensagem pronta |
| `src/api/server-url.ts` | Normaliza o endereço digitado e monta o `/api/v1` |
| `src/session/*` | Servidor + sessão atuais, salvos no `localStorage`; 401 encerra a sessão |
| `src/validation.ts` | Regras de Email/Senha/Nome do YAML, só para retorno rápido no formulário |
| `src/pages/*` | Login, Cadastro e Perfil (ver, editar, sair, excluir conta) |
| `src/components/*` | Campos, alertas, layout e guardas de rota |

## Problemas comuns

**A página ou a API fica carregando para sempre.** Provavelmente o servidor foi suspenso com **Ctrl+Z**
em vez de encerrado com **Ctrl+C**. O processo suspenso continua segurando a porta, sem responder.
Para conferir e resolver:

```bash
lsof -nP -iTCP:8080 -iTCP:5173 -sTCP:LISTEN   # quem está nas portas
jobs                                          # no terminal onde rodou: "suspended" = Ctrl+Z
fg                                            # traz de volta; depois Ctrl+C para encerrar
```
