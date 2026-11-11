# Tasks — EmpresTI v1

Tasks derivadas de [spec funcional](../specs/mvp.md) e [plano](../plans/mvp.md). As tasks bloqueadas não devem ser iniciadas até que suas dependências sejam decididas.

## Fase 0 — Decisões

- [ ] **T-01** Obter decisão do time sobre o tratamento de devolução danificada ou incompleta. Não presumir a condição do equipamento nem o fluxo de Operações nesse caso. A reativação por `ADMIN` permanece independente. Referência: `docs/specs/fluxo-devolucao.md`.
- [x] **T-02** Decidir quando e como um empréstimo passa a atrasado. O prazo é de 14 dias úteis, sem feriados; vencimento até o fim do dia em `America/Sao_Paulo`, atraso a partir da meia-noite local seguinte. Referência: `docs/specs/modelo-banco-prd.md`.
- [x] **T-03** Definir se solicitação é empréstimo imediato ou se existe etapa de retirada/cancelamento. Decisão registrada em `docs/specs/modelo-banco-prd.md`: a confirmação cria o empréstimo imediatamente; não há etapa de retirada/cancelamento e a retirada física não reinicia o prazo. Referência: pergunta 3 do PRD.
- [ ] **T-04** Definir quem provisiona usuários de produção e como concede/revoga `ADMIN`. Essa pendência não autoriza provisionar a conta do professor. Referência: `docs/specs/acesso-provisionamento.md`.
- [x] **T-05** Decidir retenção e visibilidade do histórico de devoluções. Empréstimos devolvidos permanecem no histórico; colaborador vê os próprios, `ADMIN` os do tenant. Referência: `docs/specs/modelo-banco-prd.md`, `docs/specs/acesso-provisionamento.md`.
- [x] **T-06** Definir tenant, papéis e matriz de permissões: cada identidade tem exatamente uma Membership; colaborador acessa os próprios empréstimos; `ADMIN` gerencia equipamentos e empréstimos do próprio tenant. Referência: `docs/specs/acesso-provisionamento.md`.

**Pronto quando:** decisões estiverem registradas e permitirem definir entidades, transições de estado e limites de acesso sem suposições.

## Fase 1 — Fundação

- [ ] **T-07** Inicializar Next.js App Router e TypeScript em modo `strict`, preservando arquivos e dependências do usuário.
- [ ] **T-08** Configurar Tailwind e estrutura de estilos/componentes alinhada ao stack aprovado e ao layout.
- [ ] **T-09** Configurar Vitest, Testing Library e comandos de teste/build no `package.json`.
- [ ] **T-10** Implementar shell responsivo com sidebar, navegação, header e tokens visuais definidos em `docs/layout.md`.

**Pronto quando:** aplicação inicia e builda; navegação compartilhada tem estados de foco acessíveis e funciona em viewport móvel e desktop.

## Fase 2 — Colaborador

- [ ] **T-11** Implementar `/login` usando Supabase Auth e `@supabase/ssr`; somente identidades provisionadas com Membership podem acessar.
- [ ] **T-12** Implementar `/catalogo` com busca, filtros, situação e aviso das regras aprovadas.
- [ ] **T-13** Implementar `/catalogo/:patrimonio` com estado do item, dados técnicos e confirmação de solicitação.
- [ ] **T-14** Implementar `/meus-emprestimos` com prazo, limite visual e ação de devolução.
- [ ] **T-15** Implementar testes de regras para limite, prazo, bloqueio por atraso e indisponibilidade, conforme decisões aprovadas de T-02 e T-03; cobrir T-01 após aprovação.

**Pronto quando:** CA-01 a CA-05 passam, incluindo autorização para dados próprios.

## Fase 3 — Operações

- [ ] **T-16** Implementar `/operacoes/emprestimos` com filtros, tabela, métricas e tratamento visual de atraso.
- [ ] **T-17** Implementar `/operacoes/equipamentos/novo` com validação e situações iniciais permitidas.
- [ ] **T-18** Implementar devolução normal por Operações, respeitando T-03; não definir tratamento de dano ou incompletude enquanto T-01 estiver pendente.
- [ ] **T-19** Proteger páginas e procedimentos de Operações conforme T-04 e T-06.

**Pronto quando:** CA-06 e CA-07 passam para usuário autorizado e acesso não autorizado é negado.

## Fase 4 — Persistência e segurança

- [ ] **T-20** Alinhar schema Prisma ao modelo: patrimônio único por tenant e empréstimo aberto definido por `returned_at IS NULL`.
- [ ] **T-21** Criar migration Prisma autorizada, com índices, remoção de `Loan.status` e RLS/policies necessárias.
- [ ] **T-22** Implementar contexto tRPC e middlewares `protectedProcedure`, `tenantProcedure` e `adminProcedure`; contexto DB usa apenas user/tenant/papel validados.
- [ ] **T-23** Implementar operações de catálogo, solicitação, consulta pessoal, devolução, operações e cadastro através do tRPC.
- [ ] **T-24** Testar isolamento e regras usando `createCaller` e Postgres real/Testcontainers.

**Pronto quando:** comportamento funcional não depender apenas de estado local/visual e as regras forem garantidas no servidor e banco.

## Fase 5 — Aceitação

- [ ] **T-25** Cobrir os fluxos críticos com Playwright: login, pedido, bloqueios, devolução e Operações.
- [ ] **T-26** Validar migration do zero e testes afetados em ambiente local.
- [ ] **T-27** Executar teste definido no `package.json`, build e revisão de `git status --short` conforme `../../rules/checks.md`.
- [ ] **T-28** Conferir CA-01 a CA-09 e corrigir divergências entre implementação, spec e layout.

**Pronto quando:** todos os critérios de aceitação estão cobertos e os checks obrigatórios passam sem alterações fora do escopo.