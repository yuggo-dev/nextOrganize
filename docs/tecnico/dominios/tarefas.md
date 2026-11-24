# Domínio de tarefas e agenda

Arquivos, regras, API e banco das tarefas. O comportamento das telas, do ponto
de vista de quem usa, está em [Agenda](../../funcional/agenda.md) e
[Desempenho](../../funcional/desempenho.md).

Na interface, as regulares (diárias e semanais) se chamam **atividades
habituais**; no código e na API continuam "regulares" (`recurrence` `daily` ou
`weekly`).

## Frontend

| Camada | Arquivo ou pasta | Papel |
| --- | --- | --- |
| Apresentação | `client/src/domains/tasks/Dashboard.jsx` | Compor resumo, seleção de data, filtros e ações |
| Apresentação | `client/src/domains/tasks/PerformanceDashboard.jsx` | Indicadores, filtros de período e gráficos de desempenho; painel Hábitos (`HabitsPanel`) |
| Apresentação | `components/Calendar.jsx` | Mês de 42 células com um card por pontual, no estilo do calendário da Apple (habituais ficam fora); com um tipo filtrado, marcadores de ícone por tipo, habituais inclusive |
| Apresentação | `components/TaskList.jsx` | Lista com rolagem interna: regulares e depois pontuais, com subtítulos discretos |
| Apresentação | `components/TaskDialog.jsx` | Cadastro e edição em janela: Pontual/Habitual, título, tipo, prioridade, data, horário (de conclusão ou de notificação), repetição e escolha de atraso |
| Apresentação | `components/SelectedDayLine.jsx` | Selo de distância até hoje e data do dia selecionado (cabeçalho do calendário e faixa superior do celular) |
| Apresentação | `client/src/shared/components/TodayChip.jsx` | Selo azul **Hoje** usado em toda a plataforma |
| Aplicação | `hooks/useTasks.js` | Carga inicial e atualização do estado após operações da API |
| Regras | `model/schedule.js` | Datas locais, atrasos, próximos dias, ordenação e `relativeDayLabel` |
| Regras | `model/performance.js` | Taxa de conclusão, distribuição de status e agregação por tipo, prioridade e prazo |
| Regras | `model/habits.js` | Indicadores das atividades habituais: consistência, sequências, dias perfeitos e taxa por dia da semana |
| Regras | `model/recurrence.js` | Repetição diária e semanal, ocorrências por data e combo de ocorrências consecutivas |
| Regras | `model/calendar.js` | Agrupamento e ordenação dos marcadores por tipo do calendário |
| Integração | `api.js` | Listagem, criação, atualização e exclusão |

Os caminhos abreviados na tabela pertencem a `client/src/domains/tasks/`.

### Regras de atraso

As regras ficam em `model/schedule.js`: `isOverdue` (atrasada), `isMissed` (não
feita) e `isPending` (ainda pede ação: aberta e não "não feita"). As três valem
para pontuais e regulares e seguem `tracks_overdue`: com `false`, a atividade
nunca é atrasada e vira não feita quando a data passa. A tabela das regras, em
linguagem de uso, está em [Horários e atraso](../../funcional/agenda.md#horários-e-atraso).

`relativeDayLabel(date, now)` devolve Hoje, Amanhã, Ontem, "Em N dias" ou
"Há N dias", usado no selo de `SelectedDayLine.jsx` e no título da lista.

### Calendário

Os marcadores de ícone (modo com tipo filtrado) vêm de `groupCalendarTypes`, em
`model/calendar.js`: um marcador por tipo, priorizando tipos com mais atividades
pendentes; tipos totalmente concluídos aparecem por último e empates usam o nome
do tipo em ordem alfabética. A ordenação se atualiza ao concluir ou reabrir
tarefas. No modo Todos, os cards das pontuais são ordenados por horário (sem
horário primeiro) e título; o CSS usa container queries para mostrar 3 ou 2 cards
conforme a largura do dia.

### Desempenho e hábitos

Os indicadores são calculados no frontend a partir das tarefas retornadas pela
API autenticada. `buildPerformance` (`model/performance.js`) recebe só as
pontuais; `buildHabits(tasks, now, windowDays = 28)` (`model/habits.js`) calcula
o painel Hábitos sem depender do filtro de período. O agrupamento por tipo
preserva `category_icon` como `icon` para apresentar a escolha cadastrada.

### Pontos da semana

Nas periódicas, `series_start` preserva a data inicial na expansão do frontend,
evitando marcar dias anteriores ao começo da repetição. A animação de conclusão
respeita `prefers-reduced-motion`.

## Backend

| Camada | Arquivo | Uso | Papel |
| --- | --- | --- | --- |
| Transporte Edge | `server/src/edge/handler.js` | Produção | Rotas autenticadas por Bearer |
| Validação e regras | `server/src/domains/tasks/service.js` | Ambos | `validateTask` compartilhado; seleciona `postgres-service.js` no PostgreSQL ou coordena o SQLite |
| Coordenação PostgreSQL | `server/src/domains/tasks/postgres-service.js` | Produção | Transações assíncronas e resolução do tipo da conta |
| Validação de datas | `server/src/domains/tasks/validation.js` | Ambos | Datas reais e limites de cada ocorrência periódica |
| Persistência | `server/src/domains/tasks/repository.js` | Ambos | Consultas SQLite com `user_id`, ou encaminhamento para `infrastructure/postgres-repositories.js` |
| Transporte Express | `server/src/domains/tasks/routes.js` | Local | Rotas autenticadas por cookie |

Criação e atualização são transacionais. O proprietário vem da sessão. A API verifica a propriedade tanto das tarefas quanto dos tipos.

## Contrato HTTP

As rotas são relativas à base da API: `https://<project-ref>.supabase.co/functions/v1/tarefas-api` na produção e `/api` no Express local.

| Método | Rota | Sucesso |
| --- | --- | --- |
| `GET` | `/tasks` | `200` com lista em ordem decrescente de ID |
| `POST` | `/tasks` | `201` com tarefa criada |
| `PATCH` | `/tasks/:id` | `200` com tarefa atualizada |
| `DELETE` | `/tasks/:id` | `204` |

| Campo | Formato | Regra |
| --- | --- | --- |
| `title` | Texto | Obrigatório, sem espaços nas extremidades. Textos acima de 200 caracteres são cortados nesse limite, sem erro |
| `type_id` | Inteiro | ID de um tipo da conta autenticada |
| `category` | Texto | Compatibilidade com clientes anteriores, usado quando `type_id` é omitido. Resolve ou cria um tipo com esse nome. Padrão `Pessoal`. |
| `priority` | Inteiro | `1` alta, `2` média, `3` baixa. Padrão `2`. |
| `due` | `YYYY-MM-DD` ou `null` | Data válida. Continua opcional na API para aceitar tarefas antigas sem prazo. |
| `due_time` | `HH:mm` ou `null` | Horário de conclusão das **pontuais**, local de 24 horas, associado a uma data. Opcional. Nas regulares é sempre `null`: um `due_time` enviado para uma regular (clientes antigos) é gravado como `notify_time` |
| `notify_time` | `HH:mm` ou `null` | Horário de notificação das **regulares**. Opcional; não define atraso. Nas pontuais é sempre `null` |
| `tracks_overdue` | Booleano | Pontuais e regulares: `true` (padrão) marca como atrasada; `false` nunca atrasa e, quando o dia passa sem conclusão, deixa como não feita. Omitir no `PATCH` preserva o valor |
| `done` | Booleano | Aceito na atualização. Novas tarefas começam abertas. |
| `recurrence` | Texto | `none` para tarefa avulsa (padrão), `daily` para repetição diária ou `weekly` para dias da semana |
| `recurrence_days` | Array de inteiros | Obrigatório com `weekly`: dias de `0` (domingo) a `6` (sábado), normalizados sem duplicatas |
| `recurrence_until` | `YYYY-MM-DD` ou `null` | Data final inclusiva, opcional, igual ou posterior à data inicial |
| `occurrence_date` | `YYYY-MM-DD` | Usado com `done` no `PATCH` para concluir ou reabrir um dia de uma tarefa periódica |

Exemplo de criação com um ID de tipo pertencente à conta.

```json
{
  "title": "Finalizar apresentação",
  "type_id": 1,
  "priority": 1,
  "due": "2026-11-20",
  "due_time": "17:30"
}
```

As respostas também incluem `id`, `created_at`, `category`, `category_color` e `category_icon`; as periódicas trazem ainda `occurrences`. A lista utiliza nome, cor e ícone retornados pelo servidor.

O `PATCH` preserva campos omitidos. Enviar `due_time: null` remove o horário. Enviar `due: null` remove data e horário. Uma atualização de tarefa de outra conta retorna `404`. Datas, horários, prioridades ou tipos inválidos retornam `400`.

Uma tarefa periódica exige `due`, que é a data inicial. Para concluir uma ocorrência, envie `{"occurrence_date":"2026-11-20","done":true}` ao `PATCH /tasks/:id`, usando o ID da definição. A resposta traz a definição com o array `occurrences`, cujos itens contêm `due`, `done` e `skipped`.

O `DELETE /tasks/:id?date=YYYY-MM-DD` remove só a ocorrência indicada e retorna `200` com a definição atualizada. O `DELETE` sem data exclui a definição e seu histórico e retorna `204`. A chave composta de tarefa e data impede duplicação em novas tentativas. As verificações de propriedade da tarefa são aplicadas antes de qualquer alteração.

### Editar e mover

**Editar ou mover** usa o mesmo `PATCH /tasks/:id`, mantendo a autorização por
conta e o histórico. Trocar o tipo mantém o ID da tarefa. Numa periódica, o
`PATCH` altera a definição inteira.

## Diferenças entre produção e Express

Na produção, `server/src/edge/handler.js` recebe as requisições, autentica por
Bearer e usa PostgreSQL; o adaptador mantém uma conexão por transação. `POST` e
`PATCH` sem `Content-Type: application/json` retornam `415`, e corpos acima de
16 KB retornam `413`. O Express local aplica o mesmo limite de tamanho, autentica
por cookie e usa SQLite. As duas versões da coordenação preservam o filtro de
proprietário e o mesmo contrato JSON; ao mudar uma, mude a outra. O frontend usa
`VITE_API_URL` para escolher a base sem alterar as regras de agenda.

## Repetição em dias selecionados

A API aceita `recurrence: "weekly"` e `recurrence_days: [1, 3, 5]`, por exemplo,
para segunda, quarta e sexta. Os números vão de 0 (domingo) a 6 (sábado). A lista
é normalizada sem duplicatas. É obrigatório selecionar pelo menos um dia e, se
houver data final, o intervalo deve incluir uma ocorrência programada.

`recurrence_until` guarda a data final calculada pelo formulário. Tarefas diárias
continuam aceitando `daily`. As conclusões e remoções usam o mesmo histórico por
data. A API rejeita alterações de ocorrência fora dos dias e do período escolhidos.

## Migrações

A migração PostgreSQL `202611180001_weekly_recurrence.sql` adiciona
`recurrence_days` e amplia a restrição de repetição. SQLite adiciona a coluna ao
iniciar. As migrações PostgreSQL são aplicadas em ordem pelos scripts do projeto.

A migração `202611240001_notify_time.sql` adiciona `notify_time` e
`tracks_overdue` (padrão `1`) e move o `due_time` das regulares existentes para
`notify_time`. Pode ser repetida sem efeito. O SQLite faz o mesmo ao iniciar.
