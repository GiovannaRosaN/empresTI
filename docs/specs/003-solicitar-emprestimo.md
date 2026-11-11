# Spec 003 — Solicitar empréstimo

**Revisão pré-código:** APTA; segue o limite vigente de três itens do PRD.
**Revisão pós-código:** NÃO PRONTA. Na revisão de 2026-11-11, EMP-CA-02,
EMP-CA-03, EMP-CA-04 e EMP-CA-05 foram considerados atendidos por testes
unitários/procedimento. EMP-CA-01 não comprova persistência e indisponibilidade;
faltam evidências de concorrência em PostgreSQL para EMP-CA-06 e cobertura
completa de isolamento e interface para EMP-CA-07 a EMP-CA-09.
**Fontes:** [PRD](../PRD.md), [spec funcional](mvp.md),
[modelo de banco](modelo-banco-prd.md), [acesso e provisionamento](acesso-provisionamento.md)
e [ADR-001](../adr/001-stack.md)

## Objetivo

Permitir ao colaborador solicitar equipamento disponível pelo catálogo,
respeitando elegibilidade, prazo, autorização, concorrência e tenant.

## Regras de negócio

- O limite é de três empréstimos abertos simultâneos por pessoa, conforme
  PRD/AGENTS.md. Equipamentos em manutenção ou fora de uso não podem ser
  solicitados.
- Usuário com um ou mais empréstimos em atraso não pode solicitar outro.
- Ao atingir o limite, exibir: “Você atingiu o limite de 3 empréstimos ativos.
  Devolva um item antes de solicitar outro.”
- Quando houver atraso, exibir: “Você possui empréstimos em atraso. Regularize
  as devoluções antes de solicitar outro equipamento.” Se limite e atraso se
  aplicam, exibir ambas as mensagens.
- Empréstimo é criado imediatamente após a confirmação; não há reserva ou
  aprovação intermediária.
- O prazo é de 14 dias úteis. O dia da confirmação não conta; a contagem começa
  no próximo dia útil, considerando segunda a sexta-feira, sem descontar
  feriados. O vencimento é ao fim do dia em `America/Sao_Paulo`; o atraso começa
  à meia-noite local do dia seguinte. A retirada física não reinicia a contagem.
- A solicitação deve ocorrer em transação. As criações concorrentes para uma
  pessoa são serializadas por advisory lock transacional derivado do UUID do
  usuário autenticado. A membership é revalidada dentro da transação sob RLS;
  não se adiciona permissão de UPDATE à tabela `memberships` só para obter um
  bloqueio de linha. Um item não pode ter mais de um empréstimo aberto.
- O servidor deriva usuário, tenant e papel da sessão e membership; não aceita
  esses valores do cliente.

## Interface

- O catálogo apresenta equipamentos, disponibilidade e busca/filtro; só
  equipamentos disponíveis permitem iniciar a solicitação.
- A confirmação cria o empréstimo e o equipamento passa a indisponível.
- “Meus Empréstimos” lista apenas os empréstimos do usuário autenticado, prazo,
  situação de atraso e ação de devolução existente.
- A interface informa o limite de três e o bloqueio por atraso, sem substituir
  a validação do servidor.

## Critérios de aceite

- **EMP-CA-01:** usuário elegível com menos de três empréstimos em aberto e sem
  atraso consegue solicitar equipamento disponível; a operação cria um
  empréstimo aberto e indisponibiliza o equipamento.
- **EMP-CA-02:** a validação recusa equipamento emprestado, em manutenção ou
  fora de uso e não cria empréstimo.
- **EMP-CA-03:** usuário com três empréstimos em aberto não consegue solicitar
  outro; a resposta apresenta “Você atingiu o limite de 3 empréstimos ativos.
  Devolva um item antes de solicitar outro.”
- **EMP-CA-04:** usuário com empréstimo atrasado não consegue solicitar outro;
  a resposta apresenta “Você possui empréstimos em atraso. Regularize as
  devoluções antes de solicitar outro equipamento.” Se limite e atraso se
  aplicam, ambas as mensagens são apresentadas.
- **EMP-CA-05:** prazo cobre 14 dias úteis, começando no próximo dia útil, sem
  feriados, e aplica o fuso `America/Sao_Paulo`, inclusive em fins de semana e
  virada de mês/ano.
- **EMP-CA-06:** solicitações concorrentes não permitem ultrapassar três
  empréstimos abertos por usuário nem criar dois empréstimos abertos para o
  mesmo equipamento. Solicitações da mesma identidade são serializadas com
  advisory lock transacional, sem depender de policy ou privilégio de UPDATE
  em `memberships`.
- **EMP-CA-07:** colaborador consulta apenas seus empréstimos; nenhum dado ou
  identidade enviados pelo cliente permitem atravessar usuário ou tenant.
- **EMP-CA-08:** catálogo e “Meus Empréstimos” usam os resultados do servidor e
  refletem disponibilidade, limite, atraso e confirmação sem dados fictícios.
- **EMP-CA-09:** testes identificáveis pelos IDs acima cobrem service/API e
  telas pertinentes, incluindo concorrência em PostgreSQL real.

## Implementação e validação

- Respeitar o ADR-001: UI → tRPC router → service → Prisma, com Zod,
  `tenantProcedure` e autorização no servidor.
- Adquirir advisory lock transacional derivado do UUID autenticado antes de
  revalidar a membership e contar empréstimos abertos; manter também a
  constraint/índice transacional para empréstimo aberto único por equipamento.
- Testar com PostgreSQL local real; não usar mocks para concorrência ou
  integridade.
- Alterações de schema exigem DDL e impacto descritos e aprovação antes de
  gerar migration, conforme `rules/migration.md`.
- Não executar migrations ou testes contra banco remoto.

### Evidência adicional

- Em 2026-11-11 foram adicionados testes de `createCaller` para criação por
  colaborador elegível e rejeições por limite, atraso e manutenção, além de um
  caso de cálculo do prazo na virada do ano. Esses testes não verificam RLS,
  constraints, concorrência ou comportamento visual; a revisão permanece
  `NÃO PRONTA` até haver evidência para todos os critérios.

## Fora de escopo

Alterar limite para cinco, reserva futura, notificações, gestão de usuários,
alteração do fluxo de devolução ou provisionamento de produção.
