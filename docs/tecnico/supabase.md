# Supabase: produção e manutenção

O Supabase é o ambiente **principal** da aplicação: a API roda na Edge Function
`tarefas-api` e os dados ficam no PostgreSQL do projeto `<project-ref>`.
O frontend é publicado separadamente, em `<URL-do-frontend>`.
Express e SQLite servem ao desenvolvimento local; veja os papéis de cada ambiente
em [Arquitetura](arquitetura.md#papel-de-cada-ambiente).

## Valores reais do ambiente

A documentação não registra endereços nem identificadores da produção. Onde
aparecerem, substitua os marcadores pelos valores reais:

| Marcador | O que é | Onde encontrar |
| --- | --- | --- |
| `<project-ref>` | Identificador do projeto Supabase | Painel do Supabase → **Project Settings → General** (é também o subdomínio de `*.supabase.co`) |
| `<URL-do-frontend>` | Endereço do frontend publicado | Painel da Netlify → **Domain management** |

A URL da API fica em `https://<project-ref>.supabase.co/functions/v1/tarefas-api`.
Guarde os valores só em arquivos locais ignorados pelo Git (`.env`,
`client/.env.local`) e nas variáveis da Netlify e do Supabase. Não volte a
escrevê-los em arquivos versionados.

Esses valores não são credenciais: a URL da API vai embutida no JavaScript do
frontend publicado e qualquer visitante pode vê-la. Tirá-los do repositório evita
expor a infraestrutura a quem lê o código, mas a proteção real continua sendo a
sessão, o CORS e o schema privado.

## Publicar uma mudança

Faça a publicação a partir da `main`, com as alterações aprovadas já commitadas
(veja [Branches](branches.md)).

1. **Schema**, se a mudança incluir um novo arquivo em `supabase/migrations/`:

   ```sh
   npm run db:schema:supabase
   ```

   Aplica todos os arquivos de `supabase/migrations/` em ordem, numa transação.
   Pode ser repetido e não sobrescreve dados. Exige `SUPABASE_DATABASE_URL` no `.env`
   (veja [Conexão para scripts](#conexão-para-scripts)).

2. **Função**, sempre que `server/src/` mudar:

   ```sh
   npm run edge:prepare
   npx --yes supabase functions deploy tarefas-api --remote=<project-ref> --use-api
   ```

   `edge:prepare` copia os módulos de `server/src/` para
   `supabase/functions/_shared/backend/`, diretório gerado e ignorado pelo Git.
   O deploy exige a Supabase CLI autenticada.

3. **Frontend**: a hospedagem estática gera o build a partir de `client`, com
   comando `npm ci && npm run build`, publicando `dist`. Configure **antes do build**:

   ```env
   VITE_API_URL=https://<project-ref>.supabase.co/functions/v1/tarefas-api
   ```

4. **Conferência**: entre pelo frontend publicado, confira tarefas e tipos e chame
   `/healthz` da função. Esse endpoint verifica o processo, não a conexão com o banco.

Se a mudança envolver schema e código, aplique a migração antes de publicar a
função, para que a nova versão não procure colunas que ainda não existem.

## Secrets da função

Configure no painel **Edge Functions → Secrets**:

| Secret | Valor |
| --- | --- |
| `TAREFAS_DATABASE_URL` | Conexão PostgreSQL do **Transaction pooler**, porta 6543, com senha codificada |
| `ALLOWED_ORIGINS` | `<URL-do-frontend>,http://localhost:5173,http://127.0.0.1:5173`; origens exatas separadas por vírgula, sem barra final |
| `TAREFAS_DATABASE_CA` | Opcional: conteúdo PEM da CA do banco, caso exigido pelo certificado |

Não envie os secrets para o repositório. As consultas não usam prepared statements
nomeados e cada worker abre no máximo uma conexão com o pooler. Novos domínios do
frontend exigem inclusão explícita em `ALLOWED_ORIGINS`.

## Segurança da função

O gateway JWT está desabilitado **somente nessa função** (`supabase/config.toml`),
pois as contas usam sessões próprias, não JWTs do Supabase Auth. Login e cadastro
são públicos; tarefas e tipos exigem um Bearer aleatório válido, com hash e
expiração no banco. CORS permite somente as origens configuradas. A limitação de
tentativas de login por e-mail é persistida no PostgreSQL e compartilhada entre
workers.

A derivação scrypt na Edge usa JavaScript (`@noble/hashes`), com parâmetros
compatíveis com os hashes existentes, sem depender de threads nativas do Node.
A sessão fica em `sessionStorage` no frontend e é revogada no logout. Fechar a aba
encerra a persistência local dessa sessão, sem depender de cookies de terceiros.

As tabelas ficam no schema privado `tarefas`, com RLS habilitada e sem políticas
para acesso pelo navegador. Não exponha esse schema na Data API. A conexão do
backend precisa dos privilégios de proprietário das tabelas (ou equivalentes).

Referências oficiais:
- https://supabase.com/docs/guides/functions/connect-to-postgres
- https://supabase.com/docs/guides/functions/cors
- https://supabase.com/docs/guides/functions/auth

## Conexão para scripts

Os scripts `db:*` se conectam diretamente ao PostgreSQL. Copie `.env.example` para
`.env` na raiz. Em **Connect → Session pooler** no painel do projeto, copie a
conexão para `SUPABASE_DATABASE_URL`, preenchendo a senha codificada para URL.
Mantenha `PG_CA_PATH=supabase/certs/prod-ca-2021.crt`, a CA pública oficial do
Supabase; a validação TLS permanece ativa.

O Express ignora `SUPABASE_DATABASE_URL`, então ela pode ficar preenchida sem que
`npm run dev` deixe de usar o SQLite. Os scripts, por sua vez, não leem
`DATABASE_URL`: se só ela estiver definida (formato antigo do `.env`), eles param
e pedem para renomeá-la.

A URL `https://...supabase.co` e a chave pública não substituem essa conexão.
Nunca coloque conexões PostgreSQL em variáveis `VITE_*` ou no frontend. O MCP serve à
administração do projeto pelo agente; a API usa sua própria conexão.

Referência: https://supabase.com/docs/guides/database/connecting-to-postgres

## Frontend local contra a produção

```sh
npm run dev:remote
```

Crie `client/.env.local` a partir de `client/.env.example` (arquivo local,
ignorado pelo Git) e abra `http://localhost:5173`. A interface local passa a usar a
API publicada: **as alterações valem nos dados reais**. Mudanças em `server/src/`
só aparecem depois de publicar a função. Para desenvolver sem tocar na produção,
use `npm run dev`, com Express e SQLite.

## Backup

Os dados reais ficam no Supabase. Use os backups do projeto no painel ou
`pg_dump` pela conexão Session pooler, restrito ao schema `tarefas`. O SQLite
local não contém dados de produção.

## Histórico: importação inicial do SQLite

A conta e os tipos existentes foram importados do SQLite para o PostgreSQL em
18/11/2026 (veja [estado da integração](estado-supabase.md)). **Não repita a
importação**: o script recusa destinos já preenchidos. Os comandos ficam
registrados para um banco novo:

```sh
npm run db:migrate:check
npm run db:migrate:supabase
```

A conferência lê o SQLite sem modificá-lo nem acessar a nuvem. A importação cria
as tabelas, preserva IDs, hashes de senha, proprietários, tarefas sem proprietário,
tipos e histórico, confere contagens e ajusta as sequências, numa única transação.
Sessões não são copiadas.

## Segundo plano: servidor próprio com Express

O Express com PostgreSQL é mantido como base para uma hospedagem própria futura e
não está em uso. O `Dockerfile` gera o build do frontend e serve frontend e API no
mesmo domínio:

```sh
npm run build
npm start
```

Com `DATABASE_URL`, o servidor testa o acesso ao schema e falha se não conseguir
conectar, sem voltar silenciosamente ao SQLite. Com `NODE_ENV=production`, exige
`DATABASE_URL` e HTTPS (cookie `Secure`). O servidor não cria as tabelas
PostgreSQL: aplique o schema antes. Escuta em `0.0.0.0`, usa `PORT` (padrão 3001)
e encerra conexões ao receber SIGTERM. Atrás de proxy, configure
`TRUST_PROXY_HOPS` com o número exato de proxies confiáveis; não habilite
confiança irrestrita em cabeçalhos. A imagem Docker ainda não foi compilada e
validada.

Para adotar esse modo no futuro, ele poderia usar o mesmo PostgreSQL do Supabase
ou outro banco com o schema de `supabase/migrations/`. A sessão passaria a ser
por cookie no mesmo domínio, sem `VITE_API_URL`.

## Verificação

```sh
npm test
npm run build
```

A suíte inclui PostgreSQL embarcado (PGlite) e SQLite, com testes de contas,
isolamento, duplicidade, rollback, exclusão em cascata e histórico diário. Ela
não substitui a validação de rede, TLS e credenciais no projeto real do Supabase.

A função tem testes próprios no runtime Deno (`password.test.ts`), que importam a
cópia gerada em `_shared/backend/`. Com Deno instalado, prepare a cópia e execute
a partir da pasta da função, para que o `deno.json` dela seja usado:

```sh
npm run edge:prepare
cd supabase/functions/tarefas-api
deno check index.ts
deno test
```
