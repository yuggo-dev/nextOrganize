# Arquitetura por domínios e camadas

O projeto possui três domínios funcionais — autenticação, tarefas e tipos de tarefa. Cada domínio reúne seus arquivos de interface, comunicação e regras. A infraestrutura compartilhada concentra o banco, o cliente HTTP e componentes reutilizados.

## Frontend

| Camada | Localização | Responsabilidade |
| --- | --- | --- |
| Composição | `client/src/main.jsx`, `client/src/App.jsx` | Inicializar o React e montar o acesso à aplicação |
| Apresentação de autenticação | `client/src/domains/auth/AuthPage.jsx` | Login, cadastro, consulta de sessão e saída |
| Apresentação de tarefas | `client/src/domains/tasks/Dashboard.jsx`, `components/` | Resumo, calendário, lista com rolagem, visualização de diárias e janela de cadastro |
| Aplicação de tarefas | `client/src/domains/tasks/hooks/useTasks.js` | Carregar dados e sincronizar criação, conclusão e exclusão com o estado da interface |
| Regras de agenda | `client/src/domains/tasks/model/schedule.js` | Datas locais, atrasos, ordem das tarefas e dias do calendário |
| Apresentação de desempenho | `client/src/domains/tasks/PerformanceDashboard.jsx` | Indicadores e gráficos de atividades da conta |
| Regras de desempenho | `client/src/domains/tasks/model/performance.js` | Conclusão, distribuição por status, tipos, prioridades e períodos por prazo |
| Regras de repetição | `client/src/domains/tasks/model/recurrence.js` | Ocorrências diárias por intervalo e combo de dias consecutivos |
| Apresentação de tipos | `client/src/domains/task-types/TypeForm.jsx` | Nome, escolha de cor e prévia de um tipo |
| Integração dos domínios | `api.js` em cada domínio | Definir as operações HTTP daquele domínio |
| Infraestrutura HTTP | `client/src/shared/http/client.js` | JSON, cookies, erros e notificação de sessão expirada |
| Componentes compartilhados | `client/src/shared/components/Modal.jsx` | Janela modal nativa com foco, fechamento e tecla Esc |
| Estilos | `client/src/styles.css` | Identidade visual, temas e adaptação à altura e largura da tela |

Os componentes chamam os hooks e as APIs de seus domínios. O cliente HTTP compartilhado aplica os cabeçalhos e envia o cookie da sessão. As regras de agenda são funções independentes de componentes e de chamadas de rede.

## Backend

| Camada | Localização | Responsabilidade |
| --- | --- | --- |
| Inicialização | `server/index.js` | Abrir o banco e iniciar a porta HTTP |
| Composição HTTP | `server/src/app.js` | Configurar Express, montar rotas, exigir autenticação e servir o build |
| Transporte | `routes.js` em cada domínio | Receber requisições e produzir respostas HTTP |
| Aplicação e regras | `auth/service.js`, `tasks/service.js` | Validar dados, verificar credenciais, resolver tipos e coordenar operações |
| Persistência | `repository.js` em cada domínio | Executar consultas SQLite com escopo da conta autenticada |
| Infraestrutura | `server/src/infrastructure/database.js` | Conexão, pragmas, tabelas, índices e migrações transacionais |
| Compartilhada HTTP | `server/src/shared/http.js` | Exigir usuário, propagar erros assíncronos e padronizar respostas de erro |

O domínio de tipos tem operações curtas de listagem e criação. Sua validação HTTP fica em `routes.js`, e as consultas ficam no repositório. A criação de uma conta chama a inicialização dos tipos padrão dentro da transação do cadastro.

## Fluxo de criação de uma tarefa

1. `TaskDialog` coleta título, tipo, prioridade, data e horário.
2. `useTasks` chama `taskApi.create`, que usa o cliente HTTP compartilhado.
3. O middleware identifica a sessão e exige uma conta autenticada.
4. `tasks/routes.js` encaminha o corpo para o serviço.
5. O serviço valida a data, o horário, a prioridade e a propriedade do tipo em uma transação.
6. O repositório grava a tarefa com o `user_id` obtido da sessão.
7. A interface recebe a tarefa, seleciona sua data e atualiza resumo, calendário e lista.

## Dados e migração

| Tabela | Domínio | Conteúdo |
| --- | --- | --- |
| `users` | Autenticação | Nome, e-mail único e hash da senha |
| `sessions` | Autenticação | Hash do token, conta e expiração |
| `tasks` | Tarefas | Título, prioridade, data, horário, conclusão, proprietário e tipo |
| `task_occurrences` | Tarefas | Conclusão e remoção de uma ocorrência diária, identificada por tarefa e data |
| `task_types` | Tipos de tarefa | Nome e cor vinculados à conta |

A inicialização adiciona `user_id`, `due_time` e `type_id` quando faltam no banco existente. Categorias antigas de contas existentes são convertidas em tipos, e tarefas anteriores continuam com seus títulos, datas e conclusão. O horário permanece vazio para registros anteriores.

A migração também adiciona `recurrence` e `recurrence_until`. Registros existentes recebem `recurrence = 'none'`. As definições diárias ficam em `tasks`, e apenas as conclusões e exceções por dia são gravadas em `task_occurrences`. A interface expande o intervalo necessário para a agenda. A exclusão da definição remove as ocorrências por chave estrangeira com cascata.

Registros anteriores à autenticação que estejam sem proprietário são preservados sem vínculo automático a uma conta. O isolamento das contas é aplicado nas consultas da API. Todos os domínios compartilham o mesmo arquivo SQLite.

## Verificação

Na raiz do projeto, execute os testes abaixo.

```sh
node --test server/auth.test.js server/migration.test.js client/src/domains/tasks/model/schedule.test.js
npm run build
```

Os testes exercitam login, sessão, isolamento das tarefas e dos tipos, horário inválido, persistência, migração de dados anteriores, ordem da agenda e calendário.
