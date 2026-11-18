# Branches e ambientes

| Branch | Finalidade | Uso |
| --- | --- | --- |
| `main` | Produção | Versões revisadas e aprovadas para publicação |
| `desenvolvimento` | Desenvolvimento | Implementar, testar e revisar mudanças antes de levá-las à produção |

A branch padrão do repositório é `main`. O trabalho diário deve ocorrer em
`desenvolvimento` ou em branches de funcionalidade criadas a partir dela.

## Fluxo de trabalho

1. Trabalhe em `desenvolvimento`, confira as alterações com `git diff` e faça
   commits dos arquivos desejados, sem incluir credenciais.
2. Execute `npm test` e `npm run build` antes de propor uma versão.
3. Envie os commits com `git push`.
4. Abra um pull request de `desenvolvimento` para `main` no GitHub.
5. Depois da revisão e do merge, publique o código de `main` no ambiente de produção.

```sh
git switch desenvolvimento
# Edite, confira e faça commit dos arquivos desejados.
git push
```

Ao configurar uma hospedagem, selecione `main` para produção. Preview ou ambiente
de testes deve acompanhar `desenvolvimento` e usar configuração própria.

## Estado desta configuração

As duas branches partem do mesmo commit publicado. As alterações presentes no
workspace ao criar a branch foram preservadas sem commit automático. Elas só
passarão a integrar o histórico de `desenvolvimento` após serem commitadas ali.
Trocar de branch com alterações sem commit pode carregá-las junto ou ser impedido
pelo Git; a separação efetiva do código depende dos commits.

As branches `main` e `desenvolvimento` estão publicadas no GitHub. A branch local
ativa é `desenvolvimento`, com acompanhamento de `origin/desenvolvimento`.
O Git foi autenticado pela GitHub CLI com a conta proprietária do repositório.
As alterações sem commit continuam locais e não foram incluídas nessa publicação.

Esta configuração define branches Git. Ela não cria deploy automático,
regras de proteção do GitHub ou um segundo projeto Supabase. A publicação atual
da Edge Function continua manual e aponta para o projeto de produção.

## Banco e API durante o desenvolvimento

O frontend local está configurado para a API publicada no Supabase. Mudar a branch
não muda automaticamente a conexão, os secrets ou o banco. Para testar sem alterar
dados de produção, use SQLite local ou configure outro projeto Supabase com
credenciais e `VITE_API_URL` próprios.

Antes de um deploy manual de produção, confirme a branch com:

```sh
git branch --show-current
```

A branch deve ser `main`, com as alterações aprovadas já commitadas. Siga então
[as instruções de publicação](supabase.md), incluindo a preparação dos módulos da
Edge Function. Os scripts de schema e deploy também usam o projeto configurado,
independentemente da branch atual.
