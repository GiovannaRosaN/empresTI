# Spec funcional — EmpresTI v1

**Status:** aprovada para implementação; pendentes apenas as decisões explicitamente listadas abaixo
**Fontes:** [PRD](../PRD.md), [layout](../layout.md), [ADR-001](../adr/001-stack.md)

## Objetivo

Substituir a planilha compartilhada por um fluxo interno em que colaboradores consultam equipamentos, registram empréstimos e devoluções, e Operações acompanha os empréstimos em aberto.

## Usuários e escopo

- **Colaborador:** entra no sistema, consulta o catálogo, solicita equipamento disponível e registra a devolução de item que está com ele; vê os próprios empréstimos.
- **Operações:** consulta todos os empréstimos em aberto do próprio tenant, registra devoluções no balcão e cadastra equipamentos.
- A v1 não inclui reservas futuras, notificações por e-mail ou importação da planilha.

O cadastro de usuários e o provisionamento de produção continuam pendentes. Não implementar cadastro aberto nem presumir uma forma de conceder acessos; consulte a [spec de acesso e provisionamento](acesso-provisionamento.md).

## Regras de negócio

1. Uma pessoa pode manter no máximo três itens emprestados ao mesmo tempo.
2. O prazo padrão de devolução é de 14 dias úteis, contando de segunda a
   sexta-feira sem descontar feriados. A contagem começa no próximo dia útil
   depois da confirmação; esse é o dia 1. O vencimento é até o fim desse dia em
   `America/Sao_Paulo`; o atraso começa à meia-noite local do dia seguinte. A
   retirada física não reinicia a contagem.
3. Uma pessoa com item em atraso não pode iniciar outro empréstimo.
4. Equipamento em manutenção ou fora de uso não pode ser apresentado como disponível nem solicitado. `ADMIN` pode reativar item fora de uso na área de Operações.
5. Operações deve poder registrar a devolução no balcão, conforme a matriz de acesso aprovada na [spec de acesso](acesso-provisionamento.md).

As decisões de criação imediata do empréstimo, cálculo do atraso e retenção do histórico estão detalhadas na [spec do modelo de banco](modelo-banco-prd.md). Operações avalia a condição do equipamento ao registrar o recebimento, conforme a [spec de devolução](fluxo-devolucao.md).

## Telas e rotas

As rotas seguem o [layout](../layout.md), com idioma pt-BR e a identidade visual escura definida nele.

| Tela | Rota | Requisitos funcionais |
|---|---|---|
| Login | `/login` | Entrada com e-mail e senha via Supabase Auth e `@supabase/ssr`, conforme ADR-001. A identidade precisa ter exatamente uma `Membership`; não há cadastro aberto. |
| Catálogo | `/catalogo` | Exibir equipamentos e situação; permitir busca/filtro de catálogo; mostrar limite de três, prazo de 14 dias úteis e bloqueio por atraso. Só item disponível pode iniciar solicitação. |
| Detalhe | `/catalogo/:patrimonio` | Exibir estado, descrição e dados do equipamento; para item disponível, apresentar prazo calculado e ação de solicitação. Confirmar antes de registrar o empréstimo. |
| Meus empréstimos | `/meus-emprestimos` | Exibir os empréstimos atuais do usuário, prazo e ação de devolução; oferecer navegação ao catálogo. |
| Empréstimos em aberto | `/operacoes/emprestimos` | Exibir todos os empréstimos abertos do próprio tenant para `ADMIN`, realçar atrasos e permitir registrar devolução. |
| Cadastrar equipamento | `/operacoes/equipamentos/novo` | Permitir que `ADMIN` cadastre uma unidade física no próprio tenant com nome, categoria, patrimônio, número de série, local de retirada, situação inicial e observações; também permite reativar um equipamento `OUT_OF_SERVICE`. Equipamento em manutenção não aparece como disponível. |

## Fluxos

1. **Solicitar:** catálogo → detalhe de item disponível → confirmação → empréstimo criado imediatamente → item passa a indisponível e aparece em Meus empréstimos. Não há reserva ou aprovação intermediária, conforme a spec do modelo de banco.
2. **Devolver:** colaborador registra a devolução normal do próprio item em Meus empréstimos; ou Operações registra o recebimento sem dano ou incompletude, escolhe a condição observada e encerra o empréstimo na mesma transação. O tratamento de devolução danificada ou incompleta permanece pendente. A declaração do colaborador não comprova entrega física nem altera a condição operacional. Uma segunda tentativa de devolver o mesmo empréstimo é rejeitada sem alterar o registro original.
3. **Cadastrar:** Operações → formulário de equipamento → salvar → equipamento fica registrado com a situação inicial escolhida. Somente `ADMIN` pode reativar um equipamento `OUT_OF_SERVICE`.

O prazo é de 14 dias úteis e o atraso segue o calendário de
`America/Sao_Paulo`, conforme a [spec do modelo de banco](modelo-banco-prd.md).
O horário de funcionamento do setor não está definido. Para esta prática, está
aprovado considerar o fim do dia como vencimento; validar eventual mudança com
Operações antes de adotá-la como política operacional. Não criar estados de
solicitação, retirada ou atraso além dos ali definidos.

## Critérios de aceitação

- **CA-01:** usuário autenticado consulta catálogo com situação correta por equipamento.
- **CA-02:** usuário com menos de três itens e sem atraso consegue solicitar equipamento disponível; empréstimo recebe prazo de 14 dias úteis, calculado conforme as regras de calendário e fuso desta spec. Solicitações concorrentes não permitem ultrapassar três empréstimos abertos.
- **CA-03:** equipamento emprestado, em manutenção ou fora de uso não pode ser solicitado nem apresentado como disponível.
- **CA-04:** usuário que atingiu o limite de três ou possui atraso não consegue iniciar empréstimo e recebe a mensagem específica “Você atingiu o limite de 3 empréstimos ativos. Devolva um item antes de solicitar outro.” para o limite e “Você possui empréstimos em atraso. Regularize as devoluções antes de solicitar outro equipamento.” para atraso; quando as duas condições se aplicam, ambas são apresentadas.
- **CA-05:** colaborador consulta apenas os próprios empréstimos e pode registrar devolução do item que está com ele.
- **CA-06:** `ADMIN` consulta os empréstimos em aberto do próprio tenant e pode registrar devolução de qualquer um deles.
- **CA-07:** `ADMIN` cadastra equipamento no próprio tenant e pode reativar equipamento fora de uso. Ao registrar uma devolução normal, sem dano ou incompletude, Operações escolhe a condição do item na mesma transação. O tratamento de devolução danificada ou incompleta permanece pendente e não pode ser inferido. Equipamento em manutenção ou fora de uso não aparece como disponível.
- **CA-08:** interface implementa as seis telas, rotas, responsividade e tokens definidos no layout, com foco de teclado visível e respeito a `prefers-reduced-motion`. Validar em larguras de 360, 768 e 1280 px, sem rolagem horizontal, conteúdo essencial cortado ou controles sobrepostos.
- **CA-09:** autorização é aplicada nos procedimentos tRPC conforme a matriz aprovada; o usuário só acessa dados do tenant de sua única `Membership`, e conta sem exatamente uma membership é recusada. RLS permanece exigida como defesa em profundidade conforme ADR-001.

## Dependências e decisões pendentes

As questões sobre cálculo de atraso, significado da solicitação e retenção do histórico foram resolvidas na spec de [modelo de banco](modelo-banco-prd.md). O tratamento da condição em devoluções normais, sem dano ou incompletude, está definido na spec de [devolução](fluxo-devolucao.md); o tratamento de itens danificados ou incompletos permanece pendente de decisão. A matriz de acesso e a regra de uma única membership por identidade estão aprovadas na [spec de acesso](acesso-provisionamento.md). O provisionamento de produção permanece pendente.

O provisionamento de produção e a configuração de conexão local continuam sujeitos às pendências da [spec de acesso](acesso-provisionamento.md). Alterações de schema devem seguir [rules/migration.md](../../rules/migration.md) e usar Prisma Migrate como único dono de migrations.

## Fora desta spec

Reservas futuras, notificações por e-mail, importação de planilha, gestão de usuários, relatórios e qualquer integração não listada no PRD.