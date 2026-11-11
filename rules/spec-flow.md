---
description: Fluxo obrigatório para transformar uma especificação em mudança verificável
globs: []
alwaysApply: true
---

# Spec-flow
> leitor: agente · projeto EmpresTI (FutureEmpresTI)

## Objetivo

Toda solicitação de ação ou entrega deve começar com um plano visível e uma
spec, e chegar a uma mudança pequena e validada. Plano e spec são preparação,
nunca substituem a execução. Isso vale para correções,
features, interface, backend, testes, documentação, configuração, pesquisa e
manutenção. Perguntas, brainstorming e pedidos de status sem uma entrega não
exigem arquivo de spec.

Para qualquer tarefa, antes de executar o trabalho ou editar arquivos:

1. Apresente ao usuário um plano curto, com escopo, áreas prováveis, critérios
  de aceite, validação prevista e tarefas em sequência. Ajuste o detalhe à
  solicitação; não é necessário depender de um modo especial da interface.
2. Crie ou atualize primeiro a spec em `docs/specs/`, antes de alterar os demais
  arquivos de entrega. Reutilize a spec existente quando for continuação do
  mesmo trabalho.
3. Mantenha a spec proporcional: registre objetivo, escopo, restrições e
  critérios de aceite; acrescente estados, comportamentos, regras,
  responsividade, riscos e validações quando pertinentes. Mesmo uma correção
  pequena precisa de spec, ainda que breve.

Se uma decisão necessária estiver ambígua, registre a dúvida na spec e pare
para perguntar antes de inventar comportamento.

Antes de iniciar o código, execute o modo `antes-do-codigo` do agente
[`verificador-spec`](../agents/verificador-spec.md), fornecendo o caminho da
spec. Só implemente após o veredito `APTA`; se for `NÃO APTA`, resolva as
lacunas e peça nova revisão. Esse modo revisa a especificação sem verificar
implementação ou testes.

Depois da spec estar `APTA`, execute todas as tarefas aprovadas e acompanhe seu progresso.
Não encerre a resposta apenas com plano, spec ou proposta de implementação.
Respeite a matriz de autorização em [operacao.md](operacao.md): peça
aprovação somente para ações que exigem aprovação e continue as partes
independentes já autorizadas. Se houver bloqueio real, informe-o sem declarar a
tarefa pronta.

## 1. Entender a solicitação

1. Identifique o comportamento pedido, o usuário afetado e o resultado esperado.
2. Localize o ponto mais próximo que controla o comportamento: tela, procedimento,
   service, schema ou migration.
3. Consulte, conforme o caso, o [PRD](../docs/PRD.md), o
   [ADR-001](../docs/adr/001-stack.md), o [layout](../docs/layout.md) e as regras
   relacionadas em `rules/`.
4. Escreva uma hipótese local e um check barato que possa confirmá-la ou
   refutá-la antes da primeira edição.

## 2. Resolver incertezas

- Se o PRD ou `docs/perguntas-prd.md` deixar o comportamento ambíguo, pare,
  formule a pergunta e espere a decisão do time.
- Se a solução contrariar o ADR, descreva a decisão e as alternativas e pare.
- Se a tarefa estiver fora da v1, peça confirmação explícita antes de
  implementar.
- Não invente regras de negócio, permissões, campos, rotas ou mensagens.

## 3. Planejar a mudança

O plano é obrigatório antes de iniciar qualquer tarefa, não apenas antes de
editar mais de um arquivo. Apresente-o ao usuário e inclua:

- arquivos ou áreas prováveis que serão alterados;
- regra de negócio ou critério do PRD atendido;
- critérios de aceite e validação mais direta;
- tarefas em sequência que cubram todo o escopo solicitado;
- riscos, especialmente em auth, tenant, banco e migrations.

Escolha a menor alteração que respeite a arquitetura:

```text
UI -> tRPC router -> service -> Prisma
```

Regras de negócio ficam no service. O router cuida de entrada, contexto e
permissão. A interface não deve ser a única barreira para uma regra.

## 4. Implementar

- Execute todas as tarefas aprovadas do plano; não pare ao criar a spec ou ao
  apresentar uma proposta quando o usuário pediu uma entrega.
- Atualize o progresso durante a execução. Só marque a tarefa como concluída
  quando todos os critérios de aceite aplicáveis estiverem atendidos.
- Se uma aprovação ou decisão necessária bloquear uma etapa, peça somente essa
  decisão, não alegue conclusão e avance no trabalho independente autorizado.
- Siga a matriz de autorização em [operacao.md](operacao.md).
- Preserve APIs públicas e padrões locais quando não houver necessidade de
  alterá-los.
- Valide toda entrada de procedimento com Zod.
- Resolva `tenant_id` no contexto e aplique `tenantProcedure`; nunca aceite o
  tenant vindo do cliente.
- Use `RouterInputs` e `RouterOutputs` inferidos do `AppRouter`.
- Para mudança de schema, pare antes de gerar a migration e siga
  [migration.md](migration.md).
- Para variável nova, siga [rules/secrets.md](secrets.md).
- Para interface, siga o Nocturne em [layout.md](../docs/layout.md).
- Não faça refatorações não relacionadas à tarefa.

## 5. Validar imediatamente

Depois da primeira edição, execute o check mais barato e específico disponível:

1. teste do service ou procedimento tocado;
2. teste de componente ou E2E do fluxo afetado;
3. lint ou typecheck do trecho alterado;
4. `git diff --check`, se não houver comando executável disponível.

Se falhar:

- corrija o mesmo slice e repita o check;
- se a hipótese estiver errada, dê apenas um passo até o código que realmente
  controla o comportamento;
- não amplie a busca antes de resolver essa decisão local.

## 6. Verificação final

Siga a ordem única definida em [checks.md](checks.md), incluindo o reset
de migration antes dos testes quando o schema mudar.

Se scripts ou scaffold ainda não existirem, informe explicitamente os checks
que foram pulados e o motivo. Não declare sucesso como se tivessem passado.

A resposta final deve informar:

- o que mudou;
- quais tarefas e critérios de aceite foram concluídos ou estão bloqueados;
- quais checks foram executados e seus resultados;
- qual item do PRD ou regra de negócio foi atendido;
- riscos ou pendências conhecidas.

## 7. Handoff

Handoff não é automático. Antes de criar ou atualizar qualquer arquivo em
[handoff/](../handoff/), pergunte ao usuário se ele deseja um handoff e espere
confirmação explícita. Depois da confirmação, use o modelo
[handoff/handoff.md](../handoff/handoff.md).

## 8. Depois de implementar: verificar a spec

Depois de implementar e validar os critérios de aceitação, use o modo
`depois-do-codigo` do agente [`verificador-spec`](../agents/verificador-spec.md).
Forneça o caminho da spec e o escopo exato da implementação. O verificador deve
apresentar evidências por critério, conferir testes identificáveis,
implementação, checks aplicáveis e itens fora de escopo. Só declare a spec
pronta quando o veredito for `PRONTA`; se for `NÃO PRONTA` ou houver lacunas,
relate-as e continue o trabalho ou sinalize o bloqueio, sem presumir aprovação.

## Não faça

- Não declare uma tarefa pronta sem validação aplicável.
- Não edite antes de formar uma hipótese local e um check discriminante.
- Não continue buscando indefinidamente depois que o caminho local estiver
  identificado.
- Não use mocks do Prisma para validar constraint, transação, cascade ou RLS.
- Acesso e alterações em ambientes remotos seguem o escopo da tarefa e
  [operacao.md](operacao.md), [secrets.md](secrets.md) e
  [migration.md](migration.md). Deploy e ações destrutivas em produção
  continuam exigindo solicitação explícita.
- Não crie commit sem solicitação explícita.