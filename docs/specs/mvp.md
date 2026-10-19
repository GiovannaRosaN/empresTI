# Spec funcional — EmpresTI v1

**Status:** proposta para implementação  
**Fontes:** [PRD](../PRD.md), [layout](../layout.md), [ADR-001](../adr/001-stack.md)

## Objetivo

Substituir a planilha compartilhada por um fluxo interno em que colaboradores consultam equipamentos, registram empréstimos e devoluções, e Operações acompanha os empréstimos em aberto.

## Usuários e escopo

- **Colaborador:** entra no sistema, consulta o catálogo, solicita equipamento disponível e registra a devolução de item que está com ele; vê os próprios empréstimos.
- **Operações:** consulta todos os empréstimos em aberto, registra devoluções no balcão e cadastra equipamentos.
- A v1 não inclui reservas futuras, notificações por e-mail ou importação da planilha.

O cadastro de usuários, a atribuição do papel de Operações e o provisionamento do primeiro acesso não estão definidos. Não implementar cadastro aberto nem presumir uma forma de conceder esses acessos.

## Regras de negócio

1. Uma pessoa pode manter no máximo três itens emprestados ao mesmo tempo.
2. O prazo padrão de devolução é de 14 dias.
3. Uma pessoa com item em atraso não pode iniciar outro empréstimo.
4. Equipamento em manutenção não pode ser apresentado como disponível nem solicitado.
5. Operações deve poder registrar a devolução no balcão.

Não inferir estados intermediários, cancelamento, tratamento de item danificado, retenção de histórico ou processo de atualização automática de atraso sem a decisão correspondente em [perguntas do PRD](../perguntas-prd.md).

## Telas e rotas

As rotas seguem o [layout](../layout.md), com idioma pt-BR e a identidade visual escura definida nele.

| Tela | Rota | Requisitos funcionais |
|---|---|---|
| Login | `/login` | Entrada com e-mail e senha. Autenticação deve usar Supabase Auth e `@supabase/ssr`, conforme ADR-001. Fluxo de provisionamento ainda depende de decisão. |
| Catálogo | `/catalogo` | Exibir equipamentos e situação; permitir busca/filtro de catálogo; mostrar limite de três, prazo de 14 dias e bloqueio por atraso. Só item disponível pode iniciar solicitação. |
| Detalhe | `/catalogo/:patrimonio` | Exibir estado, descrição e dados do equipamento; para item disponível, apresentar prazo calculado e ação de solicitação. Confirmar antes de registrar o empréstimo. |
| Meus empréstimos | `/meus-emprestimos` | Exibir os empréstimos atuais do usuário, prazo e ação de devolução; oferecer navegação ao catálogo. |
| Empréstimos em aberto | `/operacoes/emprestimos` | Exibir todos os empréstimos abertos para Operações, realçar atrasos e permitir registrar devolução. Acesso restrito ao papel autorizado, cuja atribuição precisa ser definida. |
| Cadastrar equipamento | `/operacoes/equipamentos/novo` | Cadastrar uma unidade física com nome, categoria, patrimônio, número de série, local de retirada, situação inicial e observações. Equipamento em manutenção não aparece como disponível. |

## Fluxos

1. **Solicitar:** catálogo → detalhe de item disponível → confirmação → empréstimo registrado → item passa a indisponível e aparece em Meus empréstimos.
2. **Devolver:** Meus empréstimos ou Empréstimos em aberto → confirmar/registrar devolução → empréstimo deixa de estar em aberto. A próxima situação do equipamento, especialmente quando há dano, depende de decisão.
3. **Cadastrar:** Operações → formulário de equipamento → salvar → equipamento fica registrado com a situação inicial escolhida.

O fluxo de solicitação acima descreve o caminho visual esperado pelo layout; a questão sobre se “solicitar” equivale à retirada física permanece bloqueadora para definir estados e efeitos persistidos.

## Critérios de aceitação

- **CA-01:** usuário autenticado consulta catálogo com situação correta por equipamento.
- **CA-02:** usuário com menos de três itens e sem atraso consegue solicitar equipamento disponível; empréstimo recebe prazo de 14 dias.
- **CA-03:** equipamento indisponível ou em manutenção não pode ser solicitado.
- **CA-04:** usuário que atingiu o limite de três ou possui atraso não consegue iniciar empréstimo e recebe explicação na interface.
- **CA-05:** colaborador consulta apenas os próprios empréstimos e pode registrar devolução do item que está com ele.
- **CA-06:** Operações autorizada consulta todos os empréstimos em aberto e pode registrar devolução.
- **CA-07:** Operações autorizada cadastra uma unidade física com os campos definidos; situação de manutenção não é exibida como disponível.
- **CA-08:** interface implementa as seis telas, rotas, responsividade e tokens definidos no layout, com foco de teclado visível e respeito a `prefers-reduced-motion`.
- **CA-09:** autorização é aplicada nos procedimentos tRPC e protegida em profundidade por RLS, conforme ADR-001 e decisão de tenant/papéis.

## Dependências e decisões pendentes

Antes de fechar os contratos de dados e fluxos, responder às questões 1–5 de [perguntas-prd.md](../perguntas-prd.md): devolução danificada/incompleta; cálculo de atraso; significado de solicitar e possível cancelamento; provisionamento e concessão de acesso; histórico de devoluções.

Também é necessário decidir tenant e matriz de permissões, que o ADR-001 deixa em aberto. Não implementar uma regra provisória para essas lacunas. Alterações de schema devem seguir [rules/migration.md](../rules/migration.md) e usar Prisma Migrate como único dono de migrations.

## Fora desta spec

Reservas futuras, notificações por e-mail, importação de planilha, gestão de usuários, relatórios/histórico não aprovado e qualquer integração não listada no PRD.