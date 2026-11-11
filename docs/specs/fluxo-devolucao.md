# Spec: fluxo de devolução da v1

**Status:** parcialmente aprovada para implementação; pendente decisão sobre devolução danificada ou incompleta
**Fontes:** [spec funcional](mvp.md), [modelo de banco](modelo-banco-prd.md), [pergunta 1 do PRD](../perguntas-prd.md)

## Objetivo

Definir o registro da devolução de um equipamento emprestado sem perder o
histórico e sem apresentar como disponível um item que precise de manutenção.

## Decisões já estabelecidas

- A solicitação cria o empréstimo imediatamente; não há reserva ou aprovação
  intermediária.
- O prazo padrão é de 14 dias úteis: a contagem começa no próximo dia útil
  após a confirmação, considerando segunda a sexta e sem descontar feriados.
  A retirada física não reinicia o prazo.
- O vencimento é até o fim do dia na zona `America/Sao_Paulo`; atraso começa à
  meia-noite local do dia seguinte. Essa premissa está aprovada para a prática;
  eventual alteração operacional depende de validação com Operações.
- Empréstimos devolvidos permanecem no histórico.
- O colaborador pode devolver item que está com ele; Operações pode registrar
  devolução no balcão, conforme o PRD.
- O estado “emprestado” do equipamento é derivado de empréstimo aberto; não é
  estado operacional persistido do equipamento.
- O registro do colaborador encerra o empréstimo imediatamente e representa a
  declaração de que a devolução ocorreu; o sistema não comprova a entrega física.
- A devolução normal pelo colaborador ou por Operações encerra o empréstimo.
  O tratamento de dano ou incompletude permanece pendente e não pode ser
  inferido como parte desse fluxo.

## Fluxo de devolução sem dano

1. O colaborador registra a devolução a partir dos próprios empréstimos; ou
   `ADMIN` registra o recebimento no fluxo de Operações e seleciona a condição
   observada.
2. O servidor valida identidade, tenant, papel e propriedade do empréstimo
   conforme a [matriz aprovada](acesso-provisionamento.md).
3. Em uma transação, o servidor marca o empréstimo como devolvido usando
   `returned_at` e preserva seus demais dados para histórico. O registro do
   colaborador não exige confirmação posterior nem evidência física.
4. No fluxo de Operações, a atualização de `returned_at` e da condição do
   equipamento é atômica. O equipamento não fica disponível antes da avaliação.
5. Empréstimo aberto é o registro ainda não devolvido (`returned_at IS NULL`).
   Para devolução registrada pelo colaborador, a disponibilidade continua
   dependendo da condição operacional já registrada.
6. Uma segunda tentativa de devolver o mesmo empréstimo é rejeitada como já
   devolvido; não altera o horário original nem o estado do equipamento.

## Tratamento de dano ou item incompleto

O tratamento de dano ou incompletude está pendente de aprovação. Até que o time
defina o comportamento, não assumir registro de condição por Operações nem
transição para `MAINTENANCE` ou `OUT_OF_SERVICE` nesse fluxo. A reativação de
equipamento `OUT_OF_SERVICE` por `ADMIN` é uma permissão independente e
permanece disponível conforme as regras gerais de equipamento.

## Critérios de aceite

- Devolução válida registra `returned_at` uma única vez e preserva o empréstimo
  para consulta histórica.
- Segunda tentativa de devolver um empréstimo já encerrado retorna erro de
  conflito e não altera dados.
- O colaborador pode encerrar apenas empréstimo próprio; `ADMIN` pode registrar
  devolução normal, sem dano ou incompletude, de qualquer empréstimo aberto do
  próprio tenant e atualizar a condição do equipamento na mesma transação.
- Empréstimo não pode ser devolvido por usuário sem autorização nem atravessar
  tenant.
- Após devolução, equipamento em manutenção ou fora de serviço continua
  indisponível.
- Somente `ADMIN` pode reativar equipamento fora de uso.
- O fluxo de reativação está disponível a `ADMIN` na área de Operações.
- A disponibilidade é consistente mesmo em operações concorrentes.
- Testes cobrem a devolução normal. Testes para dano ou incompletude aguardam
  decisão aprovada e não devem presumir resultados de condição.

## Premissa operacional para validar

O horário de funcionamento e a necessidade de vencer no fechamento do setor
não estão definidos. Para esta prática, o vencimento é até o fim do dia; uma
eventual mudança para o fechamento deve ser validada com Operações.