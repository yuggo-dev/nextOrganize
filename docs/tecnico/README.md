# Documentação técnica

Como o nextOrganize é construído, executado e publicado. O comportamento das
telas, para quem usa o app, está na [documentação funcional](../funcional/README.md).

## Por onde começar

| Documento | O que explica |
| --- | --- |
| [Executar, configurar e verificar](execucao.md) | Instalação, modos de execução, variáveis, testes, dados e estrutura de pastas |
| [Branches e ambientes](branches.md) | Fluxo main/produção e desenvolvimento, commits e publicação |
| [Ferramentas](ferramentas.md) | Tecnologias usadas, responsabilidade de cada uma e comandos do projeto |
| [Arquitetura](arquitetura.md) | Papel de cada ambiente, camadas, fluxos, bancos e autenticação |
| [Estado da integração](estado-supabase.md) | O que está implementado, o que foi validado e o que falta na nuvem |
| [Supabase: produção](supabase.md) | Publicação de schema, função e frontend; secrets, conexão e backup |

## Domínios

Cada documento de domínio descreve as camadas do frontend, as camadas do backend
e o contrato da API.

| Documento | Frontend | Backend |
| --- | --- | --- |
| [Arquitetura](arquitetura.md) | Composição, apresentação, hooks, regras e HTTP | Inicialização, transporte, serviços, repositórios e infraestrutura |
| [Autenticação](dominios/autenticacao.md) | Login, cadastro e sessão | Credenciais, sessões, cookies e rotas |
| [Tarefas e agenda](dominios/tarefas.md) | Resumo, calendário, janela de cadastro, lista, desempenho e hábitos | Validação, isolamento, data, horário, atraso e persistência |
| [Tipos de tarefa](dominios/tipos.md) | Formulário de nome, cor e ícone; personalização | Tipos por conta, validação e migração de categorias |

## Visão rápida

A aplicação tem uma interface React e três domínios: autenticação, tarefas e tipos.

- **Principal:** a API roda em Supabase Edge Functions com PostgreSQL, e o frontend
  é publicado separadamente (Netlify). É o único ambiente de uso real.
- **Desenvolvimento local:** Express + SQLite, para programar e testar sem tocar
  na produção.
- **Segundo plano:** Express + PostgreSQL (com o `Dockerfile`) fica como base para
  um eventual servidor próprio no futuro. Não está em uso.

As regras de negócio vêm dos mesmos módulos de `server/src/` nos três casos. O que
está publicado e o que falta fica em [estado da integração](estado-supabase.md).

Não há um ORM: os repositórios executam SQL diretamente. As contas continuam na
autenticação da própria aplicação; Supabase Auth não foi integrado.

Esta documentação descreve o código presente no repositório. Implementação local,
configuração de credenciais e publicação na nuvem são etapas distintas.
