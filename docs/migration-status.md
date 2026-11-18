# Estado da integração com Supabase

Registro de implementação em 17/11/2026. Este arquivo descreve evidências locais;
não atesta o estado do projeto remoto sem uma verificação posterior.

## Implementado no repositório

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

## Validação local registrada

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
`http://localhost:5173` e `http://127.0.0.1:5173`.

Falta escolher/publicar a hospedagem definitiva do frontend. Quando houver um
domínio, inclua a origem exata em `ALLOWED_ORIGINS`, mantendo ou removendo as origens
locais conforme o uso desejado, e configure `VITE_API_URL` antes do build.

O login da CLI é independente do MCP. Nesta execução, a publicação foi feita pela
CLI, porque as ferramentas MCP não estavam disponíveis na sessão.

## Decisão de arquitetura

A preferência informada é hospedar o frontend separadamente e colocar banco e
API no Supabase. Express/SQLite continuam úteis para desenvolvimento local.
Docker permanece como alternativa de hospedagem, sem ser requisito dessa escolha.

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
