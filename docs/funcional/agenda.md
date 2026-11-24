# Agenda: tarefas, hábitos e calendário

Como a tela **Início** funciona para quem usa o app. A parte técnica (arquivos,
API e banco) está em [Tarefas: técnico](../tecnico/dominios/tarefas.md).

Na interface, as tarefas de uma vez se chamam **pontuais** e as que se repetem
(diárias ou em dias da semana) se chamam **atividades habituais**; no código e
na API elas ainda aparecem como "regulares".

## Horários e atraso

Regulares (diárias e dias da semana) e pontuais (uma vez) tratam horário e atraso
de formas diferentes. Implementado em 24/11/2026; veja o [histórico](../historico.md).

| | Pontuais | Regulares |
| --- | --- | --- |
| Horário | **Horário de conclusão**, opcional: a janela oferece **Com** ou **Sem** horário | **Horário de notificação**, opcional. Os lembretes ainda não existem: o horário só fica guardado |
| Fica atrasada | Depois do horário de conclusão no dia; sem horário, quando a data passa | Nunca no próprio dia. Depois que o dia passa, depende da escolha abaixo |
| Dia passado sem conclusão | **Atrasada** ou **Não feita**, conforme a opção **Se o dia passar sem concluir** (padrão: atrasada) | **Atrasada** ou **Não feita**, conforme a mesma opção (padrão: atrasada) |

Uma ocorrência **Não feita** aparece em tom neutro, não entra em **Em aberto** nem
na contagem de atrasadas, aparece no Desempenho como **Não feitas** e interrompe o
combo. Concluí-la depois continua possível, pela lista do dia.

## Comportamento da agenda

- O dia atual é selecionado na abertura. Clicar em outro dia mostra suas tarefas ao lado do calendário.
- A barra lateral alterna entre **Início**, com a agenda, e **Desempenho**, com os indicadores de todas as tarefas da conta, independentemente da busca e dos filtros da agenda.
- O resumo mostra tarefas em aberto para hoje, para os próximos sete dias e o total em aberto. Os atalhos Hoje, 7 dias e Em aberto na barra da agenda abrem as respectivas seleções.
- O atraso segue as regras de [Horários e atraso](#horários-e-atraso).
- A ordenação apresenta primeiro as tarefas de hoje com prazo em aberto, depois as futuras, as sem prazo, as atrasadas, as não feitas e as concluídas. Dentro desses grupos, considera data, horário (de conclusão ou de notificação) e prioridade.
- Cada tarefa atrasada recebe o selo **Atrasada** e a borda esquerda na cor de atraso. Não há uma seção separada de atrasadas: o atalho **Em aberto** informa quantas atividades abertas estão atrasadas.
- Os marcadores do calendário representam as tarefas que passam pelos filtros de tipo, busca e conclusão. A forma dos marcadores está descrita em [Calendário](#calendário-pontuais-e-habituais). Os detalhes das atividades aparecem na lista ao selecionar o dia.
- A lista usa cards enxutos com a borda esquerda na cor do tipo (veja [Cards da lista](#cards-da-lista)). A busca por título ou tipo filtra a lista e o calendário, combinada aos demais filtros. O resumo considera todas as tarefas da conta.
- A tela usa a altura da janela. Em telas estreitas, calendário e lista ficam empilhados, sem rolagem da página: a lista ocupa a tela e o calendário abre como uma aba por cima dela. A lista tem rolagem interna e permite navegação pelo teclado quando recebe foco. Alterar a data ou os filtros retorna a rolagem ao início.
- Regulares e pontuais ficam numa lista só, nessa ordem. Cada grupo começa com um subtítulo discreto, com a contagem de concluídas e uma linha fina (`HABITUAIS 1/3`, depois `PONTUAIS 0/2`).
- O progresso do dia conta só as atividades da data selecionada.

## Janela Nova atividade

A janela **Nova atividade** começa com a escolha entre **Pontual** (acontece uma
vez) e **Habitual** (se repete), e o resto se adapta. Depois vêm:

- o título;
- o tipo em chips com ícone e cor (com **Novo tipo** no fim);
- a prioridade em botões segmentados (Alta, Média, Baixa);
- a seção **Quando** (pontuais: data e horário **Com**/**Sem**, com horário
  obrigatório em **Com**) ou **Repetição** (habituais: Todos os dias ou Dias da
  semana, data inicial, lembrete e duração);
- por fim **Se o dia passar sem concluir**, em dois cartões: **Atrasada** ou
  **Não feita**, para os dois tipos.

Os botões ficam presos ao pé da janela. Ela preenche a data selecionada; o título
aceita até 200 caracteres.

## Tarefas diárias e combo

No cadastro, a repetição pode ser **Uma vez**, **Todos os dias** ou **Dias da semana** (descrita em [Repetição em dias selecionados](#repetição-em-dias-selecionados)). Uma diária usa a data informada como início e pode ter uma data final opcional. Cada data possui conclusão própria. O calendário expande as repetições para o mês em exibição, e selecionar um dia mostra sua ocorrência na lista.

### Cards da lista

Regulares e pontuais usam o mesmo card enxuto, em estilo checklist: checkbox
circular, ícone do tipo, título e uma linha de detalhes. O menu de reticências
reúne **Editar ou mover** e a exclusão. Nas visões de vários dias (7 dias, Em
aberto), a linha de detalhes inclui a data.

- **Regulares:** a programação ("Todo dia" ou os dias da semana), o horário de
  notificação com um sino e os selos **Atrasada** ou **Não feita**. À direita ficam
  o combo (quando houver) e sete pontos com a semana: programado, concluído e o dia
  exibido em destaque; ocultos em telas estreitas. O menu oferece **Remover só
  deste dia** e **Excluir repetição e histórico**.
- **Pontuais:** o horário de conclusão com um relógio (sem horário, nada aparece;
  sem data, "Sem prazo"), "Prioridade alta" quando for o caso e os selos
  **Atrasada** ou **Não feita**. O menu oferece **Excluir**. Se não houver detalhes, a linha some.

A próxima atividade pendente sem atraso recebe um fundo mais forte na cor do tipo.
No computador os cards são maiores (ícone de 50px, título maior e sombra); no
celular ficam compactos (ícone de 36px).

O combo conta dias consecutivos marcados como concluídos. A sequência de ontem continua visível enquanto o dia atual está em aberto. Concluir hoje aumenta o combo. Um dia anterior sem conclusão ou um dia removido interrompe a sequência. Datas futuras concluídas antecipadamente entram na sequência quando sua data chegar.

O menu `⋯` do card das regulares oferece **Remover só deste dia** e **Excluir repetição e histórico**. A primeira opção registra uma exceção para aquela data. A segunda remove a definição e suas conclusões. Reabrir um dia atualiza a sequência e os indicadores.

O resumo e as listas gerais incluem o histórico de diárias e os próximos sete dias. O dashboard de desempenho considera as ocorrências diárias até o dia atual. A navegação por meses futuros expande apenas a visualização do calendário, preservando os indicadores históricos. As tarefas avulsas seguem suas próprias datas.

## Repetição em dias selecionados

Em **Nova atividade → Habitual → Dias da semana**, selecione os dias desejados.
A duração pode ser sem data final, até uma data ou por uma quantidade de dias ou
semanas. O período é contado desde a data inicial e inclui o último dia; semanas
representam blocos de sete dias, não uma quantidade de ocorrências.

É obrigatório selecionar pelo menos um dia e, se houver data final, o intervalo
deve incluir uma ocorrência programada. As conclusões e remoções usam o mesmo
histórico por data. O combo considera ocorrências programadas consecutivas, sem
interromper por dias não selecionados. O calendário e os indicadores expandem
somente esses dias.

## Editar e mover uma tarefa

**Editar ou mover**, no menu de reticências do card, abre **Editar atividade**,
preenchido com os dados atuais.
É possível mudar título, tipo, prioridade, data, horário e a escolha de atraso.
Mudar a data move a tarefa na agenda; trocar o tipo mantém a tarefa e usa a nova
categoria/cor. O histórico é mantido.

Para uma ocorrência periódica, a janela edita a definição da repetição inteira,
e informa esse alcance antes de salvar. Não move somente uma ocorrência isolada.
O histórico permanece gravado, mas mudar o intervalo ou os dias programados pode
retirar ocorrências antigas da visualização. Os filtros da lista são limpos após
a edição para facilitar a localização da tarefa atualizada.

## Retorno visual e progresso

Na seleção de um dia, a lista mostra o progresso das tarefas que correspondem
à busca e ao tipo selecionados. O cálculo inclui concluídas mesmo quando
**Ocultar concluídas** está ativo. A primeira tarefa pendente sem atraso na ordem
atual recebe um fundo mais forte na cor do tipo; se todas estiverem atrasadas, o
destaque usa a primeira pendente. Não feitas não recebem o destaque. Essa
indicação não altera prioridade ou prazo.

Os cards destacam a cor do tipo e recebem um estado de conquista ao concluir.
A animação breve ocorre somente após a conclusão confirmada pela API, respeitando
a preferência do sistema por movimento reduzido. Não há pontos ou recompensas fictícias.

As periódicas exibem sete pontos, de segunda a domingo, para a semana da
ocorrência, com dias programados e concluídos; o dia exibido tem um anel e os dias
fora da programação ficam vazados. Dias anteriores ao começo da repetição não
são marcados. Os pontos apenas apresentam o histórico, sem alterar ocorrências.

## Agenda ampliada

A tela principal usa quase toda a janela, com uma faixa superior compacta para
identificação e ações. O calendário e o painel de tarefas compartilham uma área
que cresce com o espaço disponível. A barra interna reúne Hoje (incluindo a
contagem de concluídas), 7 dias, Em aberto e busca. Os detalhes de atrasos também
ficam disponíveis na descrição do atalho Em aberto.

O dia atual tem o mesmo selo azul **Hoje** (com ícone de sol) em toda a
plataforma. A data por extenso aparece uma vez só, no cabeçalho do calendário, e
acompanha o dia selecionado, o mesmo da lista:

- Calendário (computador) ou faixa superior (celular): um selo com a distância
  até hoje (**Hoje** em azul cheio; **Amanhã**, **Ontem**, "Em 3 dias" ou
  "Há 3 dias" contornados) e a data do dia selecionado em letra grande. No
  celular, a aba recolhida mostra só o mês e o botão **Ver mês**; com a aba
  aberta, a data volta para o cabeçalho, em forma curta.
- Título da lista: "Programação de hoje", "de amanhã", "de ontem" ou "do dia",
  sem repetir a data; fora de hoje, o botão **Voltar para hoje**.
- Cards nas visões de vários dias: o selo no lugar da data quando é hoje.
- Desempenho: a coluna de hoje destacada no gráfico dos últimos 7 dias, com o
  rótulo "Hoje".

O menu **Tipos** reúne Novo tipo e Personalizar tipos, ao lado de Nova tarefa.
No celular, a faixa superior fica numa linha só: saudação e data à esquerda e,
à direita, Tipos e Nova tarefa como botões de ícone.
O filtro de conclusão (**Ocultar concluídas**) e o progresso do dia ficam no
painel da direita. O filtro por tipo da lista (**Todos os tipos**) aparece só no
celular, como uma pílula que fica azul com um tipo escolhido; no computador, o
filtro por tipo fica nos botões do topo do calendário.

Em telas estreitas (até 760px), tudo cabe na tela sem rolar a página: só a lista
do dia rola por dentro. O calendário vira uma aba presa ao pé da tela, mostrando
só o mês e um botão azul **Ver mês** para abrir (as setas de mês e **Hoje**
aparecem com a aba aberta). Tocar no mês, na seta ou no puxador do topo abre a
aba por cima de tudo, inclusive da barra lateral, ocupando quase a tela inteira,
com os tipos e uma grade própria do celular: as seis semanas dividem a altura,
cada dia é um bloco com fundo, número grande centralizado e o dia atual num
círculo; tocar num dia, no fundo escurecido, no puxador ou na seta fecha a aba.
A aba sobe e desce com animação (desligada quando o sistema pede movimento
reduzido). No computador a seta não aparece e o calendário fica sempre aberto.
Em janelas muito baixas, a tela pode rolar para manter os controles e os painéis
utilizáveis. A tela de desempenho mantém sua composição própria.

## Calendário: pontuais e habituais

Com **Todos** no filtro, as atividades habituais não aparecem no calendário:
ficam na lista do dia, no grupo **Habituais**, e no painel **Hábitos** do
Desempenho; o tooltip do dia só cita quantas habituais existem. Ao escolher um
tipo no filtro do topo, o calendário mostra todas as atividades desse tipo,
habituais inclusive, com o marcador de ícone: um quadrado na cor do tipo, com a
quantidade num selinho e apagado quando todas foram concluídas.

Dentro de cada dia, cada pontual vira um card, como no mês do calendário da
Apple, com o ícone do tipo antes do título: sem horário, uma barra tingida na
cor do tipo; com horário, o ícone na cor do tipo, o título e a hora à direita.
Os cards seguem a ordem: primeiro os sem horário, depois por horário. Concluídas
ficam apagadas e riscadas. Cabem até três por dia; em dias estreitos, dois e sem
a hora; no celular, cards menores. O restante vira "+N mais" (ou só "+N" no
celular).

O calendário usa uma grade mensal. No computador e no celular, os dias usam a
mesma coloração: cada dia do mês é um bloco arredondado com fundo cheio, dias
com tarefas ficam um tom mais azulado e dias de outros meses ficam transparentes
e apagados. No computador, o número fica numa pílula, a contagem de pendentes no
canto e o bloco sobe levemente ao passar o mouse.

Os filtros por tipo ficam no topo do calendário, logo abaixo do cabeçalho do
mês. **Todos** tem estilo próprio (ícone de grade e borda tracejada; selecionado,
fica preenchido na cor de ação) e é separado dos tipos por um divisor.

A lista da direita mostra as atividades completas ao selecionar o dia. O tooltip
contém as contagens e os nomes das atividades, e o rótulo acessível informa
data, pontuais, concluídas e habituais.

Hoje recebe destaque forte, no computador e no celular: contorno e brilho na
cor de ação, fundo tingido, número num círculo cheio e o rótulo **HOJE**. Além
disso, o dia selecionado tem contorno e a conclusão de todas as atividades
visíveis recebe um símbolo de confirmação. Os filtros de tipo, busca e conclusão
continuam sendo aplicados, sem alterar os dados das tarefas.
