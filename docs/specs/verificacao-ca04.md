# Spec focalizada — Verificação do CA-04

**Status:** aprovada para verificação do comportamento de elegibilidade no servidor  
**Fonte:** [spec funcional MVP](mvp.md), CA-04

## Objetivo

Verificar que as regras de elegibilidade usadas pelo router impedem uma nova
solicitação no limite de empréstimos ou quando há atraso e retornam as mensagens
definidas na spec funcional.

## Escopo

- Avaliação de elegibilidade no serviço de regras de empréstimo.
- Uso do resultado de elegibilidade pelos procedimentos `loan.eligibility` e
  `loan.create`.
- Teste unitário local, sem banco, migrations, seeds ou serviços remotos.

Não altera o limite aprovado de três empréstimos. Não inclui outros critérios da
MVP, interface, devolução, tenant, schema ou provisionamento.

## Critério de aceitação

- **CA-04:** menos de três empréstimos ativos e nenhum atraso permitem nova
  solicitação; três ou mais empréstimos ativos bloqueiam com a mensagem
  específica do limite; qualquer atraso bloqueia com a mensagem específica de
  atraso; quando limite e atraso coexistem, as duas mensagens são retornadas.
  O procedimento de criação usa a mesma avaliação para impedir a solicitação.

## Validação

- O teste Vitest deve identificar explicitamente `CA-04` e verificar cada
  resultado e mensagem acima.
- Executar somente os testes locais pertinentes e o typecheck; nenhum check pode
  conectar ou escrever em banco de produção.

## Fora de escopo

Os demais critérios da MVP, UI, banco, concorrência, migrations, seeds e
alterações de negócio além do CA-04.
