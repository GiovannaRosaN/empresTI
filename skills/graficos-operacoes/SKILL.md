---
name: graficos-operacoes
description: "Implemente uma visualização de dados para Operações quando uma spec aprovada definir a pergunta de negócio e o critério de aceite. Não use para propor métricas, requisitos ou mudanças gerais de design."
metadata:
  origem: "não encontrada no repositório"
  licenca: "não encontrada no repositório"
  adaptada-em: "2026-10-23"
  mudancas: "Gatilho delimitado; removidas regras repetidas; decisões pendentes exigem esclarecimento; verificações e referências corrigidas."
---

# Gráficos de Operações

## Precedência

Esta skill orienta; não decide. Em conflito, valem `docs/rules/`, `docs/adr/` e a spec aprovada. Pare e avise.

## Antes de começar

1. Localize a spec aprovada, o critério de aceite e a pergunta de negócio que exigem a visualização. Se algum deles não existir, pare; não crie requisitos nem critérios.
2. Consulte `docs/PRD.md` e a spec para confirmar o escopo dos dados. Se a visualização depender de um escopo de tenant ainda não definido, pare e peça a decisão necessária.
3. Consulte `docs/adr/001-stack.md`, `docs/adr/002-layout-visual.md` e `docs/layout.md` para seguir as decisões existentes de arquitetura e design.

## Procedimento

1. Expresse a pergunta aprovada de forma mensurável e identifique dimensão, medida, período e estado dos dados. Se algum deles não estiver definido e afetar a resposta, solicite esclarecimento em vez de decidir.
2. Escolha a visualização mais simples que responda à pergunta e ao critério aprovados. Não introduza dependências nem decisões de biblioteca fora dos ADRs.
3. Implemente apenas estados de carregamento, vazio, erro ou dados insuficientes que estejam definidos no contrato da tela. Se forem necessários e não estiverem definidos, pare e solicite esclarecimento.
4. Implemente no frontend previsto pelo ADR-001, usando os contratos tipados da aplicação; não use dados fictícios para ocultar ausência de backend.
5. Siga os requisitos de acessibilidade e responsividade da spec e do ADR-002.

## Verificação

- Adicione ou atualize testes do componente para conferir valores, rótulos, filtros e estados explicitamente definidos no critério de aceite e no contrato.
- Execute os testes aplicáveis conforme `AGENTS.md` e `docs/rules/checks.md`.
- Revise manualmente os requisitos visuais ou de acessibilidade da spec que não forem cobertos pelos testes existentes; não os substitua por critérios novos.
