# AGENTS.md

## Visão geral
Este projeto é um sistema web interno para controle de empréstimo de equipamentos. O objetivo principal é substituir a planilha compartilhada por um fluxo de solicitação, acompanhamento, devolução e gestão de itens em uso.

## Contexto e regras de negócio
O comportamento principal do produto está definido em [docs/PRD.md](docs/PRD.md) e deve ser respeitado em qualquer alteração.

- Cada colaborador pode ter no máximo 3 itens emprestados ao mesmo tempo.
- O prazo padrão de devolução é de 14 dias.
- Quem estiver em atraso não pode solicitar novo empréstimo.
- Equipamentos em manutenção não aparecem como disponíveis.
- O fluxo inicial inclui login, catálogo, solicitação, devolução e painel de operações.
- O projeto não deve adicionar funcionalidades fora do escopo da primeira versão sem validação do time.

## Stack esperada
Com base em [docs/adr/001-stack.md](docs/adr/001-stack.md):

- Backend: Next.js (App Router)
- Frontend: Next.js (App Router), Client Components, Tailwind CSS e shadcn/ui
- Banco de dados: PostgreSQL, com Supabase como ambiente de dados e autenticação
- Autenticação: Supabase Auth com e-mail e senha, usando `@supabase/ssr` e cookie `httpOnly`
- API: tRPC
- ORM: Prisma
- Testes: Vitest, Testing Library, Testcontainers com Postgres real, `createCaller` do tRPC e Playwright
- Autorização: middlewares do tRPC (`protectedProcedure`, `tenantProcedure`, `adminProcedure`) e RLS em profundidade

## Estrutura do repositório
- docs/: documentação, PRD e ADRs
- src/: código principal da aplicação
- app/ ou páginas do Next.js: frontend e rotas da aplicação
- server/ ou modules/ (quando existir): lógicas de servidor, tRPC e serviços
- prisma/: schema e migrations do Prisma
- tests/: testes automatizados
- .env.example: variáveis de ambiente de exemplo

## Como rodar o projeto localmente
Antes de qualquer execução, copie o exemplo de ambiente e ajuste os valores locais:

```bash
cp .env.example .env
```

### 1) Subir o banco local
Se o ambiente local seguir o padrão do Supabase:

```bash
supabase start
```

Se usar container PostgreSQL diretamente:

```bash
docker compose up -d postgres
```

### 2) Rodar o projeto
```bash
npm install
npm run dev
```

Se o projeto usar pnpm ou yarn conforme a configuração final do repositório, usar o gerenciador correto que estiver definido no package.json.

### 3) Rodar os testes
```bash
npm run test
```

Ou, se o projeto usar a convenção de testes do Vitest:

```bash
npx vitest
```

### 4) Buildar o projeto
```bash
npm run build
```

## Convenções para agentes e modificações
- Respeitar rigorosamente as regras de negócio documentadas no PRD.
- Não inventar regras de negócio novas sem confirmação do time.
- Priorizar segurança, autenticação e autorização antes de qualquer ajuste funcional.
- Manter a tipagem estrita do TypeScript e evitar `any` sem justificativa.
- Cobrir mudanças relevantes com testes.
- Não expor segredos em código, logs, commits ou arquivos versionados.
- Não executar ações de git sem autorização explícita do usuário.

## Política de Git
- Não fazer `git commit`.
- Não fazer `git push`.
- Não criar branches, merge, tag ou push em nome do usuário sem autorização explícita.
- Qualquer operação de versionamento Git é responsabilidade exclusiva do usuário.

## Validação antes de concluir
Qualquer alteração deve ser validada com pelo menos:

1. execução local relevante;
2. testes afetados;
3. build quando houver mudança estrutural ou de runtime;
4. checagem de que a regra de negócio continua correta.

## Observações finais
Este arquivo serve como guia operacional para agentes e colaboração no projeto. O foco deve sempre ser manter o código alinhado ao PRD, à stack acordada em [docs/adr/001-stack.md](docs/adr/001-stack.md) e às boas práticas de segurança e qualidade.
