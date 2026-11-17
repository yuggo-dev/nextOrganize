# Domínio de autenticação

## Frontend

| Camada | Arquivo | Papel |
| --- | --- | --- |
| Apresentação | `client/src/domains/auth/AuthPage.jsx` | Alternar cadastro e login, consultar sessão e apresentar o painel autenticado |
| Integração | `client/src/domains/auth/api.js` | Cadastro, login, sessão atual e saída |

O cadastro usa nome, e-mail e senha de 8 a 128 caracteres e inicia a sessão automaticamente. Ao sair ou receber uma resposta de sessão expirada nas operações autenticadas, o painel é desmontado e o formulário de entrada volta a ser exibido.

## Backend

| Camada | Arquivo | Papel |
| --- | --- | --- |
| Transporte | `server/src/domains/auth/routes.js` | Cookie, middleware de sessão, limite de tentativas e rotas |
| Aplicação | `server/src/domains/auth/service.js` | Validação, scrypt, comparação de senha e geração de token |
| Persistência | `server/src/domains/auth/repository.js` | Usuários, sessões e criação transacional da conta com tipos iniciais |

O e-mail é normalizado em minúsculas. A senha recebe salt individual e hash scrypt. A sessão dura sete dias e seu token é armazenado como hash no banco. O cookie usa HttpOnly e SameSite=Lax. Com `NODE_ENV=production`, exige HTTPS. Cadastro e login permitem até 30 tentativas por IP em uma janela de 15 minutos.

## Contrato HTTP

| Método | Rota | Corpo | Sucesso |
| --- | --- | --- | --- |
| `POST` | `/api/auth/register` | `name`, `email`, `password` | `201` com `user` e cookie |
| `POST` | `/api/auth/login` | `email`, `password` | `200` com `user` e cookie |
| `GET` | `/api/auth/me` | — | `200` com `user` ou `null` |
| `POST` | `/api/auth/logout` | — | `204` e revogação da sessão |

As respostas de usuário contêm `id`, `name` e `email`. Dados inválidos retornam `400`, credenciais incorretas retornam `401`, e-mail repetido retorna `409` e excesso de tentativas retorna `429`.
