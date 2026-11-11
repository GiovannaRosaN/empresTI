# Handoff

## Contexto

- Tarefa: integrar o banco, permitir inserção de usuários locais para teste e conectar o catálogo à persistência.
- Objetivo: substituir os dados demonstrativos do catálogo por dados locais do Postgres, com usuários autenticados e associados a um tenant.
- Data: 2026-11-05.
- Responsável: não definido.

## O que foi feito

- Revisados o schema Prisma, a migration inicial, o seed existente, o login Supabase, a página e o componente do catálogo, além das regras e tasks do MVP.
- Confirmado que o catálogo ainda lê dados estáticos de `src/data/demo.ts`; a aplicação ainda não usa Prisma nem tRPC para esse fluxo.
- Confirmado que já existem um schema Prisma e um seed de tenant/equipamentos, mas não há provisionamento de usuários de teste.
- A suíte existente passou: `npm test` (4 testes).
- Nenhuma conexão, migration, seed ou alteração de dados foi executada durante esta tarefa.

## Estado atual

- Implementado: apenas a análise e este handoff; não houve código de integração de banco nesta tarefa.
- Pendente: configurar e validar Prisma no runtime aprovado; provisionar usuários de teste no Supabase Auth local e seus registros em `Membership`; carregar o catálogo do banco; criar testes e validar build.
- Bloqueios: as URLs presentes em `.env` não puderam ser classificadas como locais pela checagem sem exposição de valores. O usuário informou que o ambiente é local, mas isso ainda precisa ser confirmado antes de qualquer operação. A matriz de acesso e o DDL/RLS da migration também precisam de aprovação conforme `docs/rules/migration.md`.

## Decisões importantes

- Escopo inicial aprovado: banco + usuários de teste + catálogo; o backend de empréstimos fica fora desta fatia.
- Tenant de teste escolhido: `suporte-ti` (tenant `Suporte TI` do seed existente).
- Papéis de teste escolhidos: `COLLABORATOR` e `ADMIN`.
- Permissões propostas, ainda não aprovadas: membros do tenant leem o catálogo; `ADMIN` cadastra e altera equipamentos.
- Não usar o Supabase remoto. Não compartilhar senhas, chaves ou URLs com credenciais.

## Arquivos relevantes

- `prisma/schema.prisma`
- `prisma/migrations/20261022024919_init/migration.sql`
- `prisma/seed.mjs`
- `src/lib/supabase/server.ts`
- `src/data/demo.ts`
- `src/components/catalog-browser.tsx`
- `app/(app)/catalogo/page.tsx`
- `docs/specs/mvp.md`
- `docs/tasks/mvp.md`
- `docs/rules/migration.md`
- `docs/rules/restrictions.md`
- `docs/rules/secrets.md`

## Como validar

```text
npm test
npm run typecheck
npm run build
```

Executar validações de Prisma, migration ou seed somente depois de confirmar que as conexões apontam para serviços locais e de aprovar a migration. Nunca executar contra o Supabase remoto.

## Próximos passos

1. Confirmar localmente que `DATABASE_URL`, `DIRECT_URL` e `NEXT_PUBLIC_SUPABASE_URL` apontam para os serviços locais; não enviar os valores ao chat.
2. Aprovar ou ajustar as permissões propostas para leitura do catálogo e escrita de equipamentos.
3. Apresentar o DDL e o plano de impacto da migration/RLS e aguardar aprovação antes de alterar schema ou migration.
4. Implementar a camada Prisma/tRPC conforme ADR-001, o provisionamento local de usuários com associação ao tenant e a leitura persistida do catálogo.
5. Testar com usuários dos dois papéis, executar a suíte, typecheck e build, e validar apenas no ambiente local.

## Observações

- O fluxo de provisionamento de usuários e a matriz de permissões continuam pendentes na spec do MVP; não implementar cadastro aberto nem presumir permissões além das explicitamente aprovadas.
- O schema atual não declara policies RLS na migration inicial. Qualquer ajuste precisa seguir `docs/rules/migration.md` e manter Prisma Migrate como dono das migrations.
- O `npm test` anterior cobriu a suíte existente, não uma integração real de banco.