---
name: seguranca-tenant
description: Revise ou implemente autenticação, autorização e isolamento por tenant no EmpresTI. Use em fluxos de sessão, permissões, procedimentos tRPC, acesso Prisma ou RLS. Não use para decidir papéis, tenants ou políticas ainda pendentes.
---

# Segurança por tenant

## Precedência

Esta skill orienta; não decide. Em conflito, valem `rules/`, `docs/adr/` e a spec aprovada. Pare e avise.

## Antes de começar

1. Leia `docs/adr/001-stack.md`, a spec relevante e `rules/secrets.md`; para mudanças de schema ou políticas, leia também `rules/migration.md`.
2. Confirme que a matriz de papéis, o tenant e o critério de aceite estão definidos. Se algum deles controlar o acesso e continuar pendente, pare e peça a decisão.
3. Trace o caminho de identidade e dados existente: sessão Supabase, middleware/procedure, tenant, Prisma e políticas RLS. Não presuma que autenticação concede autorização.

## Procedimento

1. Use Supabase Auth com `@supabase/ssr` e sessão em cookie `httpOnly`, conforme ADR-001. Verifique a identidade com o método apropriado do servidor; não confie em dados de sessão não verificados.
2. Aplique autorização no limite definido pela arquitetura aprovada. O ADR-001 prevê `protectedProcedure`, `tenantProcedure` e `adminProcedure`, com RLS como defesa em profundidade.
3. Não trate RLS como autorização primária para consultas Prisma: o ADR-001 registra que Prisma a ignora por padrão. Não contorne esse limite com chave privilegiada.
4. Ao alterar schema, RLS ou policies, siga `rules/migration.md`: Prisma Migrate é o único dono das migrations e tabelas sujeitas a usuário ou tenant precisam nascer protegidas.
5. Restrinja operações administrativas e segredos ao servidor. Nunca exponha `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL` ou `DIRECT_URL` ao navegador; consulte `rules/secrets.md`.

## Verificação

- Teste acesso autenticado e não autenticado, papel permitido e negado, e isolamento entre tenants conforme os critérios aprovados.
- Verifique que nenhuma consulta ou mutação aceita `userId`, papel ou tenant do cliente como autoridade sem validação no servidor.
- Execute os checks aplicáveis de `AGENTS.md` e `rules/checks.md`; nunca use o Supabase remoto para testes ou migrations.

## Não faça

- Não invente a matriz de permissões, o processo de provisionamento ou o tenant padrão.
- Não use a service role para contornar uma policy, nem coloque segredos em código cliente, logs ou arquivos versionados.
- Não crie exceções de acesso, policies permissivas ou bypasses para fazer um teste passar.
- Não altere o Supabase remoto nem execute migrations ou alterações de dados fora do ambiente local autorizado.