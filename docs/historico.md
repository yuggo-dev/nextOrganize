# Histórico do projeto

Registro das mudanças do nextOrganize, da mais recente para a mais antiga. Cada
entrada diz o que mudou para quem usa o app e o que mudou por dentro. Detalhes
técnicos ficam nos documentos de cada assunto; detalhes da nuvem ficam no
[estado da integração](migration-status.md).

**Como manter:** ao terminar uma mudança, acrescente uma entrada no topo, com a
data, a branch e o commit (quando houver). Mudanças só planejadas ficam em
**Planejado** até serem implementadas.

## Planejado

### Notificações

O horário de notificação das regulares já é guardado, mas o envio dos lembretes
ainda não existe.

## 24/11/2026

### Atividades habituais, painel de hábitos e novas janelas

Branch `desenvolvimento`. Regras em
[Tarefas: hábitos](domains/tasks.md#hábitos).

- **Habituais:** as regulares passam a se chamar atividades habituais na lista
  (grupo **Habituais**).
- **Calendário:** só mostra as pontuais; os mini cards das regulares saíram. O
  tooltip do dia cita quantas habituais existem.
- **Desempenho:** novo painel **Hábitos** com consistência dos últimos 28 dias,
  maior sequência atual, dias perfeitos, progresso de hoje, uma linha por hábito
  (grade de 28 dias, sequência, recorde e taxa) e taxa por dia da semana. Os
  indicadores antigos passaram a contar só as pontuais.
- **Calendário no estilo Apple:** cada pontual virou um card no dia: barra
  tingida quando não tem horário; ponto, título e hora quando tem. Até três por
  dia (dois em dias estreitos), com "+N mais" para o resto.
  Cada card mostra o ícone do tipo.
- **Filtro por tipo no calendário:** ao escolher um tipo, o calendário mostra
  todas as atividades dele, habituais inclusive, com os marcadores de ícone de
  antes em vez dos cards.
- **Atrasada ou não feita nas pontuais:** a opção **Se o dia passar sem
  concluir** vale agora também para as pontuais. Sem contar atraso, elas nunca
  ficam atrasadas e viram **Não feita** quando a data passa.
- **Nova janela de atividade:** escolha entre Pontual e Habitual no topo, título
  grande, tipos em chips com ícone, prioridade e frequência em botões
  segmentados, a escolha Atrasada/Não feita em cartões e botões presos ao pé.
- **Janelas de tipo:** prévia ao vivo, cores em círculos com uma personalizada
  e, em Personalizar tipos, os tipos em chips.
- **Por dentro:** novo `model/habits.js`, com testes.

### Horários, atraso e lista do dia — `6c92518`

Branch `desenvolvimento`, publicada na `main` pelo PR #2. Regras em
[Tarefas: horários e atraso](domains/tasks.md#horários-e-atraso).

- **Regulares:** sai o horário de conclusão e entra um horário de notificação
  opcional (`notify_time`). Os horários de conclusão existentes viraram horários de
  notificação.
- **Regulares:** cada uma escolhe, em **Se o dia passar sem concluir**, entre
  **Marcar como atrasada** (padrão) e **Só marcar como não feita**
  (`tracks_overdue`). Nenhuma regular fica atrasada no próprio dia.
- **Não feitas:** ficam fora de Em aberto e das atrasadas e aparecem à parte no
  Desempenho.
- **Pontuais:** o horário de conclusão ficou opcional também no cadastro
  (**Com** ou **Sem** horário).
- **Lista do dia:** regulares e pontuais numa lista só, separadas por subtítulos
  discretos; as pontuais ganharam o mesmo card enxuto das regulares. Nas visões
  de vários dias, os cards mostram a data.
- **Cards:** maiores e mais destacados no computador; ícones maiores nos dois
  tamanhos de tela; sem o texto "Sem horário" quando não há horário.
- **Celular:** a página não rola mais; só a lista rola por dentro. O calendário
  virou uma aba no pé da tela que abre por cima de tudo, inclusive da barra
  lateral, com uma grade mais cheia, um puxador que abre e fecha e animação de subida e descida; e fecha ao escolher um dia ou tocar fora. A
  saudação e a data ficam numa linha com Tipos e Nova tarefa em botões de ícone.
- **Calendário:** os filtros por tipo passaram para o topo, logo abaixo do mês;
  **Todos** ganhou estilo próprio (grade, borda tracejada, preenchido quando
  ativo) e um divisor antes dos tipos.
- **Dia atual:** destaque forte no calendário (contorno, brilho, número em
  círculo; rótulo HOJE no celular). A aba recolhida do celular mostra só o mês e
  a seta.
- **Hoje na plataforma toda:** selo azul **Hoje** na faixa superior, no título
  da lista ("Programação de hoje", ou **Voltar para hoje** em outro dia), nos
  cards de hoje das visões de vários dias e no Desempenho, onde a coluna de hoje
  também fica destacada no gráfico. A data por extenso aparece só uma vez, no
  cabeçalho do calendário, maior, sincronizada com o dia selecionado e com um
  selo (**Hoje**, **Amanhã**, "Em 3 dias"...); a lista diz "Programação de
  hoje/amanhã/ontem/do dia".
- **Calendário do computador:** blocos arredondados separados, com número em
  pílula e contagem de pendentes, na mesma coloração do celular (fundo cheio,
  tom azulado nos dias com tarefas, outros meses transparentes).
- **Tipos no dia:** pontuais em círculos cheios na cor do tipo, com contagem;
  regulares em mini cards leves por tipo, sem título, apagados quando o tipo
  foi concluído no dia.
- **Celular:** a data do dia selecionado fica na faixa superior; a aba do
  calendário mostra só o mês e um botão azul **Ver mês**.
- **Filtro por tipo da lista:** só no celular, em pílula compacta; no
  computador fica só o filtro do calendário.
- **Correção:** o progresso do dia contava também pontuais de outras datas.
- **Banco:** nova migração `202611240001_notify_time.sql`, ainda **não aplicada no
  Supabase**. A função também precisa ser publicada de novo.

### Cards de atividades regulares simplificados

Branch `desenvolvimento`, ainda sem commit.

- Cada regular virou uma linha: checkbox, ícone do tipo, título e, abaixo, a
  programação ("Todo dia" ou os dias) com o horário.
- À direita: combo, a semana em sete pontos e o menu `⋯` com Editar ou mover,
  Remover só deste dia e Excluir repetição e histórico.
- Saíram do card os selos de tipo e prioridade, o rótulo Diária/Periódica, a data
  repetida, a faixa "Seu ritmo" e o botão grande de Editar.
- As atividades pontuais não mudaram.

### Nova tela de entrada — `b299d39`

- Layout em duas colunas: título, prévia ilustrativa da agenda e destaques à
  esquerda; formulário à direita.
- Formulário com abas Entrar/Criar conta, ícones nos campos e botão para mostrar a
  senha.
- Foto vertical de uma mesa de trabalho num painel com corte diagonal; no celular,
  a foto fica no topo.

## 23/11/2026

### Endereços da produção fora do repositório — `cd56bf7`

- O identificador do projeto Supabase, a URL da API e o domínio do frontend foram
  trocados por marcadores (`<project-ref>`, `<URL-do-frontend>`) nos arquivos e em
  todo o histórico do Git.
- [Supabase](supabase.md#valores-reais-do-ambiente) explica onde achar os valores
  reais.

### Nome nextOrganize e revisão da documentação — `8c526b9`, `1abeb25`

- O app passou a se chamar **nextOrganize**, com logo próprio (✓ seguido de ›),
  favicon e uma primeira versão nova da tela de entrada.
- O repositório foi renomeado para `nextOrganize`.
- A documentação foi revisada: nomes da interface, limites, campos e contagem de
  testes corrigidos.
- A arquitetura foi redefinida: Supabase é o ambiente principal; Express + SQLite
  é para desenvolvimento; Express + PostgreSQL (Docker) fica como base de um
  servidor próprio futuro.

### Conexões separadas — `712f97f`

- Os scripts `db:*` passaram a ler `SUPABASE_DATABASE_URL`; o Express só usa
  PostgreSQL com `DATABASE_URL`. Antes, as duas coisas usavam a mesma variável, e
  preencher a conexão para uma migração fazia o `npm run dev` gravar na produção.
- O Express avisa no terminal quando inicia com PostgreSQL fora da produção.

## 18/11/2026

### Origem da Netlify autorizada — `83941e5`

- O frontend publicado na Netlify foi incluído em `ALLOWED_ORIGINS` da API.

### Repetição por dias da semana, edição e ícones — `441604b`

- Repetição em dias selecionados da semana, com duração sem fim, até uma data ou
  por dias/semanas.
- Edição de tarefas (título, tipo, prioridade, data e horário) e de tipos (nome,
  cor e ícone).
- Seletor com 47 ícones para os tipos.
- Calendário com ícones para pontuais e pontos para regulares; tela de Desempenho
  no estilo da agenda.

### Produção no Supabase — `be5ab18`

- Banco PostgreSQL no schema privado `tarefas` e API na Edge Function
  `tarefas-api`, com sessão Bearer, CORS por lista de origens e limite de
  tentativas de login no banco.
- A conta e os tipos existentes foram importados do SQLite.

## 17/11/2026

### Primeira versão — `9226ec4`

- Agenda pessoal com cadastro e login, tarefas com tipo, prioridade, data e
  horário, repetição diária com combo, calendário mensal e tela de Desempenho.
- Backend Express + SQLite e frontend React + Vite, organizados por domínio
  (autenticação, tarefas e tipos).
