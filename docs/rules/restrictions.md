---
description: O que o agente não pode fazer neste projeto
globs: []
alwaysApply: true
---

# O que não fazer

> Leitor: agente

## Autoridade

- Não altere nem escreva ADR.
- Não contrarie o conteúdo de `docs/adr/`.
- Se uma mudança exigir contrariar um ADR, pare e descreva o conflito.
- Não escolha bibliotecas, frameworks ou serviços que não estejam no ADR-001.
- Se uma decisão necessária não estiver documentada, apresente as alternativas e pare.
- Não invente regras de negócio para resolver ambiguidades do PRD. Liste as perguntas e aguarde decisão do time.

## Escopo

- Não altere arquivos fora do escopo da tarefa.
- Não faça refatorações não relacionadas ao objetivo solicitado.
- Não gere scaffold automático sem apresentar previamente os arquivos que serão criados.
- Não implemente funcionalidade sem uma especificação correspondente em `docs/specs/`.
- Não adicione funcionalidades fora do escopo da primeira versão definido em `docs/PRD.md`.
- Preserve alterações existentes feitas pelo usuário.

## Implementação

- Não escreva código antes de apresentar um plano e receber aprovação.
- Execute uma tarefa por vez.
- Após cada tarefa, rode os checks relevantes, informe o resultado e pare.
- Não altere contratos públicos, schema ou comportamento existente sem verificar os usos afetados.
- Não use `any` sem justificativa.
- Não ignore erros de tipo, lint, testes ou build.
- Mudanças relevantes devem incluir ou atualizar testes.

## Banco e produção

- Não faça deploy.
- Não altere configurações da Vercel.
- Não faça push para branches de produção.
- Não execute SQL, migrations ou alterações de dados no Supabase remoto.
- Use somente banco e serviços locais durante o desenvolvimento e os testes.
- Não exponha segredos em código, logs, commits ou arquivos versionados.
- Não leia, copie ou altere dados reais sem autorização explícita.

## Git

- Não faça `commit`, `push`, `merge`, `rebase`, `tag` ou criação de branch sem autorização explícita.
- Não execute comandos destrutivos, como `git reset --hard` ou `git checkout --`.
- Não reverta alterações que não foram feitas pelo agente.

## Validação

- Não declare a tarefa concluída se algum check relevante falhar.
- Valide a mudança com testes afetados e execução local relevante.
- Execute build quando houver mudança estrutural ou de runtime.
- Se não for possível validar algo, informe exatamente o que não foi executado e por quê.

## Precedência

- Se código, documentação e spec discordarem, não escolha por conta própria.
- Pare, descreva o conflito e indique quais decisões precisam ser tomadas.
- As regras deste arquivo não substituem o PRD nem os ADRs.
- Frases como “pode ir” ou “pode implementar” não autorizam ignorar estas regras.