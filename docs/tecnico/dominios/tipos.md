# Domínio de tipos de tarefa

Arquivos, API e banco dos tipos. O uso das telas está em
[Tipos](../../funcional/tipos.md).

## Frontend

| Camada | Arquivo | Papel |
| --- | --- | --- |
| Apresentação | `client/src/domains/task-types/TypeForm.jsx` | Prévia ao vivo, nome, cores sugeridas e personalizada, e ícone |
| Apresentação | `client/src/domains/task-types/TypeManager.jsx` | Escolher um tipo existente (chips) e editá-lo com o mesmo `TypeForm` |
| Apresentação | `client/src/domains/task-types/IconPicker.jsx` | Seletor de ícones com grupos, busca e opção Automático |
| Catálogo | `client/src/domains/task-types/icons.jsx` | Ícones disponíveis, sugestão automática pelo nome e componente `TypeIcon` |
| Integração | `client/src/domains/task-types/api.js` | Listar, criar e atualizar tipos da conta |

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

As rotas são relativas à base da API: `https://<project-ref>.supabase.co/functions/v1/tarefas-api` na produção e `/api` no Express local.

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

**Tipos → Personalizar tipos** abre `TypeManager.jsx`, que reaproveita o
`TypeForm` da criação. A atualização usa `PATCH /task-types/:id`, enviando `name`
e `color` e, opcionalmente, `icon`. Responde `200` com `{ id, name, color, icon }`,
`404` para tipo inexistente/de outra conta, `400` para dados inválidos e `409`
para nome duplicado na conta.

`task-types/service.js` compartilha a validação entre Express e Edge. O repositório
atualiza o tipo e o campo legado `tasks.category` em uma transação, filtrando pela
conta. O frontend atualiza os tipos, cores e nomes das tarefas carregadas. No
SQLite, tipos padrão são criados somente quando a conta ainda não possui tipos,
para que renomear um padrão não o recrie automaticamente ao reiniciar.

## Ícones por tipo

O seletor usa 47 ícones da biblioteca React Icons (`react-icons/fa6` e
`react-icons/gi`). O catálogo está em `client/src/domains/task-types/icons.jsx`;
os componentes são importados explicitamente, sem carregar dinamicamente um ícone
informado pela API. Identificadores de exemplo por contexto: Trabalho
`FaBriefcase`, Físico `FaDumbbell`, Espiritual `GiMeditation`, Pessoal `FaUser`,
Dojo/MTAI `GiKimono`, Estudos `FaGraduationCap`. A lista completa por contexto
está em [Tipos: ícones](../../funcional/tipos.md#ícones).

`task_types.icon` armazena o identificador textual ou `null` (automático).
Criação/edição aceitam o campo `icon`. Omitir o campo na edição preserva a escolha;
enviar `null` restaura o automático. A API valida identificadores dos prefixos
Fa/Gi, sem aceitar markup ou executar seu conteúdo. Identificadores desconhecidos
pelo catálogo visual recebem a sugestão automática como fallback.

As tarefas retornam `category_icon` associado ao tipo. Renomear, recolorir ou
mudar o ícone atualiza as tarefas carregadas no frontend. PostgreSQL usa a migração
`202611180002_type_icons.sql`; SQLite adiciona a coluna ao iniciar. O importador
inclui o campo ao transferir tipos para PostgreSQL.

As ações da interface usam ícones Feather do React Icons (`react-icons/fi`).

Biblioteca: https://react-icons.github.io/react-icons/
