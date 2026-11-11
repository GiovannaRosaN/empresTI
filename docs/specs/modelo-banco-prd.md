# Spec: modelo de banco da v1

## Objetivo

Definir o modelo relacional da v1 de empréstimo de equipamentos, conforme o
PRD e o ADR-001, preservando isolamento por tenant e o histórico de devoluções.

## Escopo

- Entidades: `Tenant`, `Membership`, `Equipment`, `Loan` e `AuditLog`.
- `Tenant`: identificador, nome e slug único.
- `Membership` relaciona o UUID de Supabase Auth ao tenant e ao papel
  (`COLLABORATOR` ou `ADMIN`). Cada identidade autenticada deve ter exatamente
  uma membership na v1; a aplicação recusa zero ou múltiplas memberships. A
  identidade permanece sob responsabilidade do Supabase Auth.
- `Equipment` armazena patrimônio, nome, categoria, número de série, local,
  observações e estado operacional (`AVAILABLE`, `MAINTENANCE` ou
  `OUT_OF_SERVICE`). A condição “emprestado” é derivada de um empréstimo aberto.
- `Loan` é criado imediatamente na solicitação; não existe estado intermediário
  de reserva ou aprovação. Um empréstimo está aberto exatamente quando
  `returned_at IS NULL`; não há um segundo campo de status para representar o
  mesmo ciclo. Registros devolvidos são mantidos para o histórico.
- `AuditLog` é append-only, com tenant, ator, ação e recurso.

## Dados iniciais do seed

Além do tenant `suporte_ti`, a especificação de dados iniciais inclui os
equipamentos abaixo, com estado operacional `MAINTENANCE`:

| Patrimônio | Estado inicial |
|---|---|
| `TI-0004` | `MAINTENANCE` |
| `TI-0007` | `MAINTENANCE` |

Esses patrimônios foram definidos pelo briefing da prática, não pelo PRD
original. O seed deve ser idempotente para esses registros e eles não podem
aparecer como disponíveis nem aceitar empréstimos enquanto estiverem em
manutenção. Esta decisão especifica os dados esperados; não autoriza executar
seed em banco remoto.

## Regras e integridade

- Cada tabela de domínio pertencente a um tenant (`Membership`, `Equipment`,
  `Loan` e `AuditLog`) carrega `tenant_id` com FK para `tenants`; `Tenant` é a
  raiz do isolamento e não referencia a si própria.
- Patrimônio é único dentro do tenant.
- Um índice único parcial em `(tenant_id, equipment_id)` com
  `returned_at IS NULL` impede mais de um empréstimo aberto por equipamento.
- `Loan.tenant_id` e `Loan.equipment_id` devem referenciar o mesmo tenant; o
  `borrower_id` precisa corresponder a uma membership do mesmo tenant.
- `borrowed_at`, `due_at` e `returned_at` guardam o ciclo do empréstimo; o prazo
  padrão de 14 dias úteis é calculado no service. O dia da confirmação, no fuso
  `America/Sao_Paulo`, não conta: o próximo dia útil é o dia 1, considerando
  segunda a sexta-feira e sem descontar feriados. A data prevista é interpretada
  no fuso `America/Sao_Paulo`; `due_at` representa o último milissegundo do dia
  de vencimento nessa zona (`23:59:59.999`). O empréstimo ainda está no prazo
  durante todo esse dia e fica atrasado a partir da meia-noite local do dia seguinte.
  A retirada física não altera nem reinicia a contagem.
- A data/hora de funcionamento do setor não está definida. Para esta prática,
  considerar o fim do dia do vencimento; validar com Operações eventual mudança
  para o fechamento antes de adotá-la como política operacional.
- Limite de três empréstimos abertos por pessoa e bloqueio por atraso são
  validados em transação no service. Criações concorrentes para a mesma pessoa
  serializam por advisory lock transacional derivado do UUID autenticado,
  adquirido antes de revalidar a membership e contar os empréstimos abertos.
  Isso evita exigir policy ou privilégio de `UPDATE` em `memberships` apenas
  para bloquear uma linha; o lock e todas as verificações permanecem na mesma
  transação PostgreSQL.
- Uma segunda tentativa de devolver um empréstimo já encerrado é rejeitada e
  não altera `returned_at` nem a condição do equipamento.
- Os dados iniciais para `TI-0004` e `TI-0007` são definidos na seção
  “Dados iniciais do seed”; ambos começam em `MAINTENANCE`.
- Toda tabela recebe RLS e policy explícita na mesma migration. Antes de ler
  memberships, a transação define `app.user_id` a partir da sessão Supabase
  validada; após validar a única membership, define `app.tenant_id` e
  `app.role`. A aplicação nunca aceita esses valores do cliente, e o papel de
  runtime não pode ter `BYPASSRLS`.
- `AuditLog` rejeita `UPDATE` e `DELETE` por trigger.
- `AuditLog` não é lido nem gravado pelo serviço de empréstimos da v1; as
  policies não permitem acesso de usuário. A tabela permanece append-only.

## Fora de escopo

Fila, reserva futura, notificações, importação de planilha, usuários locais
duplicados de Supabase Auth e rate-limit counters, que pertencem à infraestrutura
e não ao modelo de domínio desta tarefa.

## Critérios de aceite

- Schema Prisma e migration Prisma representam as entidades, chaves, índices,
  policies RLS e trigger descritos acima.
- Banco local sobe do zero; seed idempotente cria o tenant `suporte_ti`.
- Testes com PostgreSQL real verificam integridade, empréstimo aberto único,
  limite sob concorrência, histórico e isolamento entre tenants.
- Nenhuma migration é aplicada a banco remoto nesta tarefa.

## Validação e bloqueio atual

Após confirmar que a conexão aponta para um Postgres local isolado e aprovar a
migration: gerar a migration com Prisma Migrate, validar o seed idempotente e
rodar os checks definidos em `../../rules/checks.md`. `prisma migrate reset
--force` é destrutivo e só pode ser usado no banco local descartável confirmado;
nunca executar contra uma conexão cujo destino não foi verificado.

O repositório já contém `package.json`, `prisma/schema.prisma`, uma migration
inicial e `prisma/seed.mjs`. Porém, o catálogo ainda usa dados de demonstração e
a aplicação não usa Prisma nesse fluxo. Embora `.env` exista, seu destino não
pôde ser confirmado como local. Antes de qualquer migration ou seed, validar a
conexão local e aprovar o DDL e as policies RLS.