---
name: testes-fluxos
description: Planeje, escreva ou revise testes de comportamento do EmpresTI. Use para regras de empréstimo, autorização, persistência, componentes e fluxos de navegador. Siga a stack e os critérios aprovados; não invente requisitos nem dependa de serviços remotos.
---

# Testes de fluxos

## Precedência

Esta skill orienta; não decide. Em conflito, valem `docs/rules/`, `docs/adr/` e a spec aprovada. Pare e avise.

## Antes de começar

1. Localize a spec, os critérios de aceite e os testes próximos ao comportamento alterado.
2. Leia `docs/adr/001-stack.md`, `AGENTS.md` e `docs/rules/checks.md` para identificar as ferramentas aprovadas e os comandos disponíveis no projeto.
3. Confirme o que está realmente instalado e configurado. A stack planejada no ADR não significa que cada ferramenta ou infraestrutura já esteja pronta.

## Procedimento

1. Escreva testes a partir de comportamento e critérios aprovados; inclua casos permitidos, negados e limites relevantes para a mudança.
2. Use Vitest para testes automatizados. Use Testing Library, Postgres real/Testcontainers, `createCaller` do tRPC ou Playwright quando estiverem configurados e forem adequados à camada testada.
3. Prefira testar a regra no limite onde ela é aplicada. Para autorização e persistência, não substitua o banco ou a checagem de acesso por mocks quando isso esconder constraints, transações ou isolamento.
4. Mantenha dados de teste isolados e determinísticos. Use apenas serviços e bancos locais; não use dados reais nem credenciais de produção.
5. Rode primeiro o teste mais próximo da alteração; depois execute os checks requeridos por `AGENTS.md` e `docs/rules/checks.md`.

## Verificação

- Confirme que o teste falha quando o comportamento esperado é removido ou invertido, e passa com a implementação correta.
- Verifique que os casos cobertos correspondem aos critérios de aceite, sem transformar um detalhe de implementação em requisito.
- Informe comandos não executados e dependências ausentes; não declare sucesso quando um check obrigatório falhar.

## Não faça

- Não invente regra de negócio, estado ou critério de aceite para tornar o teste mais simples.
- Não adicione dependências ou infraestrutura fora do ADR sem aprovação.
- Não use mocks para afirmar que banco, RLS, transações ou integração real foram validados.
- Não rode testes, migrations, seeds ou reset contra banco remoto.