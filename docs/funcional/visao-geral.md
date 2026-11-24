# Visão geral do app

O nextOrganize é uma agenda pessoal com contas individuais, calendário mensal e
tarefas organizadas por data, horário e tipo. Este documento lista o que o app
faz e como usá-lo; os detalhes de cada tela estão em [Agenda](agenda.md),
[Desempenho](desempenho.md) e [Tipos](tipos.md).

## Funcionalidades

- Cadastro, login e saída, com tarefas e tipos próprios para cada conta.
- Resumo de tarefas para hoje, nos próximos sete dias e em aberto.
- Calendário com marcações coloridas e listagem das tarefas do dia selecionado, inicialmente o dia atual.
- Cadastro por janela aberta no botão **Nova tarefa**, com título, tipo, prioridade e data. Pontuais podem ter horário de conclusão ou não; regulares têm horário de notificação opcional (os lembretes ainda não são enviados).
- Tipos personalizados com nome, cor e ícone, criados em **Tipos → Novo tipo** ou durante o cadastro de uma tarefa e editáveis em **Tipos → Personalizar tipos**.
- Edição de tarefas (título, tipo, prioridade, data e horário) pelo menu `⋯` do card.
- Tarefas de hoje priorizadas na ordenação e atrasadas com selo **Atrasada** e contagem no atalho **Em aberto**. Cada atividade escolhe se um dia passado sem conclusão fica **Atrasada** ou só **Não feita**.
- Conclusão, reabertura, exclusão, filtro por tipo e opção de ocultar concluídas.
- Tarefas diárias ou em dias da semana selecionados, com duração por dias/semanas ou data final, conclusão independente por ocorrência e combo de ocorrências cumpridas.
- Lista com rolagem interna, mantendo o calendário e os controles visíveis. No celular, a página não rola: a lista ocupa a tela e o calendário abre como uma aba no pé da tela.
- Lista do dia com as atividades habituais (diárias e semanais, fora do calendário) e depois as pontuais, separadas por subtítulos com a contagem de concluídas.
- Interface com navegação lateral, tema escuro inicial em tons azul-acinzentados e opção de alternar para o tema claro.
- Busca por título ou tipo de atividade, aplicada à lista e às marcações do calendário.
- Navegação entre **Início**, com a agenda, e **Desempenho**, com o painel **Hábitos** (consistência de 28 dias, sequências, dias perfeitos e taxa por dia da semana) e, para as pontuais, taxa de conclusão, pendências e gráficos por tipo, prioridade e data de prazo.

## Como usar

1. Crie sua conta com nome (até 100 caracteres), e-mail e senha de 8 a 128 caracteres ou entre com uma conta existente.
2. Clique em **Nova tarefa** e informe título, tipo, prioridade e data; numa pontual, escolha **Com** ou **Sem** horário.
3. Use **Tipos → Novo tipo** para criar categorias como Trabalho, Físico e Alimentação com suas próprias cores e ícones.
4. Selecione um dia no calendário para consultar suas tarefas. Os atalhos **Hoje**, **7 dias** e **Em aberto** da barra da agenda abrem as respectivas listas.
5. Use a caixa de seleção para concluir ou reabrir uma tarefa. Pendências que passaram do prazo recebem o selo **Atrasada** e são contadas em **Em aberto**.
6. Role a lista ao lado do calendário para acessar as demais tarefas.

Para criar uma tarefa periódica (habitual), escolha **Habitual** na janela de
cadastro e depois **Todos os dias** ou **Dias da semana**. Informe a data
inicial, o horário do lembrete e, se desejar, uma duração ou data final. O card
mostra a programação e o combo atual quando houver ocorrências consecutivas
concluídas. No menu `⋯`, é possível usar **Remover só deste dia** ou **Excluir
repetição e histórico**.

## Conta e acesso

- O cadastro pede nome de até 100 caracteres, e-mail de até 254 caracteres e
  senha de 8 a 128 caracteres, e já entra na conta.
- Cada conta vê só as próprias tarefas e tipos. Uma conta nova começa com os
  tipos Trabalho, Físico, Alimentação, Pessoal e Estudos.
- A sessão dura sete dias. Na versão publicada, fechar a aba encerra a sessão
  guardada no navegador.
- Ao sair, ou quando a sessão expira, o app volta para a tela de entrada.
- Depois de 30 tentativas de login num intervalo de 15 minutos, novas
  tentativas são recusadas por um tempo.
