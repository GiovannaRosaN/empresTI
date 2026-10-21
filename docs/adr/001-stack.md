# ADR-001 — Stack do projeto

**Status:** aceito  
**Contexto do produto:** docs/PRD.md

## Contexto

Sistema web interno de empréstimo de equipamentos. Front, backend e banco.
Time pequeno, prazo curto, nenhum código existente. O banco já estava
decidido: PostgreSQL.

## Decisão

| item | escolha |
|---|---|
| linguagem / runtime | TypeScript em modo `strict` |
| framework do backend | Next.js (App Router) |
| estilo da API | tRPC |
| front | Next.js (App Router), Client Components, Tailwind CSS e shadcn/ui |
| como o front é servido | No mesmo projeto e deploy do servidor, em um monolito de código na Vercel |
| autenticação | Supabase Auth com e-mail e senha, integrado por `@supabase/ssr`, com sessão em cookie `httpOnly` |
| autorização | Middlewares do tRPC: `protectedProcedure`, `tenantProcedure` e `adminProcedure`; RLS habilitado como defesa em profundidade |
| acesso ao banco | Prisma |
| migrations | Prisma Migrate como dono único; RLS, policies e triggers em SQL dentro das migrations |
| testes | Vitest, Testing Library, Testcontainers com Postgres real, `createCaller` do tRPC e Playwright |
| execução local | não decidido |
| banco | PostgreSQL gerenciado pelo Supabase |

## Justificativa

- Linguagem / runtime: sem `strict`, o tipo que vem do tRPC não pega os casos de nulo, que são exatamente os que quebram em produção.
- Framework do backend: o servidor mora no mesmo projeto do front, então a chamada de dados não atravessa domínio nem exige CORS.
- Estilo da API: o tipo do retorno chega na tela sem geração de código nem contrato escrito à mão; para consumidor externo, REST teria de ser exposto ao lado.
- Front: o PRD pede telas com dados e o design vem do Figma; Client Components mantêm um caminho de acesso, enquanto Tailwind e shadcn/ui permitem reproduzir o visual dentro do repositório.
- Como o front é servido: não há equipe separada nem necessidade de escalar front e servidor de forma independente; dois deploys e dois CI adicionariam uma fronteira HTTP para manter.
- Autenticação: não há domínio corporativo para federar; na mesma origem, cookie `httpOnly` evita deixar o token legível por JavaScript.
- Autorização: as regras são estar logado, pertencer ao tenant e ser administrador; três middlewares cobrem isso sem uma camada separada de políticas.
- Acesso ao banco: a tipagem gerada pelo schema reduz divergência entre modelo e código e alimenta o tipo que o tRPC devolve.
- Migrations: dois donos de schema fariam o ambiente divergir de produção; RLS, policies e triggers precisam acompanhar o schema na mesma linha do tempo.
- Testes: vazamento entre tenants é a falha mais cara; Postgres real, contexto de tRPC e navegador verificam banco, permissão e fluxo de uso.
- Execução local: não decidido.
- Banco: PostgreSQL no Supabase já era a decisão; o material também prevê Auth e Storage sem operação própria de servidor de banco.

## Alternativas descartadas

- Front e API em projetos separados — descartado porque criaria fronteira HTTP, CORS e dois deploys sem equipe separada para justificar.
- REST com OpenAPI gerado — descartado porque exigiria geração e cliente versionado que o tRPC dispensa dentro de um projeto só.
- GraphQL — descartado porque o custo de schema, resolver e cache não se paga no volume de telas atual.
- Server Actions para mutação — descartado porque seria um segundo caminho de mutação, com outra validação e outra checagem de permissão.
- Server Components buscando dado direto no Prisma — descartado porque seria um segundo caminho de leitura, com a checagem de tenant duplicada em outro lugar.
- RLS como autorização primária — descartado porque o Prisma bypassa RLS por padrão; fazer valer exigiria transação com `SET LOCAL` a cada request.
- Acesso a dado pelo cliente do Supabase em vez do Prisma — descartado porque espalharia o acesso a dado em dois caminhos e tiraria o tipo do Prisma de dentro do tRPC.
- Cadastro aberto por e-mail — descartado porque, sem domínio corporativo para filtrar, qualquer pessoa com a URL criaria conta.
- SSO corporativo (OIDC/SAML) — descartado porque não há e-mail corporativo para federar.
- Sessão em `localStorage` pelo `supabase-js` — descartada porque é legível por XSS e desnecessária, já que a mesma origem permite cookie `httpOnly`.
- Supabase CLI como dono das migrations — descartado porque dois donos de schema no mesmo banco se sobrescrevem.
- CASL ou biblioteca de política — descartado porque as regras cabem em três middlewares de tRPC; a camada extra seria conceito a mais para aprender.
- Zustand ou Redux — descartados porque o estado de cliente que sobra depois do TanStack Query é pequeno demais.
- Biblioteca de componentes fechada (MUI, Mantine) — descartada porque o design vem do Figma e precisaria ser imposto por cima do visual da biblioteca.
- Fila (BullMQ, pg-boss) — descartada porque não há volume assíncrono conhecido, e worker de vida longa não roda na Vercel.
- Schema ou banco por tenant — descartado porque multiplicaria cada migration pelo número de tenants sem exigência que justifique.
- Prisma mockado nos testes — descartado porque testa o mock; constraint, transação e policy não são exercitadas.

## Consequências

- O que fica mais fácil: mudar o retorno de um procedimento quebra o build da tela na hora; sessão em cookie `httpOnly`, uma feature por PR, um projeto na Vercel, um CI, um runner e deploy atômico ficam concentrados no mesmo codebase.
- O que fica mais difícil: escalar partes de forma independente, manter a fronteira servidor/cliente, aproveitar Server Components, lidar com a latência entre functions nos EUA e banco em São Paulo, absorver cold start, executar operações acima de 60 segundos, fazer trabalho assíncrono e manter middlewares e RLS coerentes.
- O que essa escolha nos impede de fazer depois sem custo: atender consumidores não-TypeScript sem expor REST, usar WebSocket ou streaming, processar tarefas longas, criar fila e worker, separar servidor e front, trocar Prisma, sair do Supabase, adicionar `tenant_id` depois sem backfill ou federar a identidade sem migrar usuários.

## O que este ADR NÃO decide

- Modelagem de domínio, entidades e relacionamentos.
- Design system, tokens e identidade visual.
- Papéis e matriz de permissão dentro de cada tenant.
- Provisionamento de tenant: quem cria e como se convida usuário.
- Provedor de e-mail transacional e demais integrações.
- Estratégia de backup, retenção e plano de recuperação.
- Ambientes, promoção entre ambientes e política de branch.
- Feature flags.
- Observabilidade além de log e erro, como métrica e tracing distribuído.
- LGPD: base legal, política de retenção e fluxo de exclusão de dados.
- SLO, meta de latência e orçamento de custo.
