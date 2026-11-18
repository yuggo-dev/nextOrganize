# Supabase e execução remota

## Uso local com API e banco já publicados

Ambiente verificado em 18/11/2026. O banco foi importado, a função publicada e
`client/.env.local` configurado. Execute:

```sh
npm run dev:remote
```

Abra `http://localhost:5173` e entre com a conta existente. Não é preciso iniciar
Express, refazer a importação ou publicar a função a cada mudança no frontend.
Se Vite já estiver rodando nessa porta, use a instância existente. Mudanças em
regras/API exigem preparar e publicar a função novamente.

A conexão local usa `PG_CA_PATH=supabase/certs/prod-ca-2021.crt`. Esse certificado
público foi obtido da distribuição oficial; a verificação TLS permanece ativa.
O restante deste documento descreve preparação e manutenção. Não repita a
importação no destino preenchido. Veja [estado da integração](migration-status.md).


A API seleciona PostgreSQL quando `DATABASE_URL` está preenchida. Sem essa variável,
continua usando SQLite em desenvolvimento. Em produção, exige PostgreSQL para
não gravar dados em um disco temporário da hospedagem.

## Conexão

Copie `.env.example` para `.env` na raiz. Em **Connect → Session pooler** no painel
do projeto `lykruvajikxyfzcvtzzb`, copie a conexão PostgreSQL para `DATABASE_URL`,
preenchendo a senha codificada para URL. Se necessário, baixe o certificado CA do
projeto e configure `PG_CA_PATH`. A validação TLS permanece habilitada.

A URL `https://...supabase.co` e a chave pública não substituem essa conexão.
O MCP serve à administração do projeto pelo agente; a API em produção usa sua
própria conexão. Nunca coloque `DATABASE_URL` em variáveis `VITE_*` ou no frontend.

Referência: https://supabase.com/docs/guides/database/connecting-to-postgres

## Migrar os dados locais

1. Encerre o servidor para evitar alterações durante a transferência.
2. Faça backup do SQLite, incluindo `-wal` e `-shm` se existirem.
3. Confira a origem e importe:

```sh
npm run db:migrate:check
npm run db:migrate:supabase
```

A conferência lê o SQLite sem modificá-lo nem acessar a nuvem. A importação cria
as tabelas, preserva IDs, hashes de senha, proprietários, tarefas sem proprietário,
tipos e histórico diário, confere contagens e ajusta as sequências. É uma única
transação: falhas desfazem a importação. Destinos já preenchidos são recusados.
Sessões não são copiadas; será necessário novo login.

Para um banco novo **sem importar SQLite**, use somente:

```sh
npm run db:schema:supabase
```

Esse comando pode ser repetido e não sobrescreve dados. O servidor não cria as
tabelas PostgreSQL automaticamente: prepare o banco antes de iniciá-lo.

As tabelas ficam no schema privado `tarefas`, com RLS habilitada e sem políticas
para acesso pelo navegador. Não exponha esse schema na Data API. A conexão do
backend precisa dos privilégios de proprietário das tabelas (ou equivalentes).
As contas continuam na autenticação da aplicação; não são usuários Supabase Auth.

## Iniciar e validar

```sh
npm run build
npm start
```

Com `DATABASE_URL`, o servidor testa o acesso ao schema e falha se não conseguir
conectar. Não retorna silenciosamente ao SQLite. Valide login, tarefas, tipos e
recorrências antes de liberar novas escritas. O SQLite original é preservado.
Depois de novas escritas no PostgreSQL, voltar ao SQLite exige reconciliar dados.

## API no Supabase e frontend separado (arquitetura escolhida)

A API pode ser hospedada em Edge Functions. O código em
`supabase/functions/tarefas-api` reutiliza as regras e repositórios da aplicação,
com um adaptador HTTP Fetch para o runtime Deno. O Express continua disponível
para desenvolvimento local e hospedagem alternativa via Docker.

Prepare a função sempre depois de alterar as regras/repositórios:

```sh
npm run edge:prepare
```

Configure no painel **Edge Functions → Secrets**:

| Secret | Valor |
| --- | --- |
| `TAREFAS_DATABASE_URL` | Conexão PostgreSQL do **Transaction pooler**, porta 6543, com senha codificada |
| `ALLOWED_ORIGINS` | Origem exata do frontend, por exemplo `https://agenda.example.com`; várias separadas por vírgula, sem barra final |
| `TAREFAS_DATABASE_CA` | Opcional: conteúdo PEM da CA do banco, caso exigido pelo certificado |

Não envie os secrets para o repositório. Os comandos locais de migração continuam
usando `DATABASE_URL` com Session pooler; a função usa seu próprio secret.
As consultas não usam prepared statements nomeados e cada worker abre no máximo
uma conexão com o pooler.

Com Supabase CLI autenticada, publique:

```sh
npx --yes supabase functions deploy tarefas-api --remote=lykruvajikxyfzcvtzzb --use-api
```

A função estará disponível em:

```text
https://lykruvajikxyfzcvtzzb.supabase.co/functions/v1/tarefas-api
```

O gateway JWT está desabilitado **somente nessa função**, pois as contas existentes
usam sessões próprias, não JWTs do Supabase Auth. Login/cadastro são públicos;
tarefas/tipos exigem um Bearer aleatório válido, com hash e expiração no banco.
CORS permite somente as origens configuradas. A limitação de tentativas de login
por e-mail é persistida no PostgreSQL e compartilhada entre workers.

A derivação scrypt na Edge usa JavaScript, com parâmetros compatíveis com os
hashes existentes, sem depender de threads nativas do Node. A sessão remota fica
em `sessionStorage` no frontend e é revogada no logout. Fechar a aba encerra a
persistência local dessa sessão. Isso evita depender de cookies de terceiros.

Na hospedagem estática do frontend, configure **antes do build**:

```env
VITE_API_URL=https://lykruvajikxyfzcvtzzb.supabase.co/functions/v1/tarefas-api
```

Use `client` como diretório do projeto, comando `npm ci && npm run build` e
publique `dist`. Para desenvolvimento remoto, crie `client/.env.local` com essa
variável e inclua `http://localhost:5173` em `ALLOWED_ORIGINS`. Para usar Express
local, deixe `VITE_API_URL` vazia e execute `npm run dev` na raiz.

Confira login e tarefas pelo frontend publicado, e o endpoint `/healthz` da
função. Esse endpoint verifica o processo, não a conexão do banco. Rede, TLS,
secrets e deployment precisam ser conferidos no projeto real: testes locais não
publicam a função nem transferem dados automaticamente.

Referências oficiais:
- https://supabase.com/docs/guides/functions/connect-to-postgres
- https://supabase.com/docs/guides/functions/cors
- https://supabase.com/docs/guides/functions/auth

## Alternativa: Express em container

O Dockerfile serve frontend/API no mesmo domínio. Exige `DATABASE_URL`, HTTPS e
`NODE_ENV=production`. Escuta em `0.0.0.0`, usa `PORT` (padrão 3001) e encerra
conexões ao receber SIGTERM. Se houver proxy, configure `TRUST_PROXY_HOPS` com o
número exato de proxies confiáveis. Não habilite confiança irrestrita em cabeçalhos.

## Verificação

```sh
npm test
npm run build
```

A suíte inclui PostgreSQL embarcado (PGlite) e SQLite, com testes de contas,
isolamento, duplicidade, rollback, exclusão em cascata e histórico diário. Ela
não substitui a validação de rede, TLS e credenciais no projeto real do Supabase.
