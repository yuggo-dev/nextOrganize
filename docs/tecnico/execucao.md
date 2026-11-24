# Executar, configurar e verificar

Como instalar, rodar e testar o projeto, as variáveis de ambiente, a estrutura
de pastas e onde ficam os dados.

## Papéis de cada parte

| Parte | Papel | Quando usar |
| --- | --- | --- |
| **Supabase** (Edge Function `tarefas-api` + PostgreSQL) | **Principal**: é a API e o banco de produção | Uso real da aplicação, pelo frontend publicado |
| **Express + SQLite** | **Desenvolvimento local** | Programar e testar sem tocar nos dados de produção |
| **Express + PostgreSQL** (Docker) | **Segundo plano**: base para um eventual servidor próprio no futuro | Não está em uso; mantido funcional pelos mesmos serviços e testes |

As regras de negócio (validação, autorização, recorrência) ficam em `server/src/` e são as mesmas nos três casos: a Edge Function usa uma cópia desses módulos. O que muda é só o transporte HTTP (Edge ou Express) e o banco (PostgreSQL ou SQLite). Detalhes em [Arquitetura](arquitetura.md).

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

Usa a API publicada no Supabase, definida em `client/.env.local`. Serve para conferir a interface com os dados reais, mas **todas as alterações feitas valem na produção**. Mudanças no backend só aparecem aqui depois de publicar a função; veja [Supabase](supabase.md).

### Servidor próprio (segundo plano)

```sh
npm run build
npm start
```

O Express serve o build e a API em `http://localhost:3001`. Com `DATABASE_URL` preenchida, usa PostgreSQL; com `NODE_ENV=production`, exige PostgreSQL. Esse modo, junto com o `Dockerfile`, existe como base para uma hospedagem própria futura e não está em uso hoje.

## Configuração e API

A configuração da produção (secrets da Edge Function e `VITE_API_URL` do frontend publicado) está em [Supabase: produção](supabase.md). As variáveis abaixo são do backend Node (Express e scripts), usado no desenvolvimento e no modo servidor próprio. Qual conexão cada ambiente usa está em [Conexões por ambiente](arquitetura.md#conexões-por-ambiente).

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

`npm test` executa todos os arquivos `server/*.test.js` e `client/src/domains/tasks/model/*.test.js`. Para rodar um arquivo isolado, use `node --test <arquivo>`. Os testes Deno da função estão descritos em [Supabase: produção](supabase.md).

## Persistência e backup

**Produção.** Os dados reais ficam no PostgreSQL do Supabase, no schema `tarefas`. O schema é mantido pelos arquivos de `supabase/migrations/` e pelo comando `npm run db:schema:supabase`. O backup segue os recursos do próprio Supabase (backups do projeto ou `pg_dump` pela conexão Session pooler). Veja [Supabase: produção](supabase.md).

**Desenvolvimento local.** O SQLite em `server/tarefas.db` (ou o caminho de `DB_PATH`) é um banco descartável de testes. O Express cria e atualiza as tabelas ao iniciar, inclusive convertendo categorias antigas em tipos e preservando tarefas antigas sem proprietário. Não há sincronização com o Supabase: dados criados aqui não vão para a produção, e vice-versa. Para começar do zero, apague o arquivo com o servidor parado. Para guardar uma cópia, encerre o servidor e copie o arquivo junto com os `-wal` e `-shm`, se existirem.

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
│   ├── components/             # Janela modal, logo (Logo.jsx) e selo Hoje (TodayChip.jsx)
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
├── historico.md                # Mudanças por data e próximas mudanças planejadas
├── funcional/                  # O que o app faz, tela por tela, para quem usa
└── tecnico/                    # Execução, arquitetura, Supabase, ferramentas e domínios
```
