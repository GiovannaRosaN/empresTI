# Plano de implementação — EmpresTI v1

**Spec:** [spec funcional](../specs/mvp.md)  
**Base:** PRD, layout e ADR-001

## Estratégia

Implementar em fatias verticais, preservando o monólito Next.js e os contratos TypeScript estritos definidos no ADR. As regras de empréstimo, devolução normal e matriz de acesso da v1 estão aprovadas e registradas nas specs; o tratamento de devolução danificada ou incompleta permanece pendente. Não provisionar a conta do professor nem acessar banco remoto. Confirmar que qualquer banco usado em validação é local e isolado.

## Fases

### 0. Decisões de produto e acesso

As decisões aprovadas de prazo, ciclo do empréstimo, devolução normal, histórico, tenant e matriz de acesso estão registradas nas specs; o tratamento de devolução danificada ou incompleta ainda depende de decisão do time. O provisionamento da conta do professor e o processo de produção permanecem fora deste escopo.

### 1. Fundação de aplicação

Configurar Next.js App Router, TypeScript `strict`, Tailwind e estrutura de testes conforme ADR-001. Instalar apenas dependências da stack aprovada. Criar layout compartilhado, tokens visuais e componentes base conforme `docs/layout.md`.

### 2. Experiência de colaborador

Integrar login Supabase para identidades já provisionadas com exatamente uma Membership; catálogo, detalhe e Meus empréstimos; estados de carregamento, vazio e erro; interações de busca/filtro e confirmação. Conectar às operações tipadas tRPC.

### 3. Experiência de Operações

Implementar lista de empréstimos em aberto, cadastro de equipamento, controles de situação e ações de devolução. Restringir as rotas e procedimentos ao papel autorizado definido na spec de acesso.

### 4. Dados, segurança e integração

Alinhar schema e criar migrations Prisma após a aprovação recebida para esta tarefa. Habilitar RLS e policies explícitas; passar user, tenant e papel validados por contexto local de transação. Implementar procedimentos tRPC com middlewares de autenticação, tenant e administração, além das regras de negócio transacionais.

### 5. Verificação de ponta a ponta

Validar regras com testes unitários e tRPC `createCaller`, persistência com Postgres real/Testcontainers, fluxos com Playwright e build de produção. Validar migration do zero no ambiente local. Não usar banco remoto.

## Critério de conclusão

Todos os CA-01 a CA-09 da spec atendidos, decisões bloqueadoras resolvidas, testes e build aprovados, migration aplicada do zero em banco local quando houver mudança de schema, e `git status --short` revisado conforme `../../rules/checks.md`.

## Riscos e limites

- Provisionamento de produção e confirmação do banco local continuam pendentes; não provisionar contas nem executar migrações em ambientes remotos.
- O repositório tem protótipos visuais, mas ainda não tem tRPC conectado ao Prisma.
- A regra de atraso deve ser calculada conforme decisão do time; não assumir job agendado nem definir apenas na interface.
- Conteúdo de demonstração do layout deve ser tratado como referência visual, não como dado real ou seed de produção.