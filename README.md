# nextOrganize

<img src="client/public/favicon.svg" alt="" width="56" height="56">

Agenda pessoal com contas individuais, calendário mensal e tarefas organizadas por data, horário e tipo. A interface é React e Vite.

## Papéis de cada parte

| Parte | Papel | Quando usar |
| --- | --- | --- |
| **Supabase** (Edge Function `tarefas-api` + PostgreSQL) | **Principal**: é a API e o banco de produção | Uso real da aplicação, pelo frontend publicado |
| **Express + SQLite** | **Desenvolvimento local** | Programar e testar sem tocar nos dados de produção |
| **Express + PostgreSQL** (Docker) | **Segundo plano**: base para um eventual servidor próprio no futuro | Não está em uso; mantido funcional pelos mesmos serviços e testes |

As regras de negócio (validação, autorização, recorrência) ficam em `server/src/` e são as mesmas nos três casos: a Edge Function usa uma cópia desses módulos. O que muda é só o transporte HTTP (Edge ou Express) e o banco (PostgreSQL ou SQLite). Detalhes em [Arquitetura](docs/architecture.md).

## Funcionalidades

- Cadastro, login e saída, com tarefas e tipos próprios para cada conta.
- Resumo de tarefas para hoje, nos próximos sete dias e em aberto.
- Calendário com marcações coloridas e listagem das tarefas do dia selecionado, inicialmente o dia atual.
- Cadastro por janela aberta no botão **Nova tarefa**, com título, tipo, prioridade, data e horário de conclusão.
- Tipos personalizados com nome, cor e ícone, criados em **Tipos → Novo tipo** ou durante o cadastro de uma tarefa e editáveis em **Tipos → Personalizar tipos**.
- Edição de tarefas (título, tipo, prioridade, data e horário) pelo botão de lápis do card.
- Tarefas de hoje priorizadas na ordenação e atrasadas com selo **Atrasada**, borda tracejada e contagem no atalho **Em aberto**.
- Conclusão, reabertura, exclusão, filtro por tipo e opção de ocultar concluídas.
- Tarefas diárias ou em dias da semana selecionados, com duração por dias/semanas ou data final, conclusão independente por ocorrência e combo de ocorrências cumpridas.
- Lista com rolagem interna, mantendo o calendário e os controles visíveis. Em telas estreitas, o calendário aparece acima da lista.
- Seção retrátil **Atividades regulares** (diárias e semanais), com contagem de concluídas no cabeçalho, e seção **Atividades pontuais**.
- Interface com navegação lateral, tema escuro inicial em tons azul-acinzentados e opção de alternar para o tema claro.
- Busca por título ou tipo de atividade, aplicada à lista e às marcações do calendário.
- Navegação entre **Início**, com a agenda, e **Desempenho**, com taxa de conclusão, pendências e gráficos por tipo, prioridade e data de prazo.

## Instalação e execução

É necessário ter Node.js 22 ou superior e npm. O projeto foi verificado com Node.js 24, versão usada também no `Dockerfile`.

Na pasta raiz, instale as dependências:

```sh
npm run setup
```

### Desenvolvimento local (padrão)

```sh
npm run dev
```

Abra `http://localhost:5173`. Sobe o Vite e a API Express em `http://localhost:3001`, com banco SQLite em `server/tarefas.db`. O Vite encaminha `/api` para essa porta. É o modo recomendado para programar e testar, sem tocar na produção, desde que `VITE_API_URL` esteja vazia (sem `client/.env.local`, ou com a variável comentada).

A conexão dos scripts `db:*` com o Supabase fica em `SUPABASE_DATABASE_URL`, que o Express ignora; por isso, preenchê-la não muda o banco do `npm run dev`. O Express só usa PostgreSQL quando `DATABASE_URL` está definida (modo servidor próprio) e, fora de `NODE_ENV=production`, avisa isso no terminal ao iniciar.

### Frontend local contra a produção

```sh
npm run dev:remote
```

Usa a API publicada no Supabase, definida em `client/.env.local`. Serve para conferir a interface com os dados reais, mas **todas as alterações feitas valem na produção**. Mudanças no backend só aparecem aqui depois de publicar a função; veja [Supabase](docs/supabase.md).

### Servidor próprio (segundo plano)

```sh
npm run build
npm start
```

O Express serve o build e a API em `http://localhost:3001`. Com `DATABASE_URL` preenchida, usa PostgreSQL; com `NODE_ENV=production`, exige PostgreSQL. Esse modo, junto com o `Dockerfile`, existe como base para uma hospedagem própria futura e não está em uso hoje.

## Como usar

1. Crie sua conta com nome (até 100 caracteres), e-mail e senha de 8 a 128 caracteres ou entre com uma conta existente.
2. Clique em **Nova tarefa** e informe título, tipo, prioridade, data e horário.
3. Use **Tipos → Novo tipo** para criar categorias como Trabalho, Físico e Alimentação com suas próprias cores e ícones.
4. Selecione um dia no calendário para consultar suas tarefas. Os atalhos **Hoje**, **7 dias** e **Em aberto** da barra da agenda abrem as respectivas listas.
5. Use a caixa de seleção para concluir ou reabrir uma tarefa. Pendências que passaram do prazo recebem o selo **Atrasada** e são contadas em **Em aberto**.
6. Role a lista ao lado do calendário para acessar as demais tarefas. Clique em **Atividades regulares** para recolher ou expandir as repetições.

Para criar uma tarefa periódica, selecione **Repetição → Todos os dias** ou **Dias da semana** na janela de cadastro. Informe a data inicial, o horário e, se desejar, uma duração ou data final. O card mostra **Diária** ou **Periódica** e o combo atual quando houver ocorrências consecutivas concluídas. No menu `⋯`, é possível usar **Remover só deste dia** ou **Excluir repetição e histórico**.

## Guia técnico

Comece pelo [índice da documentação](docs/README.md). Consulte também:

- [Branches: produção e desenvolvimento](docs/branches.md)
- [Ferramentas e comandos](docs/tools.md)
- [Arquitetura: Supabase principal e backend local](docs/architecture.md)
- [Estado da integração com Supabase](docs/migration-status.md)
- [Supabase: produção, publicação e manutenção](docs/supabase.md)

## Documentação por domínios e camadas

| Documento | Frontend | Backend |
| --- | --- | --- |
| [Arquitetura](docs/architecture.md) | Composição, apresentação, hooks, regras e HTTP | Inicialização, transporte, serviços, repositórios e infraestrutura |
| [Autenticação](docs/domains/auth.md) | Login, cadastro e sessão | Credenciais, sessões, cookies e rotas |
| [Tarefas e agenda](docs/domains/tasks.md) | Resumo, calendário, janela de cadastro e lista | Validação, isolamento, data, horário e persistência |
| [Tipos de tarefa](docs/domains/task-types.md) | Formulário de nome, cor e ícone; personalização | Tipos por conta, validação e migração de categorias |

Cada documento de domínio descreve as camadas do frontend, as camadas do backend e o contrato da API.

## Estrutura

```text
client/src/
├── App.jsx                     # Composição da aplicação
├── main.jsx                    # Inicialização do React
├── domains/
│   ├── auth/                   # Apresentação e API de autenticação
│   ├── tasks/                  # Painel, componentes, hooks, regras e API
│   └── task-types/             # Formulário, personalização, ícones e API
├── shared/
│   ├── components/             # Janela modal e logo (Logo.jsx)
│   └── http/                   # Cliente HTTP compartilhado
└── styles.css
server/
├── index.js                    # Inicialização do servidor
├── src/
│   ├── app.js                  # Composição do Express
│   ├── edge/handler.js         # Transporte Fetch da Edge Function
│   ├── domains/
│   │   ├── auth/               # Rotas, serviço e repositório
│   │   ├── tasks/              # Rotas, serviços SQLite/PostgreSQL, validação e repositório
│   │   └── task-types/         # Rotas, serviço e repositório
│   ├── infrastructure/         # SQLite, PostgreSQL e repositórios SQL remotos
│   └── shared/                 # Autorização e tratamento de erros HTTP
├── scripts/                    # Schema, importação para Supabase e preparação da Edge
└── *.test.js                   # Testes Node (SQLite, PGlite, API e migração)
supabase/
├── config.toml                 # Configuração da função
├── functions/tarefas-api/      # Entrada Deno da Edge Function e teste de senha
├── migrations/                 # SQL do schema PostgreSQL, aplicado em ordem
└── certs/                      # CA pública do Supabase
docs/
├── README.md                   # Índice da documentação
├── architecture.md, tools.md, branches.md, supabase.md, migration-status.md
└── domains/                    # Documentação de cada domínio
```

## Configuração e API

A configuração da produção (secrets da Edge Function e `VITE_API_URL` do frontend publicado) está em [Supabase: produção](docs/supabase.md). As variáveis abaixo são do backend Node (Express e scripts), usado no desenvolvimento e no modo servidor próprio. Qual conexão cada ambiente usa está em [Conexões por ambiente](docs/architecture.md#conexões-por-ambiente).

| Variável | Padrão | Finalidade |
| --- | --- | --- |
| `PORT` | `3001` | Porta do Express |
| `SUPABASE_DATABASE_URL` | Vazia | Conexão Session pooler da produção, usada **só** pelos scripts `db:*`; o Express a ignora |
| `DATABASE_URL` | Vazia | Modo servidor próprio: faz o Express usar PostgreSQL em vez do SQLite. Deixe vazia no desenvolvimento |
| `PG_CA_PATH` | Vazia (`.env.example` sugere `supabase/certs/prod-ca-2021.crt`) | Certificado CA para validar TLS, nos scripts e no servidor próprio |
| `TRUST_PROXY_HOPS` | Vazia | Número de proxies confiáveis na hospedagem |
| `DB_PATH` | `server/tarefas.db` | Arquivo SQLite |
| `NODE_ENV` | Ambiente do processo | Com `production`, o cookie de sessão exige HTTPS |

Exemplo no PowerShell, a partir da raiz.

```powershell
$env:PORT = "3001"
$env:DB_PATH = ".\server\tarefas.db"
npm start
```

As variáveis são lidas do ambiente e do `.env` na raiz, sem sobrescrever variáveis já definidas. Se alterar a porta da API durante o desenvolvimento, ajuste o proxy em `client/vite.config.js`.

As rotas são as mesmas nos dois transportes, mudando só a base: `https://<project-ref>.supabase.co/functions/v1/tarefas-api` na produção e `/api` no Express. Os corpos são JSON com `Content-Type: application/json`, e requisições de escrita exigem `X-Requested-With: tarefas`. Tarefas e tipos exigem a sessão obtida no cadastro ou login: token Bearer na Edge, cookie no Express. Os contratos completos estão nos documentos de cada domínio.

## Verificação

```sh
npm test
npm run build
```

`npm test` executa todos os arquivos `server/*.test.js` e `client/src/domains/tasks/model/*.test.js`. Para rodar um arquivo isolado, use `node --test <arquivo>`. Os testes Deno da função estão descritos em [Supabase: produção](docs/supabase.md).

## Persistência e backup

**Produção.** Os dados reais ficam no PostgreSQL do Supabase, no schema `tarefas`. O schema é mantido pelos arquivos de `supabase/migrations/` e pelo comando `npm run db:schema:supabase`. O backup segue os recursos do próprio Supabase (backups do projeto ou `pg_dump` pela conexão Session pooler). Veja [Supabase: produção](docs/supabase.md).

**Desenvolvimento local.** O SQLite em `server/tarefas.db` (ou o caminho de `DB_PATH`) é um banco descartável de testes. O Express cria e atualiza as tabelas ao iniciar, inclusive convertendo categorias antigas em tipos e preservando tarefas antigas sem proprietário. Não há sincronização com o Supabase: dados criados aqui não vão para a produção, e vice-versa. Para começar do zero, apague o arquivo com o servidor parado. Para guardar uma cópia, encerre o servidor e copie o arquivo junto com os `-wal` e `-shm`, se existirem.
