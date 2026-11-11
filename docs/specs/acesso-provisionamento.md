# Spec: acesso e provisionamento da v1

**Status:** matriz e regra de membership aprovadas para a v1; provisionamento de produção ainda pendente
**Fontes:** [spec funcional](mvp.md), [modelo de banco](modelo-banco-prd.md), [ADR-001](../adr/001-stack.md)

## Objetivo

Definir como identidades Supabase Auth são vinculadas a tenants e papéis e como
o servidor restringe cada operação ao usuário e tenant autorizados.

## Decisões já estabelecidas

- Supabase Auth é a autoridade de identidade; `Membership.user_id` guarda o UUID
  correspondente, sem duplicar credenciais ou usuários no modelo de domínio.
- Os papéis do modelo são `COLLABORATOR` e `ADMIN`.
- Para a v1, cada identidade autenticada deve ter exatamente uma `Membership`.
  Sem membership ou com mais de uma, o acesso é recusado; não há seleção de
  tenant na interface.
- `COLLABORATOR` pode consultar, solicitar e devolver apenas os próprios
  empréstimos. `ADMIN` pode consultar empréstimos do próprio tenant, registrar
  devoluções no balcão e cadastrar equipamentos no próprio tenant. Gestão de
  usuários e consulta de audit log permanecem fora do escopo.
- Não há cadastro público aberto na v1. A tela, o responsável e o processo de
  provisionamento de produção continuam fora desta decisão.
- O tenant `suporte_ti` é o tenant de desenvolvimento definido para os dados
  locais. Isso não aprova nem autoriza criar contas ou dados no Supabase remoto.
- A conta do professor deve permanecer com zero empréstimos. Testes dos fluxos
  devem usar uma conta secundária, separada da identidade de produção.

## Matriz de acesso aprovada

Esta matriz aplica os fluxos do PRD à v1.

| Recurso/operação | COLLABORATOR | ADMIN |
|---|---|---|
| Consultar equipamentos | Leitura no próprio tenant | Leitura no próprio tenant |
| Cadastrar equipamentos e alterar condição operacional | Negado | Permitido no próprio tenant |
| Consultar empréstimos | Apenas os próprios | Todos do próprio tenant |
| Criar empréstimo | Próprio usuário, sujeito às regras do modelo | Não permitido como operação administrativa |
| Registrar devolução | Apenas empréstimo próprio | Qualquer empréstimo do próprio tenant |
| Gerir usuários e memberships | Negado | Fora do escopo da v1 |
| Consultar audit log | Negado; não há procedimento na v1 | Negado; não há procedimento na v1 |

## Contexto confiável e RLS

1. O servidor valida a sessão Supabase Auth e carrega `Membership` pelo UUID
   autenticado. Não aceita `user_id`, papel ou tenant como autoridade enviados
   pelo navegador.
2. O tenant e o papel efetivos são derivados da única membership validada. Se
   houver zero ou mais de uma membership, negar o acesso; não escolher um
   tenant por ordem ou por valor enviado pelo cliente.
3. Antes de consultar `Membership`, o servidor valida a sessão Supabase e
   define `app.user_id` localmente à transação com o UUID autenticado. Depois de
   carregar a única membership, define `app.tenant_id` e `app.role` com valores
   derivados dela. Nunca aceita esses valores do navegador. As policies usam
   esses valores de transação para separar usuários e tenants.
4. As policies devem ser explícitas por tabela e operação na migration. O papel
   usado pela aplicação não pode ter `BYPASSRLS`. Prisma não substitui a
   autorização da aplicação; procedures e services aplicam a matriz aprovada,
   e RLS reforça o isolamento conforme o ADR-001.
5. `AuditLog` é append-only conforme o modelo de banco, mas não é exposto nem
   consultável por usuários na v1. O serviço de empréstimos desta entrega não
   lê nem grava eventos de auditoria.

## Provisionamento de teste

- Criar contas de teste somente no Supabase local, usando uma interface/API
  suportada pelo Supabase Auth; não inserir diretamente em tabelas internas de
  autenticação.
- Para a conta local do professor definida em
  [Spec 002 — dados iniciais](002-dados-iniciais.md), usar a Supabase Auth Admin
  API local com `SUPABASE_SERVICE_ROLE_KEY` somente no ambiente local. Ler a
  senha de `TEACHER_SEED_PASSWORD`, também configurada somente localmente. Não
  imprimir esses valores.
- Localizar/criar a identidade pelo e-mail com a API Admin e criar/atualizar a
  membership local de forma idempotente pelo UUID retornado, no tenant de teste
  e papel definidos na Spec 002.
- Não registrar senhas, tokens ou service role em arquivos versionados, logs ou
  respostas. Não usar seed para criar contas em ambiente remoto.
- A execução do seed exige que o destino de banco e a URL do Supabase sejam
  `localhost`, `127.0.0.1` ou `::1`; destinos remotos são recusados.

## Conta do professor em produção

- O provisionamento da identidade no Supabase Auth não completa o acesso à
  aplicação: a identidade precisa ser vinculada a uma `Membership` com tenant e
  papel aprovados.
- O provisionamento solicitado não deve ser executado em produção até que
  ambiente, tenant, papel e processo para criar a `Membership` sejam aprovados;
  não presumir valores nem usar o seed para contornar essa lacuna.
- A senha não pode ser gravada em seed, código, logs ou arquivos versionados.
- Não executar o seed atual em produção. A conta do professor não deve ser
  usada para empréstimos nem para testes de fluxo.

## Critérios de aceite

- A aplicação aplica a matriz aprovada acima e recusa usuários sem exatamente
  uma membership.
- Usuário não autenticado, usuário sem membership e usuário de outro tenant não
  acessam dados protegidos.
- Colaborador não consulta empréstimos de outra pessoa; `ADMIN` não acessa outro
  tenant.
- Policies RLS e verificações de procedures/services concordam com a matriz e
  são testadas com PostgreSQL local.
- Contas de teste e memberships são criadas somente em ambiente local e de modo
  repetível.

## Decisões pendentes

1. Definir quem provisiona usuários de produção e como concede/revoga `ADMIN`.
2. O destino local do `.env` foi confirmado para a tarefa da Spec 002; antes de
   cada seed, migration ou teste que acesse o banco, validar novamente que os
   endpoints de banco e Supabase são locais.

## Não faça

- Não implemente cadastro público, autoatribuição de `ADMIN` ou gerenciamento de
  usuários sem decisão aprovada.
- Não confie em IDs, papéis ou tenant enviados pelo cliente.
- Não use credencial privilegiada para contornar policy ou testar banco remoto.