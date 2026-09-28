---
description: Procedimento para qualquer mudança de schema
globs: ["prisma/migrations/**", "prisma/schema.prisma", "src/server/**", "src/lib/**"]
alwaysApply: false
---

# Mudança de schema

> Leitor: agente

## Quando

Qualquer tarefa que precise criar, alterar ou remover tabela, coluna, índice,
constraint ou política de acesso, inclusive quando a mudança parecer trivial.

## Procedimento

1. Antes de gerar qualquer coisa, escreva na resposta o DDL pretendido, o
   impacto nos dados existentes e o plano de migração. Pare e aguarde aprovação.
2. Atualize o `prisma/schema.prisma` quando o modelo Prisma for afetado.
3. Gere a migration com Prisma Migrate:
   `npx prisma migrate dev --name <nome>`. Uma migration por tarefa.
4. Prisma Migrate é o único dono das migrations. Não use a Supabase CLI para
   criar ou versionar migrations.
5. Toda tabela nova deve nascer com Row Level Security habilitada e pelo menos
   uma policy explícita na mesma migration, quando a tabela estiver sujeita a
   acesso por usuário ou tenant. Tabela sem a proteção necessária não entra no
   repositório.
6. RLS, policies e triggers devem ser escritos em SQL dentro da migration,
   conforme definido no ADR-001.
7. Se a tabela já tiver dados, descreva o que acontecerá com as linhas
   existentes. Coluna obrigatória nova precisa de default, preenchimento
   compatível ou uma migração em etapas.
8. Verifique os usos afetados no Prisma, tRPC, serviços e testes antes de
   concluir a mudança.
9. Aplique a migration somente no banco local configurado para o projeto e
   rode o comando de testes definido no `package.json`.

## Verificação

A migration deve conseguir ser aplicada em uma máquina limpa, do zero, sem
passos manuais e sem erro. O schema do Prisma, as migrations e o banco local
devem permanecer sincronizados.

Antes de declarar a tarefa pronta, siga também `docs/rules/checks.md`.

## Não faça

- Não altere schema pelo Supabase Studio nem por SQL avulso. O que não está
  em uma migration versionada não faz parte do schema do projeto.
- Não use a Supabase CLI como dona das migrations.
- Não edite uma migration que já foi aplicada ou publicada. Crie a próxima.
- Não remova nem renomeie coluna sem descrever o impacto e o plano para os
  dados existentes.
- Não desabilite RLS, policies ou triggers para fazer a migration passar.
- Não toque no projeto Supabase remoto. Tudo acontece no ambiente local.
- Não rode testes, reset ou migration contra o banco remoto.
