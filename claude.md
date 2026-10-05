# Projeto E-commerce

Contexto do projeto para o Claude Code. Leia este arquivo inteiro antes de propor mudanças.

## O que é

Trabalho prático da disciplina **Tecnologias Cliente-Servidor (UTFPR Ponta Grossa)**. Cada aluno implementa
o próprio **cliente** e o próprio **servidor**, em qualquer linguagem. No dia da integração, qualquer cliente
precisa conversar com o servidor de qualquer colega, e vice-versa.

O que garante isso é um **protocolo compartilhado pela turma** (OpenAPI 3.0.3):

- Repositório: https://github.com/JoseMarra2006/protocolo-cliente-servidor
- Swagger publicado: https://josemarra2006.github.io/protocolo-cliente-servidor/
- Cópia local: `protocolo/protocolo-cliente-servidor.yaml` (versão **1.3.1** quando este arquivo foi escrito)

**O YAML + o README do repositório do protocolo são a fonte da verdade.** Se o código divergir do protocolo,
o código está errado. Mudanças no protocolo são propostas à turma via issue/PR, nunca decididas só aqui.

Escopo da 1ª entrega: `POST /sessions`, `DELETE /sessions/{id}`, `POST /users`, `GET|PUT|PATCH|DELETE /users/{id}`.
As próximas entregas devem adicionar domínios de e-commerce (produtos, carrinho, pedidos...).

## Decisões tomadas (e por quê)

| Decisão                                                | Motivo                                                                                                                                                                                                                |
| ------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Servidor: Express (TypeScript), só API**             | Decisão do autor. Laravel chegou a ser escolhido e um esqueleto foi escrito em `server/`, mas foi **abandonado**: não usar aquele código como referência de stack.                                                     |
| **Cliente: React (TypeScript, Vite)**, app separado    | O cliente roda no navegador e fala direto com o servidor escolhido. Filament foi descartado: ele não consome API REST, fala direto com o banco.                                                                       |
| **Monorepo com apps independentes**                    | Um commit ajusta servidor e cliente quando o protocolo muda. Nenhum app importa código do outro; o único elo é o YAML.                                                                                                |
| **URL do servidor configurável no cliente em runtime** | Campo na tela de login, salvo no `localStorage`. Trocar de servidor não reinicia nada. Ao trocar, descartar a sessão local (o token pertence ao servidor que o emitiu). Nada de proxy pelo servidor.                  |
| **Banco: SQLite + Prisma (ORM)**                       | Simples pro dia da integração (um arquivo). ORM pensando nas próximas entregas (migrations, relações, tipos gerados). Prisma 6: o 7 exige Node ≥ 22.12. Validação com zod.                                         |
| **Autenticação: token opaco + tabela de sessões (UUID)** | O protocolo aceita token opaco ("JWT ou opaco"). Cada linha da tabela = uma sessão (whitelist), com id próprio (UUID, como no exemplo do YAML). Logout = apagar aquela linha. Múltiplas sessões são nativas.        |
| **Arquitetura em camadas com Service Layer**           | Projeto solo, o autor quer aprender padrões sem over-engineering. Hexagonal/Clean e Repository foram descartados por ora (abstração sem segundo adaptador real). Action classes são alternativa aceitável a Services. |
| **Porta 8080**                                         | Default do `servers` no YAML. Servidor escuta em `0.0.0.0:8080` (colegas na rede acessam pelo IP).                                                                                                                    |

## Estrutura do repositório

```
ecommerce/
├── CLAUDE.md
├── VISAO-GERAL.md      ← resumo de funcionalidades, pastas e arquivos (manter atualizado)
├── protocolo/          ← cópia do YAML da turma
├── server/             ← Express + TypeScript (API)
└── client/             ← React + TypeScript (Vite)
```

## Arquitetura do servidor

Padrões e responsabilidades (pastas exatas a definir quando o esqueleto Express for criado):

| Padrão                               | Responsabilidade                                                                                     |
| ------------------------------------ | ---------------------------------------------------------------------------------------------------- |
| Middleware (Chain of Responsibility) | CORS do protocolo, auth, formato do id, dono do recurso, busca do recurso                            |
| Validação do corpo                   | Leitura do JSON e validação (400). Regras de Email/Senha/Nome definidas num único lugar              |
| DTO                                  | Dados de entrada/saída entre controller e service, sem depender de `req`/`res`                       |
| Service Layer                        | Regras de negócio (credenciais, e-mail único, sessões)                                               |
| Mapeamento de resposta               | Formato exato das respostas; mapeia nomes do banco pros do protocolo (`nome`); nunca devolve a senha |
| Erros de domínio                     | Lançados pelos services; convertidos em `{"mensagem": ...}` num único error handler                  |

Controllers são finos: recebem o corpo validado, montam o DTO, chamam o service, devolvem a resposta mapeada.

### Pipeline obrigatório (regra 10 do protocolo)

Com mais de um problema, vale o primeiro nesta ordem:

```
401 token → 400 id mal formatado → 403 id não é do dono → 404 não existe → 400 corpo → 409 e-mail duplicado
```

Em caso de dúvida, **seguir o YAML**: só aplicar os status que a rota lista. Ex.: `DELETE /sessions/{id}` não
lista 400, então lá não existe "id mal formatado".

Mapeamento em código (middlewares encadeados na rota, nesta ordem):

1. Middleware de auth → 401
2. Middleware de formato do id → 400
3. Middleware de dono do recurso, comparando o id da URL com o do token **antes** de ir ao banco → 403
   (assim "id de outro usuário, exista ou não, sempre dá 403" sai naturalmente)
4. Busca explícita no banco → 404
5. Validação do corpo → 400 (o parse/validação do JSON roda **depois** dos passos acima, nunca como
   middleware global antes do auth, senão quebra a ordem da regra 10)
6. Service → 409

## Armadilhas vs. protocolo (garantir no Express)

- Não converter tipos nem fazer trim global: `""` não vira `null`, senha não é mexida. O trim do `nome` é
  explícito (regra 9).
- Toda resposta de erro é `{"mensagem": "..."}` (inclusive 404, 405, JSON malformado e 500), sempre JSON,
  independentemente do header `Accept`. O error handler padrão do Express devolve HTML: substituir.
- Express não gera 405 sozinho: rota existente com método não suportado precisa responder 405 (regra 15).
- CORS: os **três** cabeçalhos em **toda** resposta (inclusive erro) e `OPTIONS` → 204 em toda rota.
- Corpo JSON lido mesmo sem `Content-Type` (ou com `; charset=utf-8`); 400 se vazio, malformado ou não for objeto.
- Tipos estritos (regra 13): número/booleano/`null` onde se espera string → 400.
- E-mail sempre salvo e comparado em minúsculo (regra 8).
- Senha nunca sai em resposta (regra 11): sempre passar pelo mapeamento de resposta.
- Prefixo `/api/v1` em todas as rotas.
- `POST /sessions` responde **201** (está no YAML; o README não deixa isso claro).

## Status

- [x] Discovery e decisões de arquitetura
- [x] Servidor Express + Prisma (SQLite) + zod com todas as rotas da 1ª entrega (verificado à mão com curl)
- [ ] Testes de feature automatizados (framework ainda a decidir)
- [x] Cliente React: login, cadastro, perfil (ver/editar/sair/excluir). Tipos gerados do YAML
      (`openapi-typescript`, `npm run gen:api`), chamadas com `openapi-fetch`, rotas com `react-router` 7
- [ ] Cliente testado manualmente no navegador contra o próprio servidor e o de um colega
- [ ] (Futuro) validar respostas automaticamente contra o YAML nos testes

## Como trabalhar comigo

- Responder em **português**.
- Antes de propor mudança, explicar: qual problema resolve, por que é necessária, impactos e alternativas.
- Em planejamento, incluir diagramas (fluxos, arquitetura, interações) quando ajudarem a entender.
- Ao planejar algo novo, fazer perguntas antes de sair implementando; o autor quer entender as decisões.
- Toda rota nova vem com testes de feature cobrindo cada código de status que o YAML lista.
