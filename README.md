# nextOrganize

<img src="client/public/favicon.svg" alt="" width="56" height="56">

Agenda pessoal para organizar o dia: tarefas pontuais com data e horário,
hábitos que se repetem e um painel que mostra como você está indo. Cada pessoa
tem a própria conta, com as próprias tarefas e tipos.

## O que dá para fazer

- **Planejar o dia e o mês.** Um calendário mensal mostra as tarefas de cada dia
  como cards na cor do tipo, e a lista ao lado traz a programação do dia
  escolhido.
- **Cuidar dos hábitos.** Atividades diárias ou em dias da semana ficam na lista
  do dia, com combo de dias seguidos; no Desempenho, o painel **Hábitos** mostra
  consistência, sequências e dias perfeitos dos últimos 28 dias.
- **Saber o que está atrasado.** Cada atividade escolhe se, ao passar o dia sem
  concluir, fica **Atrasada** ou só **Não feita**. O atalho **Em aberto** conta as
  pendências.
- **Organizar por tipos.** Trabalho, Físico, Estudos e o que mais quiser, cada
  um com cor e ícone próprios, usados para filtrar a agenda.
- **Acompanhar o desempenho.** Taxa de conclusão, atrasadas e gráficos por tipo,
  prioridade e prazo.
- **Usar no computador ou no celular.** No celular, a tela não rola: a lista
  ocupa a tela e o calendário abre como uma aba. Há tema escuro e claro.

## Como é feito

Interface em React e Vite. Em produção, a API é uma Edge Function do Supabase com
PostgreSQL, e o frontend é publicado na Netlify. Para desenvolver, há uma API
Express com SQLite que roda na própria máquina.

Para rodar localmente, com Node.js 22 ou superior:

```sh
npm run setup
npm run dev
```

Depois abra `http://localhost:5173`. Os outros modos, as variáveis e os testes
estão em [Executar, configurar e verificar](docs/tecnico/execucao.md).

## Documentação

| | |
| --- | --- |
| [Funcional](docs/funcional/README.md) | O que o app faz, tela por tela: agenda, hábitos, desempenho e tipos |
| [Técnica](docs/tecnico/README.md) | Execução, arquitetura, Supabase, ferramentas, API e banco |
| [Histórico](docs/historico.md) | Mudanças por data e o que está planejado |
