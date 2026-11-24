# Estado da integração com Supabase

## Estado atual

Resumo do estado registrado (última verificação remota em 18/11/2026). Confira o ambiente real
antes de ações remotas; este arquivo não substitui essa conferência.

| Item | Estado |
| --- | --- |
| Banco PostgreSQL (schema `tarefas`) | Publicado, com as migrações de `supabase/migrations/` aplicadas até `202611180002_type_icons.sql` |
| API `tarefas-api` (Edge Function) | Publicada manualmente pela CLI em `https://<project-ref>.supabase.co/functions/v1/tarefas-api` |
| `ALLOWED_ORIGINS` | `<URL-do-frontend>`, `http://localhost:5173` e `http://127.0.0.1:5173` |
| Frontend | `<URL-do-frontend>`; o build precisa de `VITE_API_URL` apontando para a função |
| Testes locais | `npm test` executa 20 testes Node; no Windows, o teste de simulação da importação falha por montar o caminho do script com `URL.pathname` |
| Conexões no `.env` | Scripts `db:*` usam `SUPABASE_DATABASE_URL`; o Express só usa PostgreSQL com `DATABASE_URL` (desde 23/11/2026) |
| Pendências | Deploy da função é manual; não há projeto Supabase separado para desenvolvimento nem deploy automático |

As seções abaixo são o histórico das etapas, em ordem cronológica. As contagens
de testes citadas nelas refletem o tamanho da suíte naquela data.

## Implementado no repositório (17/11/2026)

- Seleção de PostgreSQL por `DATABASE_URL`, mantendo SQLite no desenvolvimento.
- Exigência de PostgreSQL ao iniciar Express com `NODE_ENV=production`.
- Consultas assíncronas, pool e transações PostgreSQL com escopo por conta.
- Estrutura SQL no schema privado `tarefas`, com RLS habilitada.
- Importador SQLite → PostgreSQL com transação, conferência de contagens,
  preservação de IDs e recusa de destino preenchido.
- API Fetch preparada para Supabase Edge Functions, reutilizando regras e SQL.
- CORS por lista de origens, sessão Bearer e limite persistente de login na Edge.
- Frontend configurável por `VITE_API_URL`, com sessão remota em `sessionStorage`.
- Script de preparação da função e alternativa de execução com Docker.

## Validação local registrada (17/11/2026)

| Verificação | Resultado |
| --- | --- |
| `npm test` | 15 testes passaram: regras, SQLite, PostgreSQL embarcado e API Edge |
| Testes Deno da função | 2 testes passaram: scrypt e login com hash existente |
| Verificação Deno da função | Passou |
| `npm run build` | Passou |
| Simulação da importação | Passou sem alterar o SQLite nem acessar a nuvem |

PGlite testa consultas PostgreSQL e regras localmente. Não substitui um teste de
conexão real com o pooler, certificados e permissões do Supabase. O Dockerfile
foi preparado, mas a imagem não foi compilada e validada nesta etapa.

## Ambiente remoto verificado em 18/11/2026

- A conexão PostgreSQL passou com verificação TLS e a CA oficial do Supabase.
- Foi criado backup consistente do SQLite em `.local/backups/` (ignorado pelo Git).
- A importação foi concluída: 1 conta, 5 tipos, nenhuma tarefa/ocorrência na origem.
- A função `tarefas-api` foi publicada usando a CLI autenticada.
- Foram configurados os secrets da conexão, certificado e origens locais.
- O frontend em `http://localhost:5173` respondeu e carregou a URL remota.
- A API respondeu aos testes de CORS, cadastro, login, sessão, tipos, criação e
  conclusão diária idempotente, exclusão e revogação da sessão.
- A conta e os dados temporários usados no teste foram removidos. As contagens
  finais continuaram em 1 conta, 5 tipos e nenhuma tarefa.

API publicada:

```text
https://<project-ref>.supabase.co/functions/v1/tarefas-api
```

O teste de integração foi realizado por HTTP. Não houve verificação visual do
navegador nem validação da senha da conta existente informada pelo usuário.
A compatibilidade dos hashes anteriores foi testada separadamente no Deno.

## Uso atual e pendências

Execute `npm run dev:remote` e abra `http://localhost:5173`. Se já houver Vite nessa
porta, use a instância existente. O arquivo local `client/.env.local` aponta para
a função; não contém conexão PostgreSQL. As origens permitidas são
`http://localhost:5173`, `http://127.0.0.1:5173` e `<URL-do-frontend>`.

O endereço informado para o frontend é `<URL-do-frontend>` e sua
origem está autorizada na API. O build do frontend precisa de `VITE_API_URL`
apontando para a Edge Function. Domínios adicionais exigem inclusão explícita em
`ALLOWED_ORIGINS`.

O login da CLI é independente do MCP. Nesta execução, a publicação foi feita pela
CLI, porque as ferramentas MCP não estavam disponíveis na sessão.

## Decisão de arquitetura

Frontend hospedado separadamente; banco e API no Supabase, que é o ambiente
principal. Express + SQLite ficam para desenvolvimento local. Express + PostgreSQL
e o Docker ficam em segundo plano, como base para um eventual servidor próprio.
Atualizado em 23/11/2026; detalhes em [Arquitetura](architecture.md#papel-de-cada-ambiente).

Antes de retomar ações remotas, confira [o procedimento de implantação](supabase.md)
e os valores configurados no ambiente, sem publicar credenciais na documentação.

## Tarefas periódicas — atualização de 18/11/2026

A interface permite selecionar dias da semana e duração (sem fim, até uma data
ou por dias/semanas). A migração `202611180001_weekly_recurrence.sql` foi aplicada
no Supabase e a API foi republicada. Os 16 testes Node, o build e a verificação
Deno passaram. As regras validam os dias programados e o limite final, preservando
as tarefas diárias existentes.

O teste remoto também passou, incluindo rejeição de dias não programados e de
ocorrências após a data final. A conta temporária foi removida ao terminar.

## Edição de tarefas e tipos — atualização de 18/11/2026

A interface oferece Personalizar tipos para nome/cor e um botão de edição em
cada tarefa para título, tipo, prioridade e movimentação de data/horário. A
edição de periódicas se aplica à definição inteira, preservando o histórico.
A API foi publicada com `PATCH /task-types/:id`, validação compartilhada,
isolamento por conta e atualização transacional dos nomes legados das tarefas.
Os 17 testes Node, o build e a verificação Deno passaram.

O teste remoto de personalização de tipo e edição/movimentação de tarefa periódica
também passou. A conta temporária foi removida, preservando os dados da conta real.

## Ícones dos tipos — atualização de 18/11/2026

Foi adicionado um seletor com 47 ícones React Icons (Font Awesome 6 e Game Icons),
organizado por contexto, com busca, opção automática e prévia na cor selecionada.
A migração `202611180002_type_icons.sql` foi aplicada e a API republicada. Os
17 testes Node, o build e a verificação Deno passaram. O teste remoto confirmou
criação e edição do ícone e seu retorno nas tarefas. Os dados temporários foram
removidos. Tipos existentes mantêm nomes/cores e não receberam escolhas fixas.

## Origem Netlify autorizada — 18/11/2026

O secret `ALLOWED_ORIGINS` foi atualizado para aceitar
`<URL-do-frontend>`, preservando localhost e 127.0.0.1 na porta 5173.
A verificação remota confirmou preflight de login com HTTP 204 e cabeçalho de
origem correto, consulta de sessão sem login com HTTP 200, acesso local mantido
e bloqueio HTTP 403 para uma origem não autorizada. Não foram alteradas contas
ou tarefas nesta configuração.

## Papéis dos ambientes e conexões separadas — 23/11/2026

O Supabase passou a ser documentado como ambiente principal. Express + SQLite
ficou para desenvolvimento local, e Express + PostgreSQL (Docker) como base de um
eventual servidor próprio. Os papéis estão em
[Arquitetura](architecture.md#papel-de-cada-ambiente).

Antes, o Express e os scripts `db:*` liam a mesma `DATABASE_URL` do `.env`.
Preenchê-la para uma migração fazia o `npm run dev` gravar no banco de produção
sem aviso. Agora:

- os scripts `db:schema:supabase` e `db:migrate:supabase` leem
  `SUPABASE_DATABASE_URL`, por meio de `server/scripts/supabase-env.js`;
- se só `DATABASE_URL` estiver definida, os scripts param e pedem para renomeá-la;
- o Express ignora `SUPABASE_DATABASE_URL` e só usa PostgreSQL com `DATABASE_URL`;
  fora de `NODE_ENV=production`, avisa no terminal ao iniciar nesse modo;
- `.env.example` foi reorganizado por ambiente.

**Ação necessária:** em qualquer máquina com um `.env` antigo, renomeie
`DATABASE_URL` para `SUPABASE_DATABASE_URL`. A Edge Function não muda: continua
usando o secret `TAREFAS_DATABASE_URL`.

Verificação local: 19 de 20 testes Node passaram; a falha é a do teste de simulação
no Windows, já registrada no estado atual. A simulação da importação, as mensagens
de configuração dos scripts e o aviso do Express foram conferidos manualmente.
Nenhuma conexão com o Supabase foi feita nesta etapa.
