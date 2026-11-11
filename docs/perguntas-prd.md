# Cinco perguntas que o PRD não responde

---

1. O que acontece quando um item é devolvido danificado ou incompleto?
   tipo: negócio
   por que importa: define se o item deve sair do catálogo, ir automaticamente para "em manutenção" ou ficar pendente de uma decisão manual de Operações — muda o fluxo de devolução da v1.

2. Como o sistema calcula que um empréstimo está "em atraso" — verificação diária automática, ou só no momento em que a pessoa tenta pegar outro item?
   tipo: técnica
   por que importa: define se é preciso um job agendado (cron) recalculando status, ou se basta comparar a data de devolução prevista contra a data atual sempre que a informação for consultada.

3. Colaborador pode cancelar uma solicitação antes de retirar o equipamento fisicamente, ou "solicitar" já significa que o item está emprestado?
   tipo: negócio
   por que importa: se existir uma etapa intermediária, o sistema precisa de um estado a mais (solicitado → retirado → devolvido) em vez do simples disponível/emprestado hoje implícito no PRD.

4. Quem cadastra um novo colaborador no sistema e concede a ele acesso — existe uma tela para isso, ou é feito diretamente no banco pela equipe técnica?
   tipo: técnica
   por que importa: se não houver tela de gestão de usuários na v1, isso precisa estar em "O que NÃO entra nesta versão"; caso contrário, é mais uma tela a construir que o PRD não listou.

5. Haverá algum histórico de empréstimos já devolvidos, ou o sistema mostra apenas o estado atual (quem está com o quê agora)?
   tipo: fora de escopo
   por que importa: o PRD não menciona histórico/relatórios, e isso deve ficar escrito explicitamente para não ser implementado "de brinde" junto da tela de Operações, ampliando o escopo da v1 sem necessidade.

## Decisões adotadas para a v1

1. **Dano ou item incompleto:** decisão pendente de aprovação. Não presumir
   condição do equipamento ou ação de Operações nesse caso. A reativação de
   equipamento fora de uso por `ADMIN` permanece uma permissão independente.
2. **Atraso:** calcular sob demanda usando `America/Sao_Paulo`; o dia de
   vencimento permanece no prazo e atraso começa à meia-noite local seguinte.
   Não é necessário job diário.
3. **Solicitação e devolução:** confirmar cria o empréstimo imediatamente; não
   há etapa separada de retirada. O colaborador pode registrar a devolução do
   próprio item, e Operações pode registrar o recebimento no balcão. O registro
   do colaborador é uma declaração no sistema, sem comprovação física.
4. **Acesso:** não há cadastro aberto. Cada identidade autenticada deve ter
   exatamente uma `Membership`; a matriz aprovada e o processo pendente de
   provisionamento estão em `specs/acesso-provisionamento.md`.
5. **Histórico:** manter os empréstimos devolvidos; colaborador vê os próprios
   e `ADMIN` vê empréstimos do próprio tenant.

O prazo da v1 é de **14 dias úteis**, de segunda a sexta sem descontar feriados,
começando no próximo dia útil após a confirmação. Esta decisão complementa o
PRD, que especifica 14 dias sem detalhar dias úteis; a escolha e a premissa de
vencimento no fim do dia estão registradas em `specs/mvp.md` e `ENTREGA.md`.