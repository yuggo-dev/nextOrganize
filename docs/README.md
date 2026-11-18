# Guia da documentação

Esta documentação descreve o código presente no repositório. Implementação local,
configuração de credenciais e publicação na nuvem são etapas distintas.

## Por onde começar

| Documento | O que explica |
| --- | --- |
| [Branches e ambientes](branches.md) | Fluxo main/produção e desenvolvimento, commits e publicação |
| [Ferramentas](tools.md) | Tecnologias usadas, responsabilidade de cada uma e comandos do projeto |
| [Arquitetura](architecture.md) | Componentes, camadas, fluxos, bancos e autenticação |
| [Estado da integração](migration-status.md) | O que está implementado, o que foi validado e o que falta na nuvem |
| [Supabase e execução remota](supabase.md) | Configuração, importação do SQLite e publicação da API/frontend |
| [Autenticação](domains/auth.md) | Cadastro, login, sessão e contrato HTTP |
| [Tarefas](domains/tasks.md) | Agenda, recorrência, desempenho e contrato HTTP |
| [Tipos de tarefa](domains/task-types.md) | Categorias, cores, validação e contrato HTTP |

## Visão rápida

A aplicação tem uma interface React e três domínios: autenticação, tarefas e tipos.
No desenvolvimento, pode usar Express e SQLite. O código também está preparado
para PostgreSQL e para uma API em Supabase Edge Functions, com frontend publicado
separadamente. A existência desses arquivos não significa que o ambiente remoto
já esteja publicado.

Não há um ORM: os repositórios executam SQL diretamente. As contas continuam na
autenticação da própria aplicação; Supabase Auth não foi integrado.
