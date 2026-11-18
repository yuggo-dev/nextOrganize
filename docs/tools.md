# Ferramentas e tecnologias

## Interface

| Ferramenta | Onde aparece | Responsabilidade |
| --- | --- | --- |
| React 18 | `client/src/` | Componentes, estado da interface, formulários, agenda e desempenho |
| Vite 5 | `client/vite.config.js` | Servidor de desenvolvimento, proxy local `/api` e build em `client/dist` |
| Plugin React do Vite | `client/package.json` | Integração do JSX e do desenvolvimento React com o Vite |
| JavaScript/JSX e CSS | `client/src/` | Código da interface e estilos; não há framework de componentes adicional |
| Fetch API | `client/src/shared/http/client.js` | Chamadas HTTP, JSON, cabeçalhos e tratamento de sessão expirada |
| sessionStorage | Cliente HTTP e API de autenticação | Guardar o token da sessão remota por aba e por endereço de API |

`VITE_API_URL` define o endereço da API durante o build. Sem essa variável, o
cliente usa `/api`. A URL da função pode ser pública; senhas, conexão PostgreSQL e
chaves administrativas nunca devem estar em variáveis `VITE_*`.

## API e persistência

| Ferramenta | Onde aparece | Responsabilidade |
| --- | --- | --- |
| Node.js | `server/index.js` | Executar a API Express, scripts de migração e testes; o projeto usa recursos do Node 24 |
| Express 4 | `server/src/app.js` e rotas | HTTP local, cookies, sessão, rotas e entrega opcional do build |
| SQLite | `server/tarefas.db` por padrão | Banco local em arquivo |
| better-sqlite3 | `infrastructure/database.js` e repositórios locais | Consultas síncronas, transações e atualização do esquema SQLite |
| PostgreSQL | Schema `tarefas` | Banco remoto com usuários, sessões, tipos, tarefas e ocorrências |
| pg (node-postgres) | `infrastructure/postgres.js` | Pool de conexões, SQL parametrizado e transações assíncronas |
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
| Docker | Alternativa para distribuir Express e frontend juntos; não é necessário para hospedar a API em Edge Functions |
| Git e arquivos lock | Versionar código e registrar as versões resolvidas das dependências |

As versões declaradas estão nos três `package.json` e no `deno.json` da função.
Os arquivos lock registram as versões resolvidas. Os testes locais não comprovam
credenciais, TLS, CORS do domínio final ou publicação no Supabase.

## Comandos da raiz

| Comando | Resultado |
| --- | --- |
| `npm run setup` | Instala dependências da raiz, servidor e cliente |
| `npm run dev:remote` | Inicia somente o frontend local para usar a API publicada; exige `client/.env.local` |
| `npm run dev` | Inicia Express e Vite em desenvolvimento |
| `npm run build` | Compila somente o frontend |
| `npm start` | Inicia Express; não publica a função |
| `npm test` | Executa os testes Node do servidor e das regras do frontend |
| `npm run db:migrate:check` | Confere o SQLite sem escrever ou conectar à nuvem |
| `npm run db:migrate:supabase` | Importa dados locais no PostgreSQL configurado; escreve na nuvem |
| `npm run db:schema:supabase` | Aplica a estrutura PostgreSQL sem importar dados locais |
| `npm run edge:prepare` | Copia os módulos necessários para o diretório compartilhado da função |

O diretório `supabase/functions/_shared/backend/` é gerado e ignorado pelo Git.
Edite os módulos em `server/src/` e execute `edge:prepare` antes de publicar.

Consulte [Supabase e execução remota](supabase.md) para os comandos Deno/CLI,
secrets e a configuração da hospedagem estática.
