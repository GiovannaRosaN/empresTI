# Plano de implementação — EmpresTI v1

**Spec:** [spec funcional](../specs/mvp.md)  
**Base:** PRD, layout e ADR-001

## Estratégia

Implementar em fatias verticais, preservando o monólito Next.js e os contratos TypeScript estritos definidos no ADR. Não iniciar persistência, autorização por tenant ou estados de empréstimo que dependam de decisões ainda abertas. Resolver primeiro as decisões listadas na spec e registrar os resultados antes de construir os contratos afetados.

## Fases

### 0. Decisões de produto e acesso

Resolver as cinco perguntas de `docs/perguntas-prd.md`, além de tenant e matriz de papéis/permissões. Registrar as decisões na documentação apropriada antes de definir o modelo de dados. Esta fase bloqueia o backend funcional e a autenticação/autorização completa.

### 1. Fundação de aplicação

Configurar Next.js App Router, TypeScript `strict`, Tailwind e estrutura de testes conforme ADR-001. Instalar apenas dependências da stack aprovada. Criar layout compartilhado, tokens visuais e componentes base conforme `docs/layout.md`.

### 2. Experiência de colaborador

Implementar login e shell autenticado; catálogo, detalhe e Meus empréstimos; estados de carregamento, vazio e erro; interações de busca/filtro e confirmação. Conectar às operações tipadas tRPC depois que modelos e regras bloqueadas estiverem decididos.

### 3. Experiência de Operações

Implementar lista de empréstimos em aberto, cadastro de equipamento, controles de situação e ações de devolução. Restringir as rotas e procedimentos ao papel autorizado definido na fase 0.

### 4. Dados, segurança e integração

Modelar dados e criar migrations Prisma somente após aprovação dos contratos. Habilitar RLS e policies nas migrations para tabelas sujeitas a usuário/tenant. Implementar procedimentos tRPC com middlewares de autenticação, tenant e administração, além das regras de negócio transacionais.

### 5. Verificação de ponta a ponta

Validar regras com testes unitários e tRPC `createCaller`, persistência com Postgres real/Testcontainers, fluxos com Playwright e build de produção. Validar migration do zero no ambiente local. Não usar banco remoto.

## Critério de conclusão

Todos os CA-01 a CA-09 da spec atendidos, decisões bloqueadoras resolvidas, testes e build aprovados, migration aplicada do zero em banco local quando houver mudança de schema, e `git status --short` revisado conforme `docs/rules/checks.md`.

## Riscos e limites

- As perguntas de negócio e o modelo de tenant/papéis bloqueiam decisões corretas para auth, dados e autorização.
- O repositório ainda não tem aplicação configurada; dependências presentes não equivalem à fundação aprovada.
- A regra de atraso deve ser calculada conforme decisão do time; não assumir job agendado nem definir apenas na interface.
- Conteúdo de demonstração do layout deve ser tratado como referência visual, não como dado real ou seed de produção.