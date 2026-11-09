# E-commerce: cliente e servidor do protocolo da turma

Trabalho prático de **Tecnologias Cliente-Servidor (UTFPR Ponta Grossa)**. Cada aluno faz o próprio
cliente e o próprio servidor seguindo um **protocolo comum** (OpenAPI 3.0.3). No dia da integração,
qualquer cliente precisa funcionar com o servidor de qualquer colega.

- Protocolo: [repositório](https://github.com/JoseMarra2006/protocolo-cliente-servidor) ·
  [Swagger](https://josemarra2006.github.io/protocolo-cliente-servidor/) · cópia local em
  `protocolo/protocolo-cliente-servidor.yaml` (v1.3.1)
- **O YAML é a fonte da verdade.** Se o código divergir dele, o código está errado.

## O que já funciona (1ª entrega)

| Parte | Stack | O que faz |
| --- | --- | --- |
| `server/` | Node, Express 5, TypeScript, Prisma 6 (SQLite), zod | API em `/api/v1`: login/logout (`/sessions`) e CRUD do próprio usuário (`/users`) |
| `client/` | React 19, TypeScript, Vite, react-router, openapi-fetch | Telas de login, cadastro e perfil (ver, editar, sair, excluir conta) |

O cliente fala **direto** com o servidor escolhido na tela de login (o seu ou o de um colega). Os dois
apps não importam código um do outro: o único elo entre eles é o YAML.

## Pré-requisitos

- **Node.js 22 ou mais novo** (`node -v`)
- Git

Não é preciso instalar banco de dados: o SQLite é um arquivo criado pelo Prisma.

## Como rodar

A raiz do repositório não tem `package.json`. Cada app é instalado e executado na própria pasta, em
terminais separados.

**1. Servidor** (porta `8080`)

```bash
cd server
npm install
cp .env.example .env       # Windows (PowerShell): Copy-Item .env.example .env
npm run db:migrate         # cria prisma/dev.db e aplica as migrations
npm run dev
```

**2. Cliente** (porta `5173`)

```bash
cd client
npm install
npm run dev
```

Abra http://localhost:5173 e, no campo **Servidor**, informe `localhost:8080` ou o `ip:porta` de um
colega. O `/api/v1` é acrescentado sozinho.

Para testar a API sem o cliente, importe `postman/ecommerce.postman_collection.json` no Postman.

## Comandos úteis

| Pasta | Comando | Para quê |
| --- | --- | --- |
| `server/` | `npm run dev` | API recarregando ao salvar |
| `server/` | `npm run build && npm start` | Versão compilada |
| `server/` | `npm run db:migrate` | Atualiza o banco depois de mudar o `schema.prisma` |
| `server/` | `npm run db:reset` | Apaga e recria o banco |
| `client/` | `npm run gen:api` | Regenera os tipos do cliente depois que o YAML mudar |
| `server/` e `client/` | `npm run typecheck` | Confere os tipos |

## Problemas comuns

- **Fica carregando para sempre:** o processo foi suspenso com **Ctrl+Z** e continua segurando a
  porta. Encerre sempre com **Ctrl+C** (detalhes no README de `server/`).
- **Colegas não conseguem acessar:** o servidor escuta em `0.0.0.0:8080`. Libere o Node no firewall
  (no Windows, em **rede privada**) e passe seu IP (`ipconfig` no Windows, `ifconfig` no Mac/Linux).
- **Windows:**
    - Não copie a `node_modules` de outro sistema. Prisma, esbuild e Rollup têm binários por
      plataforma: apague a pasta e rode `npm install` de novo.
    - `EPERM` no Prisma: pare o `npm run dev` antes de rodar `migrate` ou `generate`.
    - "Execução de scripts foi desabilitada" no PowerShell: use `npm.cmd` ou rode
      `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`.
    - `ENOENT`: confira se o comando foi rodado dentro de `server/` ou `client/`, não na raiz.

## Documentação

| Arquivo | Conteúdo |
| --- | --- |
| [`VISAO-GERAL.md`](VISAO-GERAL.md) | Funcionalidades, caminho de uma requisição, cada pasta e arquivo |
| [`server/README.md`](server/README.md) | Detalhes do servidor e exemplos com `curl` |
| [`client/README.md`](client/README.md) | Detalhes do cliente e tipos gerados do protocolo |
| [`claude.md`](claude.md) | Decisões de arquitetura e armadilhas do protocolo |

## Situação

- [x] Servidor com todas as rotas da 1ª entrega
- [x] Cliente com login, cadastro e perfil
- [ ] Testes automatizados
- [ ] Teste contra o servidor de um colega
- [ ] Próximas entregas: produtos, carrinho, pedidos
