# Visão geral do projeto

Resumo de **o que o projeto faz**, **como as partes conversam** e **o que existe em cada pasta e arquivo**. Para decisões de arquitetura e o porquê delas, veja `claude.md`. Para rodar, veja os
READMEs de `server/` e `client/`.

---

## 1. O que é

Trabalho prático de **Tecnologias Cliente-Servidor (UTFPR-PG)**. Cada aluno faz um **cliente** e um
**servidor** que seguem o mesmo **protocolo da turma** (um arquivo OpenAPI/YAML). No dia da
integração, qualquer cliente precisa funcionar com o servidor de qualquer colega.

A 1ª entrega cobre **autenticação** (login/logout) e **CRUD do próprio usuário**. As próximas
entregas vão adicionar o e-commerce em si (produtos, carrinho, pedidos...).

| Parte        | Tecnologia                                                | Papel                                                                        |
| ------------ | --------------------------------------------------------- | ---------------------------------------------------------------------------- |
| `protocolo/` | OpenAPI 3.0.3 (YAML)                                      | O contrato. **Fonte da verdade**: se o código divergir, o código está errado |
| `server/`    | Node + Express 5 + TypeScript, Prisma (SQLite), zod       | API REST que implementa o protocolo                                          |
| `client/`    | React 19 + TypeScript + Vite, react-router, openapi-fetch | Interface no navegador que consome qualquer servidor do protocolo            |

---

## 2. Como as partes conversam

```
   ┌──────────────────────────┐        HTTP + JSON         ┌───────────────────────────┐
   │  client/ (navegador)     │  ───────────────────────►  │  server/ (Express :8080)  │
   │  React em :5173          │  Authorization: Bearer …   │  /api/v1/...              │
   │                          │  ◄───────────────────────  │                           │
   │  Servidor escolhido na   │   {…} ou {"mensagem": …}   │  SQLite (prisma/dev.db)   │
   │  tela de login (runtime) │                            │                           │
   └────────────┬─────────────┘                            └─────────────┬─────────────┘
                │ tipos gerados                       implementa as regras │
                └─────────────────►  protocolo/*.yaml  ◄───────────────────┘
```

- **Cliente e servidor nunca importam código um do outro.** O único elo é o YAML.
- O cliente fala **direto** com o servidor escolhido (pode ser o seu ou o de um colega), sem proxy.
- O servidor sempre devolve JSON. Erros sempre no formato `{"mensagem": "..."}`.

---

## 3. Funcionalidades

### 3.1 Rotas da API (servidor)

Todas começam com `/api/v1`. "Pública" = não exige token.

| Rota                       | Acesso  | O que faz                                             | Sucesso                      | Erros possíveis         |
| -------------------------- | ------- | ----------------------------------------------------- | ---------------------------- | ----------------------- |
| `POST /sessions`           | pública | Login: confere e-mail e senha e cria uma sessão nova  | `201` `{id, token, usuario}` | 400, 401                |
| `DELETE /sessions/{id}`    | token   | Logout: encerra uma sessão do próprio usuário         | `204`                        | 401, 403, 404           |
| `POST /users`              | pública | Cadastro de usuário                                   | `201` `{id, nome, email}`    | 400, 409                |
| `GET /users/{id}`          | token   | Dados do próprio usuário                              | `200`                        | 400, 401, 403, 404      |
| `PUT /users/{id}`          | token   | Troca nome, e-mail **e** senha (os três obrigatórios) | `200`                        | 400, 401, 403, 404, 409 |
| `PATCH /users/{id}`        | token   | Troca só os campos enviados                           | `200`                        | 400, 401, 403, 404, 409 |
| `DELETE /users/{id}`       | token   | Exclui a conta e encerra **todas** as sessões dela    | `204`                        | 400, 401, 403, 404      |
| `OPTIONS` em qualquer rota | pública | Preflight de CORS do navegador                        | `204`                        | —                       |

Regras gerais garantidas pelo servidor (numeradas como no README do protocolo):

- **CORS (regra 5):** toda resposta, inclusive de erro, leva os três cabeçalhos `Access-Control-Allow-*`.
- **E-mail (regra 8):** salvo e comparado sempre em minúsculo, então `Ana@X.com` e `ana@x.com` são o mesmo e-mail.
- **Nome (regra 9):** espaços nas pontas são removidos antes de validar e salvar.
- **Senha (regra 11):** guardada como hash bcrypt e nunca devolvida em nenhuma resposta.
- **Tipos (regra 13):** número, booleano ou `null` onde se espera texto dá `400`. Nada é convertido.
- **Sessões (regra 14):** cada login cria uma sessão independente. A pessoa pode estar logada em vários lugares.
- **Rotas (regra 15):** rota inexistente dá `404`, método não suportado dá `405`.
- **Ordem dos erros (regra 10):** com vários problemas, vale o primeiro desta lista:

```
401 token → 400 id da URL → 403 não é seu → 404 não existe → 400 corpo → 409 e-mail repetido
```

### 3.2 Telas (cliente)

| Tela        | Endereço    | O que faz                                                                                                       |
| ----------- | ----------- | --------------------------------------------------------------------------------------------------------------- |
| Entrar      | `/login`    | Escolhe o **servidor** (ip:porta) e faz login. Mostra avisos como "Conta criada", "Você saiu", "Sessão expirou" |
| Criar conta | `/cadastro` | Escolhe o servidor e cadastra. Se o e-mail já existe (409), oferece um link para entrar com ele                 |
| Perfil      | `/perfil`   | Mostra os dados, edita (envia só o que mudou), **Sair** e **Excluir conta** (com confirmação)                   |

Comportamentos importantes:

- O **endereço do servidor** fica salvo no navegador. Trocar de servidor descarta a sessão, porque o
  token só vale no servidor que o emitiu.
- A **sessão** (token) também fica salva: recarregar a página mantém o login.
- Qualquer **401** numa tela logada encerra a sessão local e volta para o login com aviso.
- Os formulários validam com as mesmas regras do YAML só para avisar antes de enviar. **Quem decide é
  o servidor**, e a mensagem dele é sempre mostrada.
- Erros de rede (servidor fora do ar, IP errado) viram "Não foi possível conectar ao servidor".

### 3.3 Log de atividade (terminal do servidor)

A cada login, logout ou exclusão de conta, o servidor mostra quem foi e quem continua logado:

```
[2026-10-03 21:17:45] ENTROU          Maria <maria@exemplo.com> (id 2) · sessão c79de5b5-…
                      ↳ logados agora: 2 · João <joao@exemplo.com> (2 sessões), Maria <maria@exemplo.com>
```

---

## 4. Caminho de uma requisição no servidor

Exemplo: `PATCH /api/v1/users/7` com token e corpo `{"nome": "Ana"}`.

```
requisição
   │
   ├─ protocolCors ───────────── põe os cabeçalhos CORS; se for OPTIONS, responde 204 e para
   ├─ express.raw ────────────── só guarda o corpo cru (ainda não interpreta o JSON)
   ├─ routes (/api/v1) ───────── encontra a rota PATCH /users/:id
   │     ├─ authenticate ─────── token existe e está ativo?               não → 401
   │     ├─ validateUserId ───── "7" é um inteiro?                        não → 400
   │     ├─ ensureOwnsUser ───── 7 é o id do dono do token?               não → 403
   │     ├─ loadUser ─────────── usuário 7 existe no banco?               não → 404
   │     └─ userController.update
   │           ├─ parseBody ──── JSON válido e dentro das regras do YAML?  não → 400
   │           ├─ userService ── e-mail já é de outra pessoa?              sim → 409
   │           └─ presentUser ── monta {id, nome, email} (sem senha)       → 200
   │
   └─ errorHandler ───────────── qualquer erro lançado acima vira {"mensagem": "..."}
```

Por que o JSON só é lido no controller: pela regra 10, um corpo inválido só pode dar 400 **depois**
de checar token, id, dono e existência. Se fosse lido antes, um corpo ruim responderia 400 no lugar
de 401 ou 403.

---

## 5. Pastas e arquivos

### 5.1 Raiz

| Caminho                                     | O que é                                                                         |
| ------------------------------------------- | ------------------------------------------------------------------------------- |
| `claude.md`                                 | Contexto do projeto: decisões, armadilhas do protocolo, status e como trabalhar |
| `VISAO-GERAL.md`                            | Este arquivo                                                                    |
| `protocolo/protocolo-cliente-servidor.yaml` | Cópia local do protocolo da turma (v1.3.1). Fonte da verdade                    |
| `server/`                                   | API                                                                             |
| `client/`                                   | Interface web                                                                   |

### 5.2 `server/`: API em Express

```
server/
├── .env / .env.example     configuração (banco, host, porta). .env não vai pro git
├── package.json            dependências e scripts (dev, build, start, db:migrate, db:reset)
├── tsconfig.json           configuração do TypeScript
├── prisma/
│   ├── schema.prisma       modelos do banco (User, Session)
│   ├── migrations/         histórico de alterações do banco, em SQL
│   └── dev.db              o banco SQLite (não vai pro git)
└── src/
    ├── server.ts           ponto de entrada: sobe o servidor na porta configurada
    ├── app.ts              monta o Express: ordem dos middlewares globais
    ├── routes.ts           todas as rotas e a cadeia de middlewares de cada uma
    ├── config.ts           lê HOST e PORT do ambiente
    ├── database/           conexão com o banco
    ├── data/               DTOs: formatos de dados entre camadas
    ├── errors/             erros de domínio (400, 401, 403, 404, 405, 409)
    ├── services/           regras de negócio
    ├── logging/            log de atividade de sessões
    ├── types/              tipos extras do Express
    └── http/               tudo que é específico de HTTP
        ├── middlewares/    etapas da cadeia de cada requisição
        ├── validation/     leitura e validação do corpo JSON
        ├── controllers/    recebem a requisição e devolvem a resposta
        └── presenters/     formato exato das respostas do protocolo
```

**Banco: `prisma/schema.prisma`**

| Modelo    | Tabela     | Campos                                                            | Observação                                             |
| --------- | ---------- | ----------------------------------------------------------------- | ------------------------------------------------------ |
| `User`    | `users`    | `id` (inteiro), `name`, `email` (único), `password` (hash), datas | No protocolo, `name` aparece como `nome`               |
| `Session` | `sessions` | `id` (UUID), `tokenHash` (único), `userId`, `createdAt`           | Cada linha é uma sessão ativa. Logout = apagar a linha |

O token entregue no login **não fica salvo**: o banco guarda só o hash SHA-256 dele. Se o banco vazar,
os tokens continuam seguros.

**`src/`, arquivo por arquivo**

| Arquivo                                  | Responsabilidade                                                                                                                                                       |
| ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `server.ts`                              | Sobe o servidor. Se a porta estiver ocupada, explica o que fazer e encerra                                                                                             |
| `app.ts`                                 | Ordem global: CORS → corpo cru → rotas `/api/v1` → 404 → tratamento de erros. Desliga `X-Powered-By` e ETag                                                            |
| `routes.ts`                              | Declara cada rota com seus middlewares e o 405 para métodos não suportados                                                                                             |
| `config.ts`                              | `HOST` (padrão `0.0.0.0`, para colegas acessarem pelo IP) e `PORT` (padrão `8080`)                                                                                     |
| `database/prisma.ts`                     | Uma única conexão Prisma para a aplicação toda                                                                                                                         |
| `data/session-data.ts`                   | Tipos `LoginData`, `CreatedSession` e `AuthContext` (quem está autenticado)                                                                                            |
| `data/user-data.ts`                      | Tipos `UserData` (cadastro/PUT) e `UserPatchData` (PATCH)                                                                                                              |
| `errors/api-errors.ts`                   | `BadRequestError`, `UnauthorizedError`, `InvalidCredentialsError`, `ForbiddenError`, `NotFoundError`, `MethodNotAllowedError`, `ConflictError`, cada um com seu status |
| `services/session.service.ts`            | Login (confere a senha e cria a sessão), busca a sessão pelo token, logout (403 se a sessão for de outro, 404 se não existir)                                          |
| `services/user.service.ts`               | Cadastro, atualização (PUT/PATCH) e exclusão. Garante e-mail único (409), inclusive com duas requisições simultâneas                                                   |
| `services/token.ts`                      | Gera o token aleatório e calcula o hash dele                                                                                                                           |
| `logging/activity-log.ts`                | Imprime ENTROU / SAIU / EXCLUIU A CONTA e quem está logado agora. Nunca derruba a requisição                                                                           |
| `types/express.d.ts`                     | Declara o que os middlewares deixam em `res.locals` (`auth`, `targetUserId`, `user`)                                                                                   |
| `http/middlewares/protocol-cors.ts`      | CORS em toda resposta. `OPTIONS` → 204                                                                                                                                 |
| `http/middlewares/authenticate.ts`       | Lê `Authorization: Bearer <token>` e confere se a sessão existe → 401                                                                                                  |
| `http/middlewares/validate-user-id.ts`   | O `{id}` da URL precisa ser inteiro → 400                                                                                                                              |
| `http/middlewares/ensure-owns-user.ts`   | O `{id}` precisa ser o do dono do token, conferido sem ir ao banco → 403                                                                                               |
| `http/middlewares/load-user.ts`          | Busca o usuário no banco → 404                                                                                                                                         |
| `http/middlewares/fallbacks.ts`          | 404 para rota inexistente e 405 para método não suportado                                                                                                              |
| `http/middlewares/error-handler.ts`      | **Único** lugar que transforma erro em resposta `{"mensagem": ...}`. Erro inesperado → 500, com o detalhe só no log                                                    |
| `http/validation/rules.ts`               | Regras de Email, Senha e Nome do YAML (tamanho, formato, trim, tipo)                                                                                                   |
| `http/validation/schemas.ts`             | Corpos aceitos: `loginRequest`, `userRequest`, `userPatchRequest`                                                                                                      |
| `http/validation/parse-body.ts`          | Lê o JSON cru (com ou sem `Content-Type`), exige um objeto e devolve o primeiro erro encontrado                                                                        |
| `http/controllers/session.controller.ts` | `store` (login, 201) e `destroy` (logout, 204)                                                                                                                         |
| `http/controllers/user.controller.ts`    | `store` (201), `show` (200), `replace`/PUT (200), `update`/PATCH (200), `destroy` (204)                                                                                |
| `http/presenters/user.presenter.ts`      | Model → `{id, nome, email}`. Garante que a senha nunca sai                                                                                                             |
| `http/presenters/session.presenter.ts`   | Sessão criada → `{id, token, usuario}`                                                                                                                                 |

**Camadas do servidor, em uma frase cada:**

- **Middlewares** decidem se a requisição pode seguir.
- **Validação** decide se o corpo está certo.
- **Controllers** só ligam as peças.
- **Services** têm as regras de negócio e falam com o banco.
- **Presenters** decidem o formato da resposta.
- **Erros** são lançados em qualquer camada e respondidos num lugar só.

### 5.3 `client/`: interface em React

```
client/
├── index.html              página base (título, idioma pt-BR)
├── package.json            dependências e scripts (dev, build, gen:api, typecheck, lint)
├── vite.config.ts          configuração do Vite (servidor de desenvolvimento e build)
├── eslint.config.js        regras de lint
├── tsconfig*.json          configuração do TypeScript
└── src/
    ├── main.tsx            ponto de entrada: renderiza o <App />
    ├── App.tsx             rotas das telas e guardas de acesso
    ├── index.css           estilos (tema claro e escuro automático)
    ├── validation.ts       regras do YAML para validar formulários
    ├── api/                comunicação com o servidor
    ├── session/            estado global: servidor escolhido + sessão
    ├── components/         peças de interface reaproveitáveis
    └── pages/              as telas
```

| Arquivo                         | Responsabilidade                                                                                                                                      |
| ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `main.tsx`                      | Liga o React à página                                                                                                                                 |
| `App.tsx`                       | Define `/login` e `/cadastro` (só sem sessão) e `/perfil` (só com sessão). Qualquer outro endereço vai para `/perfil`                                 |
| `index.css`                     | Visual das telas, com cores para tema claro e escuro                                                                                                  |
| `validation.ts`                 | `validateEmail`, `validateSenha` e `validateNome`, espelhando o YAML                                                                                  |
| `api/schema.ts`                 | **Gerado** do YAML com `npm run gen:api`. Não editar à mão                                                                                            |
| `api/types.ts`                  | Atalhos de nomes para os tipos gerados (`UserResponse`, `SessionResponse`...)                                                                         |
| `api/client.ts`                 | `createApi`: login, logout, cadastro, buscar/editar/excluir usuário. Converte erros em `ApiError` com mensagem pronta e avisa a sessão em caso de 401 |
| `api/server-url.ts`             | Normaliza o endereço digitado (`192.168.0.10:8080` → `http://192.168.0.10:8080`) e acrescenta `/api/v1`                                               |
| `session/storage.ts`            | Lê e grava servidor + sessão no `localStorage`, sem quebrar se ele não estiver disponível                                                             |
| `session/session-context.ts`    | Define o que a sessão oferece às telas e o hook `useSession()`                                                                                        |
| `session/SessionProvider.tsx`   | Guarda o estado (servidor, sessão, aviso de saída) e entrega um `api` já com o token                                                                  |
| `components/Field.tsx`          | Campo de formulário com rótulo, dica e erro                                                                                                           |
| `components/Alert.tsx`          | Caixa de aviso (erro, sucesso, informação)                                                                                                            |
| `components/ServerUrlField.tsx` | Campo "Servidor" usado no login e no cadastro                                                                                                         |
| `components/Layout.tsx`         | Cabeçalho com o servidor atual (bolinha verde = logado) e a área da página                                                                            |
| `components/RouteGuards.tsx`    | `RequireAuth` (sem sessão → login, levando o aviso) e `RequireGuest` (com sessão → perfil)                                                            |
| `pages/LoginPage.tsx`           | Tela Entrar                                                                                                                                           |
| `pages/RegisterPage.tsx`        | Tela Criar conta, com confirmação de senha                                                                                                            |
| `pages/ProfilePage.tsx`         | Tela Perfil: carrega os dados, edita via PATCH, sai e exclui a conta                                                                                  |

---

## 6. Comandos do dia a dia

| Onde      | Comando                              | Para quê                                                   |
| --------- | ------------------------------------ | ---------------------------------------------------------- |
| `server/` | `npm run dev`                        | Sobe a API em `:8080`, recarregando ao salvar              |
| `server/` | `npm run db:migrate`                 | Cria ou atualiza o banco depois de mudar o `schema.prisma` |
| `server/` | `npm run db:reset`                   | Apaga e recria o banco do zero                             |
| `server/` | `npm run typecheck`                  | Confere os tipos                                           |
| `client/` | `npm run dev`                        | Sobe a interface em `:5173`                                |
| `client/` | `npm run gen:api`                    | Regenera os tipos depois que o YAML mudar                  |
| `client/` | `npm run typecheck` / `npm run lint` | Confere tipos e estilo de código                           |

Para **parar**, use **Ctrl+C**, nunca Ctrl+Z (ver "Problemas comuns" nos READMEs).

---

## 7. Situação atual

- [x] Servidor com todas as rotas da 1ª entrega
- [x] Cliente com login, cadastro e perfil, testado ponta a ponta num navegador
- [ ] Testes automatizados (framework ainda a decidir)
- [ ] Teste no navegador contra o servidor de um colega
- [ ] Próximas entregas: produtos, carrinho, pedidos...
