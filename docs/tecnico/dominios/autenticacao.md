# Domínio de autenticação

Arquivos, sessão e API das contas. O que a pessoa vê (cadastro, limites e
saída) está em [Visão geral: conta e acesso](../../funcional/visao-geral.md#conta-e-acesso).

## Frontend

| Camada | Arquivo | Papel |
| --- | --- | --- |
| Apresentação | `client/src/domains/auth/AuthPage.jsx` | Alternar cadastro e login, consultar sessão e apresentar o painel autenticado |
| Integração | `client/src/domains/auth/api.js` | Cadastro, login, sessão atual e saída; guarda o token recebido |

O cadastro usa nome de até 100 caracteres, e-mail de até 254 caracteres e senha de 8 a 128 caracteres e inicia a sessão automaticamente. Ao sair ou receber uma resposta de sessão expirada nas operações autenticadas, o painel é desmontado e o formulário de entrada volta a ser exibido.

## Backend

| Camada | Arquivo | Uso | Papel |
| --- | --- | --- | --- |
| Transporte Edge | `server/src/edge/handler.js` | Produção | Bearer, limite de tentativas persistido e rotas |
| Aplicação | `server/src/domains/auth/service.js` | Ambos | Validação, scrypt, comparação de senha e geração de token |
| Persistência | `server/src/domains/auth/repository.js` | Ambos | Usuários, sessões e criação transacional da conta com tipos iniciais |
| Transporte Express | `server/src/domains/auth/routes.js` | Local | Cookie, middleware de sessão, limite de tentativas em memória e rotas |

O e-mail é normalizado em minúsculas. A senha recebe salt individual e hash scrypt. A sessão dura sete dias e somente o hash do token é armazenado no banco. As contas são próprias da aplicação; não são usuários do Supabase Auth.

## Contrato HTTP

As rotas são relativas à base da API: `https://<project-ref>.supabase.co/functions/v1/tarefas-api` na produção e `/api` no Express local.

| Método | Rota | Corpo | Sucesso |
| --- | --- | --- | --- |
| `POST` | `/auth/register` | `name`, `email`, `password` | `201` com `user` e a sessão |
| `POST` | `/auth/login` | `email`, `password` | `200` com `user` e a sessão |
| `GET` | `/auth/me` | — | `200` com `user` ou `null` |
| `POST` | `/auth/logout` | — | `204` e revogação da sessão |

As respostas de usuário contêm `id`, `name` e `email`. Dados inválidos retornam `400`, credenciais incorretas retornam `401`, e-mail repetido retorna `409` e excesso de tentativas retorna `429`.

## Sessão em produção (Edge Function)

Cadastro e login retornam `{ user, token }`, sem cookie. O frontend guarda o token
em `sessionStorage` e o envia em `Authorization: Bearer ...`. A saída revoga a
sessão; fechar a aba remove sua persistência local.

O limite é de 30 tentativas por e-mail em 15 minutos, persistido no PostgreSQL
(`auth_attempts`) e compartilhado entre workers. A derivação usa `@noble/hashes`
no Deno, com parâmetros compatíveis com o scrypt do Node.

## Sessão no Express (desenvolvimento e servidor próprio)

Cadastro e login retornam `{ user }` e definem o cookie `session`, HttpOnly e
SameSite=Lax. Com `NODE_ENV=production`, o cookie exige HTTPS. O limite é de 30
tentativas por IP em 15 minutos, em memória do processo.

Veja [arquitetura](../arquitetura.md) para as fronteiras de autorização e
[Supabase](../supabase.md) para CORS, secrets e configuração do gateway.
