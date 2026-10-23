---
name: ilustracao-equipamento
description: Crie ou adapte ilustrações e ícones de equipamentos do catálogo do EmpresTI no frontend. Use quando uma tela ou spec pedir a representação visual de notebook, monitor, cabo, câmera ou nova categoria de equipamento. Não use para decidir a identidade visual, os tokens, a biblioteca de ícones ou regras de negócio; consulte ADR-002 e layout.md.
---

# Ilustração de equipamento

## Antes de começar

1. Confirme a tela, spec e critério de aceite que exigem a ilustração. Sem CA, pare e peça a decisão de produto.
2. Leia ADR-002 e `layout.md` para aplicar a linguagem Nocturne, os tokens, a tipografia, os estados e os padrões de acessibilidade.
3. Verifique se já existe um componente ou ícone reutilizável antes de criar outro caminho.

## Procedimento

1. Mapeie a categoria do equipamento para o componente visual existente; se a categoria for nova, preserve a semântica do catálogo e registre a lacuna na spec em vez de inventar uma regra de negócio.
2. Use a biblioteca e os padrões definidos no ADR-002. A skill executa a decisão do design system; não cria uma linguagem visual paralela.
3. Preserve proporção, alinhamento, `currentColor`, peso de traço, área de toque, texto alternativo e estados de indisponibilidade definidos em `layout.md`.
4. Reutilize o componente entre catálogo e detalhe quando o comportamento for o mesmo; diferenças de estado devem ser explícitas.

## Verificação

- O ícone/ilustração representa a categoria sem depender apenas de cor.
- A implementação usa tokens e componentes existentes, sem valores visuais arbitrários espalhados no componente.
- O foco e o nome acessível continuam presentes quando o elemento é acionável.
- Aponte os testes aplicáveis conforme `rules/test.md` e valide os estados previstos na spec.

## Não faça

- Não inventar categoria, estado ou comportamento de empréstimo.
- Não adicionar imagens, assets ou dependências externas sem solicitação e aprovação compatíveis com o ADR-001.
- Não duplicar uma cópia da skill em `.cursor/skills/` ou em outro caminho.
