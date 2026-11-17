# Tarefas e prazos

Agenda pessoal com contas individuais, calendário mensal e tarefas organizadas por data, horário e tipo. React e Vite na interface, Node.js e Express na API e SQLite para persistência local.

## Funcionalidades

- Cadastro, login e saída, com tarefas e tipos próprios para cada conta.
- Resumo de tarefas para hoje, nos próximos sete dias e em aberto.
- Calendário com marcações coloridas e listagem das tarefas do dia selecionado, inicialmente o dia atual.
- Cadastro por janela aberta no botão **Nova tarefa**, com título, tipo, prioridade, data e horário de conclusão.
- Tipos personalizados com nome e cor, criados no botão **Novo tipo** ou durante o cadastro de uma tarefa.
- Tarefas de hoje priorizadas na ordenação e atrasadas com indicação visual e seção própria.
- Conclusão, reabertura, exclusão, filtro por tipo e opção de ocultar concluídas.
- Tarefas diárias com data final opcional, conclusão independente por dia e combo de dias consecutivos concluídos.
- Lista com rolagem interna, mantendo o calendário e os controles visíveis. Em telas estreitas, o calendário aparece acima da lista.
- Seção retrátil de tarefas diárias, com contagem de concluídas no cabeçalho.
- Interface com navegação lateral, tema escuro inicial em tons azul-acinzentados e opção de alternar para o tema claro.
- Busca por título ou tipo de atividade, aplicada à lista e às marcações do calendário.
- Navegação entre **Início**, com a agenda, e **Desempenho**, com taxa de conclusão, pendências e gráficos por tipo, prioridade e data de prazo.

## Instalação e execução

É necessário ter Node.js 22 ou superior e npm. O projeto foi verificado com Node.js 24.

Na pasta raiz, instale as dependências e inicie o desenvolvimento.

```sh
npm run setup
npm run dev
```

Abra `http://localhost:5173`. A API usa `http://localhost:3001`, e o Vite encaminha as chamadas de `/api` para essa porta.

Para servir a versão compilada junto com a API, execute os comandos abaixo e acesse `http://localhost:3001`.

```sh
npm run build
npm start
```

Depois de alterar a interface, gere o build novamente para atualizar a versão servida pelo Express.

## Como usar

1. Crie sua conta com nome, e-mail e senha de 8 a 128 caracteres ou entre com uma conta existente.
2. Clique em **Nova tarefa** e informe título, tipo, prioridade, data e horário.
3. Use **Novo tipo** para criar categorias como Trabalho, Físico e Alimentação com suas próprias cores.
4. Selecione um dia no calendário para consultar suas tarefas. Os cartões do resumo também abrem as respectivas listas.
5. Use a caixa de seleção para concluir ou reabrir uma tarefa. A seção **Atrasadas** reúne as pendências que passaram do prazo.
6. Role a lista ao lado do calendário para acessar as demais tarefas. Clique em **Rotina diária** para recolher ou expandir as repetições.

Para criar uma tarefa diária, selecione **Repetição → Todos os dias** na janela de cadastro. Informe a data inicial e o horário e, se desejar, uma data final. O card mostra **Diária** e o combo atual quando houver dias consecutivos concluídos. No menu `⋯`, é possível remover só um dia ou excluir a diária e seu histórico.

## Documentação por domínios e camadas

| Documento | Frontend | Backend |
| --- | --- | --- |
| [Arquitetura](docs/architecture.md) | Composição, apresentação, hooks, regras e HTTP | Inicialização, transporte, serviços, repositórios e infraestrutura |
| [Autenticação](docs/domains/auth.md) | Login, cadastro e sessão | Credenciais, sessões, cookies e rotas |
| [Tarefas e agenda](docs/domains/tasks.md) | Resumo, calendário, janela de cadastro e lista | Validação, isolamento, data, horário e persistência |
| [Tipos de tarefa](docs/domains/task-types.md) | Formulário de nome e cor | Tipos por conta e migração de categorias |

Cada documento de domínio descreve as camadas do frontend, as camadas do backend e o contrato da API.

## Estrutura

```text
client/src/
├── App.jsx                     # Composição da aplicação
├── main.jsx                    # Inicialização do React
├── domains/
│   ├── auth/                   # Apresentação e API de autenticação
│   ├── tasks/                  # Painel, componentes, hooks, regras e API
│   └── task-types/              # Formulário de tipos e API
├── shared/
│   ├── components/             # Janela modal
│   └── http/                   # Cliente HTTP compartilhado
└── styles.css
server/
├── index.js                    # Inicialização do servidor
├── src/
│   ├── app.js                  # Composição do Express
│   ├── domains/
│   │   ├── auth/               # Rotas, serviço e repositório
│   │   ├── tasks/              # Rotas, serviço e repositório
│   │   └── task-types/         # Rotas e repositório
│   ├── infrastructure/         # Banco e migrações
│   └── shared/                 # Autorização e tratamento de erros HTTP
├── auth.test.js
└── migration.test.js
docs/
├── architecture.md
└── domains/                    # Documentação de cada domínio
```

## Configuração e API

| Variável | Padrão | Finalidade |
| --- | --- | --- |
| `PORT` | `3001` | Porta do Express |
| `DB_PATH` | `server/tarefas.db` | Arquivo SQLite |
| `NODE_ENV` | Ambiente do processo | Com `production`, o cookie de sessão exige HTTPS |

Exemplo no PowerShell, a partir da raiz.

```powershell
$env:PORT = "3001"
$env:DB_PATH = ".\server\tarefas.db"
npm start
```

As variáveis são lidas do ambiente. Se alterar a porta da API durante o desenvolvimento, ajuste o proxy em `client/vite.config.js`.

As rotas usam o prefixo `/api` e corpos JSON com `Content-Type: application/json`. Requisições de escrita exigem `X-Requested-With: tarefas`. Tarefas e tipos exigem o cookie de sessão obtido no cadastro ou login. Os contratos completos estão nos documentos de cada domínio.

## Verificação

```sh
node --test server/auth.test.js server/migration.test.js client/src/domains/tasks/model/schedule.test.js
node --test client/src/domains/tasks/model/performance.test.js
node --test server/recurrence.test.js client/src/domains/tasks/model/recurrence.test.js
npm run build
```

## Persistência e backup

O servidor cria e migra as tabelas ao iniciar. Contas, sessões, tarefas e tipos ficam no mesmo arquivo SQLite, com isolamento por usuário na API. Categorias antigas de contas existentes são convertidas em tipos, e tarefas anteriores recebem horário vazio. Tarefas antigas sem proprietário são preservadas sem vínculo automático com uma conta.

Para um backup por cópia de arquivos, encerre o servidor e copie `server/tarefas.db`, ou o arquivo definido em `DB_PATH`. Caso existam arquivos com sufixos `-wal` e `-shm` junto dele, preserve-os na mesma cópia. Para restaurar, recoloque os arquivos no caminho configurado com o servidor encerrado e inicie a aplicação.
