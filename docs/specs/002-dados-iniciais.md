# Spec 002 — Dados iniciais e conta do professor

**Revisão pré-código:** APTA.
**Revisão pós-código:** NÃO PRONTA. O verificador identificou evidência
insuficiente para DADOS-CA-01 a DADOS-CA-06: os testes estáticos e simulados
não substituem a execução idempotente contra Supabase/PostgreSQL local.
**Execução:** limitada ao ambiente local.
**Fontes:** [PRD](../PRD.md), [spec funcional](mvp.md),
[modelo de banco](modelo-banco-prd.md) e
[acesso e provisionamento](acesso-provisionamento.md)

## Objetivo

Definir dados repetíveis para o tenant local `suporte_ti`, os 12 equipamentos
iniciais e uma conta local de professor vinculada à aplicação.

## Inventário inicial

Esta tabela descreve o inventário inicial e corresponde ao JSON compartilhado
`skills/imagens-equipamentos/equipment.json`, com campos `assetTag`, `name`,
`category`, `conditionStatus` e `query`. O seed deve importar esse JSON para
evitar listas divergentes.

| Patrimônio | Nome | Categoria | Estado inicial | Consulta Pixabay |
|---|---|---|---|---|
| `TI-0001` | Notebook 14 polegadas | `notebook` | `AVAILABLE` | `laptop on white desk` |
| `TI-0002` | Notebook 15 polegadas | `notebook` | `AVAILABLE` | `open laptop minimal desk` |
| `TI-0003` | Notebook 13 polegadas | `notebook` | `AVAILABLE` | `laptop closeup keyboard` |
| `TI-0004` | Notebook 15 polegadas | `notebook` | `MAINTENANCE` | `closed laptop on table` |
| `TI-0005` | Monitor 24 polegadas | `monitor` | `AVAILABLE` | `computer monitor on desk` |
| `TI-0006` | Monitor 27 polegadas | `monitor` | `AVAILABLE` | `monitor screen office desk` |
| `TI-0007` | Monitor 22 polegadas | `monitor` | `MAINTENANCE` | `black computer screen` |
| `TI-0008` | Cabo HDMI 2 m | `cabo` | `AVAILABLE` | `hdmi cable` |
| `TI-0009` | Cabo USB-C 1 m | `cabo` | `AVAILABLE` | `usb cable white background` |
| `TI-0010` | Cabo de rede 3 m | `cabo` | `AVAILABLE` | `ethernet cable` |
| `TI-0011` | Webcam Full HD | `camera` | `AVAILABLE` | `webcam` |
| `TI-0012` | Câmera compacta | `camera` | `AVAILABLE` | `compact camera on table` |

## Regras

- Estado `AVAILABLE` é exibido como disponível; `MAINTENANCE` não pode ser
  solicitado nem exibido como disponível.
- As atualizações repetidas preservam os mesmos patrimônios e estado inicial
  definido nesta spec, sem criar duplicatas.
- A conta `marcelo.grilo@institutojef.org.br` é criada apenas no Supabase local,
  pela Supabase Auth Admin API local usando `SUPABASE_SERVICE_ROLE_KEY` apenas
  no ambiente local, e recebe uma única membership no tenant local
  `suporte_ti`, com papel `COLLABORATOR`.
- A senha deve vir de `TEACHER_SEED_PASSWORD`, configurada apenas no ambiente
  local e não versionada. Não incluir a senha em código, fixture, log,
  documentação ou saída de comando.
- Reexecuções localizam a identidade pelo e-mail via Auth Admin API e fazem
  upsert da membership pelo UUID retornado; não inserem diretamente em tabelas
  internas do Supabase Auth.
- A conta não deve receber empréstimos no seed. Testes de empréstimo usam uma
  conta secundária separada.
- Reexecuções localmente atualizam/encontram a conta pelo e-mail e os
  equipamentos pelo patrimônio, sem criar registros duplicados.
- Nenhum seed, conta ou dado será criado em produção ou Supabase remoto.

## Critérios de aceite

- **DADOS-CA-01:** o inventário contém exatamente 12 equipamentos: quatro
  notebooks, três monitores, três cabos e duas câmeras, correspondendo à tabela.
- **DADOS-CA-02:** todos os patrimônios são únicos; `TI-0004` e `TI-0007`
  iniciam em `MAINTENANCE`; os outros dez iniciam em `AVAILABLE`.
- **DADOS-CA-03:** duas execuções do seed local produzem os mesmos 12
  equipamentos e uma membership para a identidade local de professor, sem
  duplicatas.
- **DADOS-CA-04:** a identidade é localizada por e-mail no Supabase Auth local,
  a membership pertence a `suporte_ti` e o papel é `COLLABORATOR`.
- **DADOS-CA-05:** `SUPABASE_SERVICE_ROLE_KEY` e `TEACHER_SEED_PASSWORD` são
  exigidas somente no ambiente local, nunca são impressas, e o seed recusa
  host remoto para todas as chamadas de banco/Auth.
- **DADOS-CA-06:** a conta do professor permanece sem empréstimos após o seed.

## Bloqueios

1. A chave Pixabay ainda não está configurada localmente; downloads reais ficam
   bloqueados até sua configuração em `.env.local`, sem compartilhar o segredo.
2. O provisionamento em produção é proibido pela regra operacional do
   repositório e permanece fora desta entrega.

## Fora de escopo

Criar ou alterar schema, provisionamento de produção, gerenciamento de
usuários, empréstimos para a conta do professor e credenciais versionadas.
