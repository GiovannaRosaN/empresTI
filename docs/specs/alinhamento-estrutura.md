# Spec: alinhamento da estrutura de agentes e regras

## Objetivo

Alinhar a estrutura e as referências de documentação do repositório ao modelo
com `AGENTS.md`, `.mcp.json`, `docs/`, `rules/`, `skills/` e `agents/` na raiz,
sem inventar configurações de serviços MCP nem alterar regras de produto.

## Escopo

- Consolidar as regras do projeto em `rules/`.
- Corrigir links e referências nos documentos e no agente verificador.
- Documentar em `AGENTS.md` o escopo e o momento de uso do agente
  `agents/verificador-spec.md`.
- Incluir no fluxo de specs uma verificação explícita antes de declarar uma
  spec pronta.
- Adicionar `.mcp.json` sem servidores pré-configurados.

## Restrições

- Preservar o conteúdo e a intenção das regras existentes.
- Não alterar PRD, ADRs ou regras de negócio.
- Não executar ações de Git nem configurar credenciais ou servidores remotos.

## Critérios de aceite

- As regras operacionais ficam em `rules/`, incluindo `rules/spec-flow.md`.
- Referências internas a regras continuam apontando para arquivos existentes.
- `AGENTS.md` descreve o agente verificador e quando usá-lo.
- `rules/spec-flow.md` define como validar uma spec antes de declará-la pronta.
- `.mcp.json` é JSON válido e não configura servidores sem decisão do time.
