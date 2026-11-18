# Domínio de tarefas e agenda

## Frontend

| Camada | Arquivo ou pasta | Papel |
| --- | --- | --- |
| Apresentação | `client/src/domains/tasks/Dashboard.jsx` | Compor resumo, seleção de data, filtros e ações |
| Apresentação | `client/src/domains/tasks/PerformanceDashboard.jsx` | Indicadores, filtros de período e gráficos de desempenho |
| Apresentação | `components/Calendar.jsx` | Mês de 42 células com contagem e cores dos tipos de cada dia |
| Apresentação | `components/TaskList.jsx` | Lista com rolagem interna e seções para tarefas diárias e avulsas |
| Apresentação | `components/TaskDialog.jsx` | Cadastro em janela com título, tipo, prioridade, data e horário |
| Aplicação | `hooks/useTasks.js` | Carga inicial e atualização do estado após operações da API |
| Regras | `model/schedule.js` | Datas locais, atrasos, próximos dias e ordenação |
| Regras | `model/performance.js` | Taxa de conclusão, distribuição de status e agregação por tipo, prioridade e prazo |
| Regras | `model/recurrence.js` | Repetição diária, ocorrências por data e combo de dias consecutivos |
| Integração | `api.js` | Listagem, criação, atualização e exclusão |

Os caminhos abreviados na tabela pertencem a `client/src/domains/tasks/`.

### Comportamento da agenda

- O dia atual é selecionado na abertura. Clicar em outro dia mostra suas tarefas ao lado do calendário.
- A barra lateral alterna entre **Início**, com a agenda, e **Desempenho**, com os indicadores de todas as tarefas da conta, independentemente da busca e dos filtros da agenda.
- O resumo mostra tarefas em aberto para hoje, para os próximos sete dias e o total em aberto. Os atalhos Hoje, 7 dias e Em aberto na barra da agenda abrem as respectivas seleções.
- Uma tarefa fica atrasada após sua data ou após o horário de conclusão no dia atual. Uma tarefa antiga sem horário fica atrasada quando a data passa.
- A ordenação apresenta primeiro as tarefas de hoje com prazo em aberto, depois as futuras, as sem prazo, as atrasadas e as concluídas. Dentro desses grupos, considera data, horário e prioridade.
- Cada tarefa atrasada recebe texto de status e borda tracejada. A cor do tipo continua visível. O resumo informa quantas atividades abertas estão atrasadas.
- As cores e os números no calendário representam as tarefas que passam pelos filtros de tipo e conclusão.
- Os dias mostram a quantidade total de tarefas e até quatro marcadores nas cores dos tipos, sem repetir cores. Dias com todas as tarefas concluídas têm indicadores atenuados. Os detalhes das atividades aparecem na lista ao selecionar o dia.
- A lista usa uma apresentação de agenda com horário acima de cada card e faixa na cor do tipo. A busca por título ou tipo filtra a lista e o calendário, combinada aos demais filtros. O resumo considera todas as tarefas da conta.
- A tela usa a altura da janela. Em telas estreitas, calendário e lista ficam empilhados. A lista tem rolagem interna e permite navegação pelo teclado quando recebe foco. Alterar a data ou os filtros retorna a rolagem ao início.
- A seção **Rotina diária** é retrátil e começa expandida. Clique no cabeçalho ou use Enter ou Espaço quando ele receber foco para recolher ou expandir as diárias. A contagem de concluídas permanece no cabeçalho. Recolher a seção mantém as atividades nos indicadores e no calendário.
- A janela de cadastro preenche a data selecionada e exige que o usuário informe o horário. O título aceita até 120 caracteres na interface.

### Tarefas diárias e combo

No cadastro, a repetição pode ser **Uma vez** ou **Todos os dias**. Uma diária usa a data informada como início, repete no mesmo horário e pode ter uma data final opcional. Cada data possui conclusão própria. O calendário expande as repetições para o mês em exibição, e selecionar um dia mostra sua ocorrência na lista.

As diárias têm cards compactos em estilo checklist, com checkbox circular, identificação de repetição, combo e horário dentro do card. O espaçamento entre esses cards é reduzido. Na visualização separada, a seção **Rotina diária** mostra quantas ocorrências visíveis foram concluídas.

O combo conta dias consecutivos marcados como concluídos. A sequência de ontem continua visível enquanto o dia atual está em aberto. Concluir hoje aumenta o combo. Um dia anterior sem conclusão ou um dia removido interrompe a sequência. Datas futuras concluídas antecipadamente entram na sequência quando sua data chegar.

O menu `⋯` do card oferece **Remover só deste dia** e **Excluir diária e histórico**. A primeira opção registra uma exceção para aquela data. A segunda remove a definição e suas conclusões. Reabrir um dia atualiza a sequência e os indicadores.

O resumo e as listas gerais incluem o histórico de diárias e os próximos sete dias. O dashboard de desempenho considera as ocorrências diárias até o dia atual. A navegação por meses futuros expande apenas a visualização do calendário, preservando os indicadores históricos. As tarefas avulsas seguem suas próprias datas.

### Indicadores de desempenho

A taxa de conclusão é o número de tarefas marcadas como concluídas dividido pelo total de tarefas do período. A tela também mostra concluídas, em aberto, sem atraso e atrasadas. As tarefas abertas sem prazo entram no grupo sem atraso. Quando não há atividades, a taxa é exibida como um traço.

Os filtros **Este mês** e **Últimos 7 dias** usam a data de prazo. O segundo considera o dia atual e os seis dias anteriores. **Todo o histórico** inclui também tarefas sem prazo. Os gráficos usam o estado atual de conclusão de cada tarefa. O gráfico de prazos agrupa atividades pela data prevista de conclusão.

Os tipos são paginados em grupos de quatro. A conclusão por prioridade usa a mesma seleção de período. Os indicadores são calculados no frontend a partir das tarefas retornadas pela API autenticada.

## Backend

| Camada | Arquivo | Papel |
| --- | --- | --- |
| Transporte | `server/src/domains/tasks/routes.js` | Rotas autenticadas de tarefas |
| Aplicação | `server/src/domains/tasks/service.js` | Validar campos e resolver um tipo pertencente ao usuário |
| Persistência | `server/src/domains/tasks/repository.js` | Consultas com `user_id` e associação ao nome e cor do tipo |
| Validação | `server/src/domains/tasks/validation.js` | Datas reais e limites de cada ocorrência diária |

Criação e atualização são transacionais. O proprietário vem da sessão. A API verifica a propriedade tanto das tarefas quanto dos tipos.

## Contrato HTTP

| Método | Rota | Sucesso |
| --- | --- | --- |
| `GET` | `/api/tasks` | `200` com lista em ordem decrescente de ID |
| `POST` | `/api/tasks` | `201` com tarefa criada |
| `PATCH` | `/api/tasks/:id` | `200` com tarefa atualizada |
| `DELETE` | `/api/tasks/:id` | `204` |

| Campo | Formato | Regra |
| --- | --- | --- |
| `title` | Texto | Obrigatório, sem espaços nas extremidades, limitado a 200 caracteres na API |
| `type_id` | Inteiro | ID de um tipo da conta autenticada |
| `category` | Texto | Compatibilidade com clientes anteriores, usado quando `type_id` é omitido. Resolve ou cria um tipo com esse nome. Padrão `Pessoal`. |
| `priority` | Inteiro | `1` alta, `2` média, `3` baixa. Padrão `2`. |
| `due` | `YYYY-MM-DD` ou `null` | Data válida. Continua opcional na API para aceitar tarefas antigas sem prazo. |
| `due_time` | `HH:mm` ou `null` | Horário local de 24 horas, associado a uma data. Opcional na API. |
| `done` | Booleano | Aceito na atualização. Novas tarefas começam abertas. |
| `recurrence` | Texto | `none` para tarefa avulsa, padrão, ou `daily` para repetição diária |
| `recurrence_until` | `YYYY-MM-DD` ou `null` | Data final inclusiva, opcional, igual ou posterior à data inicial |
| `occurrence_date` | `YYYY-MM-DD` | Usado com `done` no `PATCH` para concluir ou reabrir um dia de uma tarefa diária |

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

As respostas também incluem `id`, `created_at`, `category` e `category_color`. A lista utiliza nome e cor retornados pelo servidor.

O `PATCH` preserva campos omitidos. Enviar `due_time: null` remove o horário. Enviar `due: null` remove data e horário. Uma atualização de tarefa de outra conta retorna `404`. Datas, horários, prioridades ou tipos inválidos retornam `400`.

Uma tarefa diária exige `due`. Para concluir uma ocorrência, envie `{"occurrence_date":"2026-11-20","done":true}` ao `PATCH /api/tasks/:id`, usando o ID da definição. A resposta traz a definição com o array `occurrences`, cujos itens contêm `due`, `done` e `skipped`.

O `DELETE /api/tasks/:id?date=YYYY-MM-DD` remove só a ocorrência indicada e retorna `200` com a definição atualizada. O `DELETE` sem data exclui a definição e seu histórico e retorna `204`. A chave composta de tarefa e data impede duplicação em novas tentativas. As verificações de propriedade da tarefa são aplicadas antes de qualquer alteração.

## Execução com PostgreSQL e Edge

`tasks/service.js` seleciona `postgres-service.js` para o adaptador PostgreSQL.
Os repositórios de domínio encaminham as operações para
`infrastructure/postgres-repositories.js`; o adaptador mantém uma conexão por
transação. As consultas preservam o filtro de proprietário e o contrato JSON.

Na Edge, `server/src/edge/handler.js` recebe as requisições; substitua o prefixo
`/api` das rotas acima por `/functions/v1/tarefas-api`. A autenticação usa Bearer.
O frontend usa `VITE_API_URL` para escolher a base sem alterar as regras de agenda.
A implantação efetiva está registrada em [estado da integração](../migration-status.md).


## Repetição em dias selecionados

Em **Nova tarefa → Repetição → Dias da semana**, selecione os dias desejados.
A duração pode ser sem data final, até uma data ou por uma quantidade de dias ou
semanas. O período é contado desde a data inicial e inclui o último dia; semanas
representam blocos de sete dias, não uma quantidade de ocorrências.

A API aceita `recurrence: "weekly"` e `recurrence_days: [1, 3, 5]`, por exemplo,
para segunda, quarta e sexta. Os números vão de 0 (domingo) a 6 (sábado). A lista
é normalizada sem duplicatas. É obrigatório selecionar pelo menos um dia e, se
houver data final, o intervalo deve incluir uma ocorrência programada.

`recurrence_until` guarda a data final calculada pelo formulário. Tarefas diárias
continuam aceitando `daily`. As conclusões e remoções usam o mesmo histórico por
data. A API rejeita alterações de ocorrência fora dos dias e do período escolhidos.
O combo considera ocorrências programadas consecutivas, sem interromper por dias
não selecionados. O calendário e os indicadores expandem somente esses dias.

A migração PostgreSQL `202611180001_weekly_recurrence.sql` adiciona
`recurrence_days` e amplia a restrição de repetição. SQLite adiciona a coluna ao
iniciar. As migrações PostgreSQL são aplicadas em ordem pelos scripts do projeto.


## Editar e mover uma tarefa

O botão de lápis no card abre **Editar tarefa**, preenchido com os dados atuais.
É possível mudar título, tipo, prioridade, data e horário. Mudar a data move a
tarefa na agenda; trocar o tipo mantém seu ID e usa a nova categoria/cor. O mesmo
`PATCH /tasks/:id` é usado, mantendo a autorização por conta e o histórico.

Para uma ocorrência periódica, a janela edita a definição da repetição inteira,
e informa esse alcance antes de salvar. Não move somente uma ocorrência isolada.
O histórico permanece gravado, mas mudar o intervalo ou os dias programados pode
retirar ocorrências antigas da visualização. Os filtros da lista são limpos após
a edição para facilitar a localização da tarefa atualizada.


## Retorno visual e progresso

Na seleção de um dia, a lista mostra o progresso das tarefas que correspondem
à busca e ao tipo selecionados. O cálculo inclui concluídas mesmo quando
**Ocultar concluídas** está ativo. A primeira tarefa aberta sem atraso na ordem
atual recebe o destaque **Seu próximo passo**; se todas estiverem atrasadas, o
destaque usa a primeira aberta. Essa indicação não altera prioridade ou prazo.

Os cards destacam a cor do tipo e recebem um estado de conquista ao concluir.
A animação breve ocorre somente após a conclusão confirmada pela API, respeitando
`prefers-reduced-motion`. Não há pontos ou recompensas fictícias.

As periódicas exibem uma trilha de segunda a domingo para a semana da ocorrência,
com dias programados, concluídos e removidos. `series_start` preserva a data
inicial na expansão do frontend, evitando marcar dias anteriores ao começo da
repetição. A trilha apenas apresenta o histórico, sem alterar ocorrências.


## Agenda ampliada

A tela principal usa quase toda a janela, com uma faixa superior compacta para
identificação e ações. O calendário e o painel de tarefas compartilham uma área
que cresce com o espaço disponível. A barra interna reúne Hoje (incluindo a
contagem de concluídas), 7 dias, Em aberto e busca. Os detalhes de atrasos também
ficam disponíveis na descrição do atalho Em aberto.

O menu **Tipos** reúne Novo tipo e Personalizar tipos, ao lado de Nova tarefa.
Filtros por tipo/conclusão e progresso do dia permanecem no painel da direita.
Em telas estreitas, calendário e tarefas ficam empilhados. Em janelas muito
baixas, a tela pode rolar para manter os controles e os painéis utilizáveis.
A tela de desempenho mantém sua composição própria.


## Dashboard de desempenho no estilo da agenda

A tela Desempenho usa a mesma área ampliada, cores e linguagem de ícones da
agenda. Os quatro indicadores possuem símbolos próprios para taxa de conclusão,
concluídas, abertas e atrasadas. Os tipos usam o ícone personalizado e sua cor no
painel de progresso por tema, mantendo a paginação de quatro tipos.

A visão geral, o gráfico dos últimos sete dias e a distribuição por prioridade
continuam usando as mesmas regras e o mesmo filtro por data de prazo. As barras
mostram valores reais, sem estimativas de crescimento. O agrupamento por tipo
preserva `category_icon` como `icon` para apresentar a escolha cadastrada.

Em telas grandes, os painéis ficam em duas colunas; em telas pequenas, ficam
empilhados com rolagem vertical. A altura mínima dos gráficos evita comprimir
indicadores e legendas para forçar todos os painéis em uma única tela.


## Calendário: pontuais e regulares

O calendário usa uma grade mensal contínua. Atividades pontuais aparecem como
ícones destacados em um pequeno bloco na cor do tipo. As regulares (`daily` e `weekly`) aparecem
como pequenos pontos discretos nas cores dos tipos. Não há duas caixas de
contagem em cada célula; a legenda explica a diferença de forma.

Cada célula apresenta um ícone por tipo de atividade pontual, sem título visível e sem
limite ou agrupamento em `+N`. Os ícones quebram em linhas e as semanas acomodam
o conteúdo. Se necessário, a grade possui rolagem própria, sem cortar os ícones. O ícone fica atenuado somente quando todas as pontuais daquele tipo no dia
estiverem concluídas. Tipos diferentes não são agrupados por usarem o mesmo
ícone ou cor. As regulares usam até quatro pontos por tipo, sem ícones ou contadores
na célula; eles indicam presença de tipos, não quantidade de tarefas. A lista da direita mostra as atividades completas ao
selecionar o dia. O tooltip contém as contagens e os nomes das atividades, e o
rótulo acessível informa data, pontuais, regulares e concluídas.

Hoje recebe destaque no número, o dia selecionado tem contorno e a conclusão de
todas as atividades visíveis recebe um símbolo de confirmação. Ícones de tipos
com todas as atividades concluídas ficam atenuados. Os filtros de tipo, busca e conclusão
continuam sendo aplicados, sem alterar os dados das tarefas.

Os marcadores de cada grupo do calendário priorizam tipos com mais atividades
pendentes. Tipos totalmente concluídos aparecem por último; empates usam o nome
do tipo em ordem alfabética. A ordenação se atualiza ao concluir ou reabrir tarefas
e se aplica tanto aos ícones pontuais quanto aos pontos de atividades regulares.
