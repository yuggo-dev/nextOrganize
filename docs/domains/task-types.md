# Domínio de tipos de tarefa

## Frontend

| Camada | Arquivo | Papel |
| --- | --- | --- |
| Apresentação | `client/src/domains/task-types/TypeForm.jsx` | Nome, seletor de cor, sugestões de cores, ícone e prévia |
| Apresentação | `client/src/domains/task-types/TypeManager.jsx` | Escolher um tipo existente e editá-lo com o mesmo `TypeForm` |
| Apresentação | `client/src/domains/task-types/IconPicker.jsx` | Seletor de ícones com grupos, busca e opção Automático |
| Catálogo | `client/src/domains/task-types/icons.jsx` | Ícones disponíveis, sugestão automática pelo nome e componente `TypeIcon` |
| Integração | `client/src/domains/task-types/api.js` | Listar, criar e atualizar tipos da conta |

O menu **Tipos → Novo tipo** abre o formulário. A janela de nova tarefa também permite criar um tipo e retornar ao cadastro com o tipo recém-criado selecionado. As cores aparecem na borda e no marcador da tarefa e nos dias do calendário.

## Backend

| Camada | Arquivo | Uso | Papel |
| --- | --- | --- | --- |
| Transporte Edge | `server/src/edge/handler.js` | Produção | Rotas autenticadas por Bearer |
| Aplicação | `server/src/domains/task-types/service.js` | Ambos | Validar nome, cor e ícone e traduzir duplicidade em `409` |
| Persistência | `server/src/domains/task-types/repository.js` | Ambos | Consultar, criar, atualizar e inicializar tipos por conta (SQLite ou `infrastructure/postgres-repositories.js`) |
| Transporte Express | `server/src/domains/task-types/routes.js` | Local | Rotas autenticadas por cookie |

Uma conta recebe sugestões iniciais de Trabalho, Físico, Alimentação, Pessoal e Estudos e pode cadastrar novos tipos. Nomes são únicos dentro da conta, sem distinção entre maiúsculas e minúsculas. Contas diferentes podem usar os mesmos nomes.

Na migração de dados antigos, as categorias existentes também são cadastradas como tipos. Categorias sem cor anterior recebem `#64748b`.

## Contrato HTTP

As rotas são relativas à base da API: `https://lykruvajikxyfzcvtzzb.supabase.co/functions/v1/tarefas-api` na produção e `/api` no Express local.

| Método | Rota | Sucesso |
| --- | --- | --- |
| `GET` | `/task-types` | `200` com lista de `{ id, name, color, icon }`, em ordem de ID |
| `POST` | `/task-types` | `201` com tipo criado |
| `PATCH` | `/task-types/:id` | `200` com tipo atualizado (veja [Personalizar um tipo existente](#personalizar-um-tipo-existente)) |

```json
{
  "name": "Alimentação",
  "color": "#f59e0b",
  "icon": "FaUtensils"
}
```

O nome precisa ter de 1 a 60 caracteres após remover espaços nas extremidades. A cor deve seguir `#RRGGBB` e é gravada em minúsculas. `icon` é opcional (veja [Ícones por tipo](#ícones-por-tipo)). Dados inválidos retornam `400` e nome repetido retorna `409`. Todas as rotas exigem autenticação.

## Diferenças entre produção e Express

Na produção (PostgreSQL), os nomes são comparados com `lower(name)` e um índice
único por usuário. No SQLite local, a regra usa `COLLATE NOCASE`. As regras de
comparação Unicode variam entre os bancos: um nome com acento ou caractere especial
aceito localmente pode ser recusado como duplicado na produção, ou o contrário.
Em caso de dúvida, o comportamento de referência é o do PostgreSQL.

Nos dois transportes, a validação é a mesma (`service.js`) e a API exige a
propriedade do tipo antes de associá-lo a uma tarefa.


## Personalizar um tipo existente

A opção **Tipos → Personalizar tipos** da agenda abre `TypeManager.jsx`. Selecione um tipo
e altere nome/cor no mesmo `TypeForm` usado para criação. A atualização usa
`PATCH /task-types/:id`, enviando `name` e
`color` e, opcionalmente, `icon`. Responde `200` com `{ id, name, color, icon }`, `404` para tipo inexistente/de
outra conta, `400` para dados inválidos e `409` para nome duplicado na conta.

`task-types/service.js` compartilha a validação entre Express e Edge. O repositório
atualiza o tipo e o campo legado `tasks.category` em uma transação, filtrando pela
conta. O frontend atualiza os tipos, cores e nomes das tarefas carregadas. No
SQLite, tipos padrão são criados somente quando a conta ainda não possui tipos,
para que renomear um padrão não o recrie automaticamente ao reiniciar.


## Ícones por tipo

Novo tipo e Personalizar tipos incluem um seletor com 47 ícones da biblioteca
React Icons (`react-icons/fa6` e `react-icons/gi`), busca e prévia na cor escolhida.
O catálogo está em `client/src/domains/task-types/icons.jsx`; os componentes são
importados explicitamente, sem carregar dinamicamente um ícone informado pela API.

| Contexto | Exemplos do seletor |
| --- | --- |
| Trabalho | Maleta (`FaBriefcase`), computador, resultados, projetos, empresa |
| Físico | Musculação (`FaDumbbell`), corrida, condicionamento, ciclismo, natação |
| Espiritual | Meditação (`GiMeditation`), oração, equilíbrio, fé, paz, luz |
| Pessoal | Pessoa (`FaUser`), casa, família, autocuidado, pausa |
| Dojo/MTAI | Quimono (`GiKimono`), faixa, dojo, disciplina, evolução, foco |
| Estudos | Formação (`FaGraduationCap`), leitura, programação, aprendizado, escrita |
| Outros contextos | Alimentação, finanças, viagens, música, criatividade, lazer, saúde, animais, natureza, manutenção, compromissos, energia, aventura e crescimento |

A opção Automático usa uma sugestão baseada no nome, sem gravar uma escolha fixa.
A personalização é opcional: tipos existentes não são renomeados nem recebem
escolhas fixas sem intervenção do usuário. Esses grupos são sugestões e não
restringem as opções que cada tipo pode usar.

`task_types.icon` armazena o identificador textual ou `null` (automático).
Criação/edição aceitam o campo `icon`. Omitir o campo na edição preserva a escolha;
enviar `null` restaura o automático. A API valida identificadores dos prefixos
Fa/Gi, sem aceitar markup ou executar seu conteúdo. Identificadores desconhecidos
pelo catálogo visual recebem a sugestão automática como fallback.

As tarefas retornam `category_icon` associado ao tipo. Renomear, recolorir ou
mudar o ícone atualiza as tarefas carregadas no frontend. PostgreSQL usa a migração
`202611180002_type_icons.sql`; SQLite adiciona a coluna ao iniciar. O importador
inclui o campo ao transferir tipos para PostgreSQL.

Biblioteca: https://react-icons.github.io/react-icons/


### Destaque visual e identificação

O ícone do tema aparece em um bloco colorido maior ao lado do título da tarefa e
na identidade de Personalizar tipos. A faixa de temas abaixo do calendário mostra
ícone e nome; seus botões filtram calendário e lista, com indicação do tema ativo.
A seleção por lista continua disponível no painel de tarefas.

As ações usam ícones Feather do React Icons (`react-icons/fi`), com textos, títulos
e rótulos acessíveis: criar, salvar, editar/mover, excluir, repetir, buscar, filtrar
e navegar. Ações da repetição ficam no menu de reticências, preservando as opções
de remover um dia ou excluir a série.
