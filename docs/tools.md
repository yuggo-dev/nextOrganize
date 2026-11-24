# Ferramentas e tecnologias

## Interface

| Ferramenta | Onde aparece | Responsabilidade |
| --- | --- | --- |
| React 18 | `client/src/` | Componentes, estado da interface, formulários, agenda e desempenho |
| Vite 5 | `client/vite.config.js` | Servidor de desenvolvimento, proxy local `/api` e build em `client/dist` |
| Plugin React do Vite | `client/package.json` | Integração do JSX e do desenvolvimento React com o Vite |
| JavaScript/JSX e CSS | `client/src/` | Código da interface e estilos; não há framework de componentes adicional |
| React Icons 5 | `domains/task-types/icons.jsx` | Ícones SVG selecionáveis para tipos e tarefas, dos conjuntos Font Awesome 6 e Game Icons |
| Fetch API | `client/src/shared/http/client.js` | Chamadas HTTP, JSON, cabeçalhos e tratamento de sessão expirada |
| sessionStorage | Cliente HTTP e API de autenticação | Guardar o token da sessão remota por aba e por endereço de API |

`VITE_API_URL` define o endereço da API durante o build. Sem essa variável, o
cliente usa `/api`. A URL da função pode ser pública; senhas, conexão PostgreSQL e
chaves administrativas nunca devem estar em variáveis `VITE_*`.

## API e persistência

| Ferramenta | Onde aparece | Responsabilidade |
| --- | --- | --- |
| PostgreSQL | Schema `tarefas` | **Banco de produção** no Supabase, com usuários, sessões, tipos, tarefas e ocorrências |
| pg (node-postgres) | `infrastructure/postgres.js` | Pool de conexões, SQL parametrizado e transações assíncronas; usado pela Edge, pelos scripts e pelo modo servidor próprio |
| Node.js | `server/index.js` | Executar o Express, scripts de banco e testes; exige Node 22 ou superior e foi verificado com Node 24 |
| Express 4 | `server/src/app.js` e rotas | **Desenvolvimento local** e base do servidor próprio futuro: HTTP, cookies, sessão, rotas e entrega opcional do build |
| SQLite | `server/tarefas.db` por padrão | **Banco local descartável** para desenvolvimento |
| better-sqlite3 | `infrastructure/database.js` e repositórios locais | Consultas síncronas, transações e atualização do esquema SQLite |
| AsyncLocalStorage | Adaptador PostgreSQL | Reutilizar a mesma conexão nas consultas de uma transação |
| node:crypto | Serviço de autenticação | Salt, scrypt, tokens aleatórios, SHA-256 e comparação de hashes |

Não há Prisma, Sequelize ou outro ORM. Os arquivos `repository.js` selecionam o
repositório PostgreSQL quando o adaptador declara `dialect: 'postgres'`.

## Supabase

| Recurso | Papel neste projeto |
| --- | --- |
| Database | Hospedar PostgreSQL; não publica automaticamente o frontend ou o Express |
| Edge Functions | Executar a API Fetch/Deno preparada em `supabase/functions/tarefas-api/` |
| Deno | Runtime da função; o arquivo de entrada chama `Deno.serve` |
| @noble/hashes | Implementação scrypt em JavaScript na Edge, compatível com as senhas já existentes |
| Session pooler | Conexão configurada para scripts locais e backend persistente |
| Transaction pooler | Conexão prevista para a função, com no máximo uma conexão por worker |
| Supabase CLI | Publicar a função e executar comandos de desenvolvimento do ambiente Supabase |
| Supabase MCP | Ferramenta administrativa usada pelo agente quando disponível na sessão; não é dependência da aplicação |

MCP e CLI não substituem a conexão que a API usa em execução. Configurar um MCP
no Codex também não torna suas ferramentas automaticamente disponíveis em toda
sessão. O estado real precisa ser conferido antes de executar ações remotas.

O projeto não usa Supabase Auth, Storage ou Realtime nesta implementação.
`supabase/config.toml` desabilita a validação de JWT do gateway para esta função
porque ela valida sessões próprias. Login/cadastro são públicos; dados das
contas exigem uma sessão válida verificada pela API.

## Desenvolvimento, testes e distribuição

| Ferramenta | Papel |
| --- | --- |
| npm | Dependências e scripts; raiz, `client` e `server` têm pacotes separados |
| concurrently | Iniciar frontend e API juntos em `npm run dev` |
| node:test e node:assert | Testes de regras, API, autenticação e migração |
| PGlite | PostgreSQL embarcado usado nos testes, sem acessar o projeto real |
| Deno test/check | Compatibilidade da função e das senhas no runtime Deno |
| Docker | Segundo plano: empacota Express e frontend para um servidor próprio futuro; não é usado na produção atual |
| Git e arquivos lock | Versionar código e registrar as versões resolvidas das dependências |

As versões declaradas estão nos três `package.json` e no `deno.json` da função.
Os arquivos lock registram as versões resolvidas. Os testes locais não comprovam
credenciais, TLS, CORS do domínio final ou publicação no Supabase.

## Comandos da raiz

| Comando | Ambiente | Resultado |
| --- | --- | --- |
| `npm run setup` | — | Instala dependências da raiz, servidor e cliente |
| `npm run dev` | Desenvolvimento | Inicia Express (SQLite) e Vite; não acessa o Supabase se `DATABASE_URL` estiver vazia (a `SUPABASE_DATABASE_URL` dos scripts é ignorada) |
| `npm test` | Desenvolvimento | Executa os testes Node do servidor e das regras do frontend |
| `npm run build` | Produção / servidor próprio | Compila somente o frontend |
| `npm run edge:prepare` | Produção | Copia os módulos necessários para o diretório compartilhado da função |
| `npm run db:schema:supabase` | Produção | Aplica as migrações de `supabase/migrations/` no PostgreSQL configurado |
| `npm run dev:remote` | Produção | Inicia só o frontend local contra a API publicada; lê e grava dados reais; exige `client/.env.local` |
| `npm start` | Servidor próprio | Inicia Express; não publica a função |
| `npm run db:migrate:check` | Histórico | Confere o SQLite sem escrever ou conectar à nuvem |
| `npm run db:migrate:supabase` | Histórico | Importa dados locais num PostgreSQL vazio; já usado na produção, não repetir |

Em `client/`, `npm run preview` serve localmente o build já gerado em `client/dist`.

O diretório `supabase/functions/_shared/backend/` é gerado e ignorado pelo Git.
Edite os módulos em `server/src/` e execute `edge:prepare` antes de publicar.

Consulte [Supabase: produção](supabase.md) para os comandos Deno/CLI,
secrets e a configuração da hospedagem estática.
