# Tasks — EmpresTI v1

Tasks derivadas de [spec funcional](../specs/mvp.md) e [plano](../plans/mvp.md). As tasks bloqueadas não devem ser iniciadas até que suas dependências sejam decididas.

## Fase 0 — Decisões

- [ ] **T-01** Decidir tratamento de devolução danificada ou incompleta. Referência: pergunta 1 do PRD.
- [ ] **T-02** Decidir quando e como um empréstimo passa a atrasado. Referência: pergunta 2 do PRD.
- [ ] **T-03** Definir se solicitação é empréstimo imediato ou se existe etapa de retirada/cancelamento. Referência: pergunta 3 do PRD.
- [ ] **T-04** Definir provisionamento de colaboradores e concessão/revogação do papel de Operações. Referência: pergunta 4 do PRD.
- [ ] **T-05** Decidir retenção e visibilidade do histórico de devoluções. Referência: pergunta 5 do PRD.
- [ ] **T-06** Definir tenant, papéis e matriz de permissões, pendentes no ADR-001.

**Pronto quando:** decisões estiverem registradas e permitirem definir entidades, transições de estado e limites de acesso sem suposições.

## Fase 1 — Fundação

- [ ] **T-07** Inicializar Next.js App Router e TypeScript em modo `strict`, preservando arquivos e dependências do usuário.
- [ ] **T-08** Configurar Tailwind e estrutura de estilos/componentes alinhada ao stack aprovado e ao layout.
- [ ] **T-09** Configurar Vitest, Testing Library e comandos de teste/build no `package.json`.
- [ ] **T-10** Implementar shell responsivo com sidebar, navegação, header e tokens visuais definidos em `docs/layout.md`.

**Pronto quando:** aplicação inicia e builda; navegação compartilhada tem estados de foco acessíveis e funciona em viewport móvel e desktop.

## Fase 2 — Colaborador

- [ ] **T-11** Implementar `/login` usando Supabase Auth e `@supabase/ssr`, após resolver T-04.
- [ ] **T-12** Implementar `/catalogo` com busca, filtros, situação e aviso das regras aprovadas.
- [ ] **T-13** Implementar `/catalogo/:patrimonio` com estado do item, dados técnicos e confirmação de solicitação.
- [ ] **T-14** Implementar `/meus-emprestimos` com prazo, limite visual e ação de devolução.
- [ ] **T-15** Implementar testes de regras para limite, prazo, bloqueio por atraso e indisponibilidade, conforme decisões T-01 a T-03.

**Pronto quando:** CA-01 a CA-05 passam, incluindo autorização para dados próprios.

## Fase 3 — Operações

- [ ] **T-16** Implementar `/operacoes/emprestimos` com filtros, tabela, métricas e tratamento visual de atraso.
- [ ] **T-17** Implementar `/operacoes/equipamentos/novo` com validação e situações iniciais permitidas.
- [ ] **T-18** Implementar devolução por Operações, respeitando o fluxo decidido em T-01 e T-03.
- [ ] **T-19** Proteger páginas e procedimentos de Operações conforme T-04 e T-06.

**Pronto quando:** CA-06 e CA-07 passam para usuário autorizado e acesso não autorizado é negado.

## Fase 4 — Persistência e segurança

- [ ] **T-20** Definir schema Prisma para equipamento, empréstimo, usuário/tenant e estados aprovados em T-01 a T-06.
- [ ] **T-21** Criar migrations com Prisma Migrate; incluir RLS e policies SQL na mesma migration quando aplicável.
- [ ] **T-22** Implementar contexto tRPC e middlewares `protectedProcedure`, `tenantProcedure` e `adminProcedure` de acordo com T-06.
- [ ] **T-23** Implementar operações de catálogo, solicitação, consulta pessoal, devolução, operações e cadastro através do tRPC.
- [ ] **T-24** Testar isolamento e regras usando `createCaller` e Postgres real/Testcontainers.

**Pronto quando:** comportamento funcional não depender apenas de estado local/visual e as regras forem garantidas no servidor e banco.

## Fase 5 — Aceitação

- [ ] **T-25** Cobrir os fluxos críticos com Playwright: login, pedido, bloqueios, devolução e Operações.
- [ ] **T-26** Validar migration do zero e testes afetados em ambiente local.
- [ ] **T-27** Executar teste definido no `package.json`, build e revisão de `git status --short` conforme `docs/rules/checks.md`.
- [ ] **T-28** Conferir CA-01 a CA-09 e corrigir divergências entre implementação, spec e layout.

**Pronto quando:** todos os critérios de aceitação estão cobertos e os checks obrigatórios passam sem alterações fora do escopo.