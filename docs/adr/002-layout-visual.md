# ADR-002 — Linguagem visual e implementação do layout

**Status:** aceito  
**Contexto do produto:** [PRD](../PRD.md)  
**Referências:** [layout](../layout.md), [ADR-001 — Stack](./001-stack.md)

## Contexto

O produto precisa de uma interface operacional consistente com as seis telas
descritas em `docs/layout.md`. O ADR-001 define Next.js, Tailwind CSS e
shadcn/ui para o front-end. O layout define uma identidade visual própria e
orienta que os estilos fiquem junto ao template, sem folhas de estilo globais
de componentes.

## Decisão

- `docs/layout.md` é a fonte de verdade para aparência, conteúdo visual,
  navegação, responsividade, animações e acessibilidade das telas da v1.
- A implementação mantém Tailwind CSS, conforme ADR-001. Utilitários
  `className` ficam junto aos componentes; não criar folhas CSS por tela ou
  componente. O atributo React `style` fica reservado a valores calculados em
  runtime que não possam ser expressos de forma adequada por classes.
- Tokens de cor, tipografia e tema vivem como propriedades customizadas CSS no
  `:root` e são mapeados para o tema do Tailwind. CSS global fica limitado a
  imports necessários, tokens, resets, fonte, foco visível e regras globais de
  acessibilidade, incluindo `prefers-reduced-motion`.
- A interface usa somente o tema escuro, Open Sans, a paleta e os estados
  semânticos definidos no layout. Ações primárias permanecem contornadas; a
  cor primária escura é usada em superfícies de marca, não em texto ou botão.
- O Nocturne e os exemplos de conteúdo do layout são referências visuais, não
  dependências de runtime nem dados de produção. Não adicionar o bundle `_ds`
  nem tratar nomes, equipamentos, contagens ou datas de demonstração como
  registros reais.
- Componentes shadcn/ui podem ser usados quando necessário, desde que sua
  aparência seja adaptada aos tokens e padrões do layout; a biblioteca não
  substitui a identidade visual definida pelo produto.

## Justificativa

- Mantém uma única referência visual para as telas, sem duplicar tokens em
  folhas de estilo específicas.
- Preserva a stack aprovada no ADR-001 e deixa a implementação de cada estilo
  próxima do componente que o utiliza.
- Evita transformar conteúdo ilustrativo do protótipo em regras de negócio ou
  dados persistidos.
- Permite reutilizar componentes acessíveis sem impor um tema visual externo.

## Alternativas consideradas

- **Importar o bundle Nocturne como dependência de runtime:** descartado
  porque o layout já documenta os tokens e padrões necessários e o bundle não
  é parte da stack aprovada.
- **Usar folhas de estilo separadas por tela ou componente:** descartado por
  espalhar e duplicar os estilos que o layout pede para manter junto aos
  templates.
- **Usar componentes shadcn/ui sem adaptação:** descartado porque poderia
  substituir cores, dimensões e interações definidos pelo layout.
- **Adicionar modo claro ou alternância de tema:** descartado porque o layout
  especifica somente o modo escuro.

## Consequências

- Tokens e estilos implementados devem ser conferidos contra `docs/layout.md`;
  divergências visuais precisam ser tratadas como mudanças dessa referência.
- CSS global permanece pequeno, mas os utilitários Tailwind podem ser
  extensos nos templates. Valores que mudem com dados em runtime podem usar
  `style` quando não houver alternativa clara com classes.
- A conformidade visual não aprova por si só fluxos de empréstimo, estados de
  negócio, conteúdo demonstrativo como dado real ou funcionalidades fora do
  PRD.

## O que este ADR não decide

- Modelo de dados, estados persistidos, histórico de empréstimos ou
  tratamento de equipamentos danificados.
- Regras de autenticação, provisionamento de usuários, tenants e matriz de
  permissões.
- Comportamento funcional das ações ainda sem integração com a API.
