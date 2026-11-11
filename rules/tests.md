# Plano de testes — EmpresTI

Este documento define a estratégia de testes para o repositório.

## Objetivo

Garantir que a v1 permita controlar empréstimos de equipamentos com segurança,
sem vazamento entre tenants e sem substituir as regras de negócio por validações
apenas na interface.

A cobertura deve priorizar os caminhos críticos do PRD, e não um percentual
arbitrário de cobertura.

## Escopo da v1

Os testes devem cobrir:

- login e sessão autenticada;
- catálogo com a situação dos equipamentos;
- solicitação de equipamento disponível;
- devolução de equipamento pelo colaborador;
- registro de devolução pela Operações;
- cadastro de equipamentos pela Operações;
- visualização dos empréstimos em aberto;
- limite de 3 empréstimos ativos por pessoa;
- prazo padrão de 14 dias úteis, começando no próximo dia útil após a
  confirmação, sem descontar feriados;
- bloqueio de nova solicitação quando existe atraso;
- ocultação de equipamentos em manutenção;
- isolamento entre tenants;
- controle de permissões por papel.

Não criar testes para reserva futura, notificação por e-mail ou importação da
planilha, pois estão fora do escopo da v1.

## Estratégia

### Testes de service

Usar Vitest para testar as regras de negócio sem montar HTTP ou interface.
Os testes de banco devem usar PostgreSQL real via Testcontainers, porque mocks
não validam constraints, transações, cascades ou RLS.

Casos mínimos:

- cria empréstimo para equipamento disponível;
- rejeita empréstimo para equipamento emprestado;
- rejeita empréstimo para equipamento em manutenção;
- rejeita o quarto empréstimo ativo;
- rejeita solicitação de usuário com item atrasado;
- calcula a devolução prevista em 14 dias úteis;
- conta o próximo dia útil após a confirmação como dia 1, inclusive quando a
  confirmação ocorre antes de um fim de semana, sem descontar feriados;
- considera o empréstimo no prazo durante todo o dia do vencimento em
  `America/Sao_Paulo` e atrasado a partir da meia-noite local seguinte;
- registra devolução e libera o equipamento;
- não permite devolver empréstimo de outro usuário;
- permite que Operações registre a devolução no balcão;
- mantém o seed do tenant `suporte_ti` idempotente.

### Testes de procedimentos tRPC

Usar `createCaller` com contextos montados para testar entrada, autenticação,
tenant e autorização sem subir o servidor HTTP.

Para cada procedimento de domínio, deve existir pelo menos um teste de
isolamento: um usuário do tenant A não pode ler, alterar, devolver ou listar
dados do tenant B.

Verificar também:

- usuário anônimo recebe erro de autenticação;
- colaborador não acessa procedimentos administrativos;
- administrador acessa cadastro de equipamento e devolução no balcão;
- `tenant_id` é obtido do contexto, nunca do input;
- entradas inválidas são rejeitadas pelo schema Zod;
- erros retornam códigos `TRPCError` tratáveis pela interface.

### Testes de componentes

Usar Testing Library para estados e interações que mudam o comportamento da
interface:

- catálogo mostra Disponível, Emprestado e Manutenção corretamente;
- botão de solicitação fica indisponível para item não disponível;
- contador de empréstimos mostra a situação até 3 itens;
- atraso exibe bloqueio de nova solicitação;
- formulário de equipamento mostra erros de validação;
- colaborador vê apenas os próprios empréstimos;
- Operações vê os empréstimos em aberto;
- loading, erro e estado vazio são exibidos sem quebrar o layout.

Não testar detalhes internos de implementação ou snapshots extensos.

### Testes E2E

Usar Playwright para os fluxos que impedem a Operações de abandonar a
planilha. Cada teste deve preparar seus dados e terminar sem depender da ordem
de execução de outro teste.

Fluxos críticos:

1. colaborador faz login, abre o catálogo e solicita um item disponível;
2. colaborador consulta o próprio empréstimo e devolve o item;
3. Operações cadastra um equipamento disponível;
4. Operações visualiza empréstimos em aberto e registra uma devolução;
5. usuário com três empréstimos não consegue solicitar o quarto;
6. usuário com item atrasado não consegue solicitar outro;
7. equipamento em manutenção não aparece como disponível;
8. colaborador não acessa a tela de Operações;
9. dados de um tenant não aparecem para outro tenant.

## Dados de teste

Usar identificadores explícitos para evitar ambiguidade:

- tenant A: `suporte_ti`;
- tenant B: `outro_tenant`;
- colaborador A e colaborador B, em contas de teste distintas da conta de produção do professor;
- administrador de Operações;
- equipamento disponível;
- equipamento emprestado;
- equipamento em manutenção;
- empréstimo ativo dentro do prazo;
- empréstimo com vencimento hoje ainda no prazo;
- empréstimo atrasado a partir da meia-noite local seguinte ao vencimento.

Os fixtures devem ser criados por helpers ou seed de teste e limpos ao final.
Nunca usar credenciais, tokens ou chaves reais nos testes.
Os fluxos de teste não devem usar a conta do professor: ela deve permanecer com
zero empréstimos.

## Organização sugerida

```text
src/
  server/
    services/**/*.test.ts
    api/routers/**/*.test.ts
  components/**/*.test.ts

tests/
  e2e/**/*.spec.ts
  fixtures/
```

A localização final deve seguir a configuração do Vitest e do Playwright,
sem duplicar tipos de entrada ou saída do AppRouter.

## Comandos de verificação

Quando o scaffold existir, executar na ordem definida em `rules/checks.md`:

```bash
npm test
npx prisma migrate reset --force   # somente se schema ou migration mudou
npm run lint
npm run build
git status --short
```

Para os testes E2E, usar o comando definido no `package.json`, normalmente:

```bash
npx playwright test
```

A tarefa só pode ser declarada pronta quando os comandos aplicáveis terminarem
sem erro e o `git status --short` mostrar apenas arquivos da tarefa.

## Critérios de aprovação

- Todos os itens obrigatórios do PRD têm pelo menos um teste de comportamento.
- As quatro regras de negócio estão cobertas por testes positivos e negativos.
- Todo procedimento de domínio tem teste de isolamento entre tenants.
- Não há teste que dependa de mock do Prisma para validar banco, transação,
  constraint, cascade ou RLS.
- Não há segredo em fixture, teste, log ou arquivo versionado.
- Testes falhos impedem a declaração de tarefa concluída.

## Situação atual do repositório

O scaffold da aplicação e os scripts de teste ainda não estão presentes. Até a
criação de `package.json`, Vitest, Playwright, Prisma e Testcontainers, os
comandos acima devem ser tratados como especificação de verificação, não como
checks já executados.