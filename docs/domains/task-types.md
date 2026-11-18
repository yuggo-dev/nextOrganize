# Domínio de tipos de tarefa

## Frontend

| Camada | Arquivo | Papel |
| --- | --- | --- |
| Apresentação | `client/src/domains/task-types/TypeForm.jsx` | Nome, seletor de cor, sugestões de cores e prévia |
| Integração | `client/src/domains/task-types/api.js` | Listar e criar tipos da conta |

O botão **Novo tipo** abre o formulário. A janela de nova tarefa também permite criar um tipo e retornar ao cadastro com o tipo recém-criado selecionado. As cores aparecem na borda e no marcador da tarefa e nos dias do calendário.

## Backend

| Camada | Arquivo | Papel |
| --- | --- | --- |
| Transporte e validação | `server/src/domains/task-types/routes.js` | Validar nome e cor e retornar os tipos do usuário |
| Persistência | `server/src/domains/task-types/repository.js` | Consultar, criar e inicializar tipos por conta |

Uma conta recebe sugestões iniciais de Trabalho, Físico, Alimentação, Pessoal e Estudos e pode cadastrar novos tipos. Nomes são únicos dentro da conta, com comparação sem distinção entre maiúsculas e minúsculas segundo a collation NOCASE do SQLite. Contas diferentes podem usar os mesmos nomes.

Na migração, as categorias existentes também são cadastradas como tipos. Categorias sem cor anterior recebem `#64748b`.

## Contrato HTTP

| Método | Rota | Sucesso |
| --- | --- | --- |
| `GET` | `/api/task-types` | `200` com lista de `{ id, name, color }` |
| `POST` | `/api/task-types` | `201` com tipo criado |

```json
{
  "name": "Alimentação",
  "color": "#f59e0b"
}
```

O nome precisa ter de 1 a 60 caracteres após remover espaços nas extremidades. A cor deve seguir `#RRGGBB`. Dados inválidos retornam `400` e nome repetido retorna `409`. As duas rotas exigem autenticação.

## Execução com PostgreSQL e Edge

Em PostgreSQL, os nomes são comparados com `lower(name)` e um índice único por
usuário; em SQLite, a regra usa `COLLATE NOCASE`. As regras de comparação Unicode
podem variar entre bancos, portanto não se deve assumir equivalência completa
das duas collations para todo caractere.

O SQL remoto está em `infrastructure/postgres-repositories.js`. O handler Edge
valida os mesmos campos de nome/cor e usa a sessão Bearer. Substitua o prefixo
`/api` por `/functions/v1/tarefas-api` nas rotas acima. A API exige a propriedade
do tipo antes de associá-lo a uma tarefa.
