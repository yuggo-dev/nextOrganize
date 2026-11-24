# Guia da documentação

Esta documentação descreve o código presente no repositório. Implementação local,
configuração de credenciais e publicação na nuvem são etapas distintas.

## Por onde começar

| Documento | O que explica |
| --- | --- |
| [Branches e ambientes](branches.md) | Fluxo main/produção e desenvolvimento, commits e publicação |
| [Ferramentas](tools.md) | Tecnologias usadas, responsabilidade de cada uma e comandos do projeto |
| [Arquitetura](architecture.md) | Papel de cada ambiente, camadas, fluxos, bancos e autenticação |
| [Estado da integração](migration-status.md) | O que está implementado, o que foi validado e o que falta na nuvem |
| [Supabase: produção](supabase.md) | Publicação de schema, função e frontend; secrets, conexão e backup |
| [Autenticação](domains/auth.md) | Cadastro, login, sessão e contrato HTTP |
| [Tarefas](domains/tasks.md) | Agenda, recorrência, desempenho e contrato HTTP |
| [Tipos de tarefa](domains/task-types.md) | Categorias, cores, validação e contrato HTTP |

## Visão rápida

A aplicação tem uma interface React e três domínios: autenticação, tarefas e tipos.

- **Principal:** a API roda em Supabase Edge Functions com PostgreSQL, e o frontend
  é publicado separadamente (Netlify). É o único ambiente de uso real.
- **Desenvolvimento local:** Express + SQLite, para programar e testar sem tocar
  na produção.
- **Segundo plano:** Express + PostgreSQL (com o `Dockerfile`) fica como base para
  um eventual servidor próprio no futuro. Não está em uso.

As regras de negócio vêm dos mesmos módulos de `server/src/` nos três casos. O que
está publicado e o que falta fica em [estado da integração](migration-status.md).

Não há um ORM: os repositórios executam SQL diretamente. As contas continuam na
autenticação da própria aplicação; Supabase Auth não foi integrado.
