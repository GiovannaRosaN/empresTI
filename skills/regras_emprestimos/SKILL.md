---
name: regras-emprestimos
description: Implemente ou revise regras de empréstimo e devolução do EmpresTI a partir da spec aprovada. Use para disponibilidade, limites, prazo, atraso e manutenção. Pare quando o comportamento depender de uma decisão de produto pendente.
---

# Regras de empréstimos

## Precedência

Esta skill orienta; não decide. Em conflito, valem `docs/rules/`, `docs/adr/` e a spec aprovada. Pare e avise.

## Antes de começar

1. Leia `docs/PRD.md` e `docs/specs/mvp.md`; localize os critérios de aceite relacionados e as decisões registradas em `docs/perguntas-prd.md`.
2. Confirme que as decisões que afetam o comportamento solicitado foram respondidas. Se não foram, descreva o bloqueio e peça a decisão, sem escolher um padrão por conta própria.
3. Localize o caminho de código responsável pela regra e os testes existentes antes de propor mudanças.

## Procedimento

1. Preserve as regras aprovadas na v1: no máximo três itens emprestados simultaneamente por pessoa; prazo padrão de 14 dias; bloqueio de novo empréstimo quando há atraso; equipamento em manutenção indisponível.
2. Aplique as regras no servidor no ponto de persistência ou operação aprovado, não apenas na interface. Mantenha a validação e a alteração de disponibilidade consistentes em operações concorrentes.
3. Trate prazo, atraso, disponibilidade e status como conceitos distintos. Use somente estados e transições definidos na spec aprovada.
4. Adicione ou atualize testes para limites, datas relevantes, manutenção, bloqueio por atraso e resultados permitidos/negados, conforme o critério de aceite.
5. Se o comportamento exigir schema, transação ou política de acesso, siga `docs/rules/migration.md` e `skills/seguranca_tenant/SKILL.md`.

## Verificação

- Confira os limites de três itens e 14 dias, o bloqueio por atraso e a indisponibilidade de equipamentos em manutenção.
- Verifique que erros e estados apresentados correspondem ao contrato da tela e à spec, sem expor dados de outro usuário ou tenant.
- Execute os testes afetados e os checks requeridos por `AGENTS.md` e `docs/rules/checks.md`.

## Não faça

- Não decida se solicitar equivale a retirar, se há cancelamento, como tratar devolução danificada ou como recalcular atraso; consulte as decisões pendentes da spec.
- Não invente estados, histórico, notificações, reservas ou regras fora do escopo da v1.
- Não confie exclusivamente em validações de interface para impedir empréstimos inválidos.
- Não altere schema ou políticas fora de uma migration versionada e validada localmente.