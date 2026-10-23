---
name: principios-solid
description: Use os princípios SOLID para analisar ou melhorar o design de código TypeScript, especialmente services, routers e módulos do backend do EmpresTI. Use quando alguém pedir uma revisão SOLID, análise de responsabilidade, acoplamento, extensibilidade ou testabilidade. Não use para decidir a arquitetura do projeto, criar requisitos, definir critérios de aceite ou substituir rules/test.md e o ADR-001.
---

# Princípios SOLID

## Antes de começar

1. Confirme a spec ou o pedido aprovado e o critério de aceite relacionado ao
   código. Sem escopo verificável, pare e peça a spec.
2. Leia o ADR-001 e as rules aplicáveis. SOLID é uma lente de análise; não é
   uma autorização para trocar a arquitetura ou criar abstrações.
3. Entenda primeiro o fluxo real do código antes de classificar qualquer trecho
   como problema.

## Procedimento

Analise somente os princípios relevantes para o caso:

- **S — responsabilidade única:** procure mais de um motivo independente para
  uma unidade mudar; descreva as responsabilidades concretas, não apenas o
  tamanho do arquivo.
- **O — aberto/fechado:** procure condicionais que precisam ser editadas a cada
  novo caso; confirme antes se a variação é real e está no escopo da spec.
- **L — substituição de Liskov:** verifique se implementações ou subclasses
  preservam o contrato esperado, incluindo erros, pré-condições e resultados.
- **I — segregação de interfaces:** procure contratos grandes que obrigam
  consumidores a depender de operações que não usam; proponha interfaces
  menores somente quando houver consumidores distintos.
- **D — inversão de dependência:** procure regra de negócio acoplada a detalhes
  concretos; respeite as camadas e o caminho `router → service → Prisma` do
  ADR-001 antes de sugerir uma porta ou adaptador.

Para cada achado, registre:

1. arquivo e linha;
2. princípio envolvido;
3. comportamento ou mudança que o problema torna difícil;
4. menor alternativa compatível com a spec;
5. custo, risco e teste que comprovaria a mudança.

## Verificação

- Diferencie violação concreta de preferência de estilo.
- Confirme que a proposta não duplica uma decisão do ADR-001 nem uma regra de
  `rules/`.
- Não sugira abstração sem um segundo consumidor, uma variação real ou um
  problema verificável de teste/manutenção.
- Aponte os testes aplicáveis conforme `rules/test.md`; não invente cobertura.

## Não faça

- Não aplicar SOLID como checklist mecânico em todo arquivo.
- Não criar interfaces, factories ou camadas apenas para “seguir SOLID”.
- Não trocar dependências, arquitetura ou regras de negócio sem aprovação e
  atualização da spec quando necessário.
