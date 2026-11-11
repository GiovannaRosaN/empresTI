# Spec: imagens de equipamentos

**Revisão pré-código:** APTA.
**Revisão pós-código:** NÃO PRONTA. O verificador atendeu IMG-CA-09,
IMG-CA-12 e IMG-CA-13; os demais critérios não têm evidência completa de
execução real. Busca Pixabay, revisão visual e upload local seguem pendentes.
**Fontes:** [PRD](../PRD.md), [layout](../layout.md), [ADR-001](../adr/001-stack.md)

## Objetivo

Criar a skill `imagens-equipamentos` para obter, normalizar, revisar e publicar
imagens ilustrativas do catálogo, mantendo uma imagem e metadados por patrimônio.

## Escopo

- Criar `skills/imagens-equipamentos/SKILL.md`, referências de aceite e scripts
  Node.js em `scripts/`.
- Usar a lista `skills/imagens-equipamentos/equipment.json` como a fonte
  compartilhada entre os scripts de imagens e o seed. Ela deve corresponder
  exatamente à tabela “Inventário inicial” em
  [Spec 002 — dados iniciais](002-dados-iniciais.md); não manter listas manuais
  duplicadas nos scripts.
- Consultar a API oficial Pixabay, baixar as fotos selecionadas e processá-las com
  `sharp` para exatamente 800 × 600 pixels.
- Gerar metadados JSON com patrimônio, consulta, identificação e atribuição da
  foto Pixabay, dimensões, caminho local, estado de revisão e URL pública quando
  enviada.
- Criar um uploader para Supabase Storage que publique somente imagens
  aprovadas e gere suas URLs públicas.

## Critérios de aceite

- **IMG-CA-01:** o downloader e o seed leem
  `skills/imagens-equipamentos/equipment.json`, com 12 patrimônios e uma
  consulta Pixabay não vazia para cada item. O JSON contém `assetTag`, `name`,
  `category`, `conditionStatus` e `query` e corresponde aos 12 registros e
  categorias da tabela de inventário.
- **IMG-CA-02:** o downloader falha explicitamente sem `PIXABAY_API_KEY`, sem
  resultado utilizável ou diante de resposta HTTP inválida; não registra
  chaves nos logs nem nos metadados. O script consulta
  `https://pixabay.com/api/` com `q`, `image_type=photo`, `safesearch=true`,
  `lang=en` e `per_page=20`. Resultado utilizável significa um objeto `hit`
  com `id` inteiro positivo, `user` não vazio, `pageURL` em HTTPS no host
  `pixabay.com` e `largeImageURL` em HTTPS no host `pixabay.com`; caso nenhum
  registro cumpra os campos, o script falha explicitamente. A busca filtra
  `people` e termos de pessoas/marcas, mas a ausência de pessoas, marcas de
  terceiros e telas ligadas somente pode ser garantida pela revisão humana.
  Cada execução exige um patrimônio válido e busca somente esse item. O
  resultado da consulta é armazenado em cache local por 24 horas; execuções
  dentro desse período reutilizam o resultado sem chamada à API, e uma
  consulta expirada faz uma nova chamada antes de atualizar o cache. O
  downloader carrega `PIXABAY_API_KEY` do `.env.local`, ignorado pelo Git; a
  chave nunca aparece em logs, manifesto, imagens nem arquivos versionados.
- **IMG-CA-03:** toda imagem gerada mede exatamente 800 × 600 pixels e seus
  metadados registram `id`, `user`, `pageURL` e dimensões/fonte Pixabay.
- **IMG-CA-04:** `skills/imagens-equipamentos/references/aceite-visual.md`
  define critérios completos de inspeção; o script gera uma folha de contato
  para revisão humana e registra estado `pending`, `approved` ou `rejected` por
  patrimônio no manifesto JSON. Nenhuma imagem `pending` ou `rejected` pode
  ser enviada ao Storage.
- **IMG-CA-05:** uma imagem reprovada pode ser substituída sem alterar outros
  patrimônios nem sobrescrever silenciosamente uma imagem aprovada.
- **IMG-CA-06:** o uploader valida configuração, resultado do upload e URL
  pública; falhas são explícitas e não são tratadas como sucesso.
- **IMG-CA-07:** scripts de Storage recusam destinos remotos e podem ser
  executados contra Supabase local; o hostname em `NEXT_PUBLIC_SUPABASE_URL`
  deve ser exclusivamente `localhost`, `127.0.0.1` ou `::1` (aceitando IPv6
  entre colchetes); qualquer outro hostname é recusado antes de criar cliente
  ou enviar dados. Nenhuma ação de upload remoto é realizada.
- **IMG-CA-08:** uma execução do downloader sem patrimônio ou com patrimônio
  desconhecido falha antes de consultar a API; uma execução válida pesquisa e
  baixa somente o patrimônio informado.
- **IMG-CA-09:** com uma consulta ainda dentro da validade de 24 horas, o
  downloader reutiliza o cache e não chama a API; após a expiração, consulta a
  API e atualiza o cache. O cache não contém a chave de API.
- **IMG-CA-10:** os metadados mantêm `user` e `pageURL` do Pixabay junto à
  imagem usada, sem armazenar a chave. O downloader não apresenta uma lista
  dos resultados de busca aos usuários da aplicação. A folha de contato local
  identifica cada foto com `Pixabay` e o nome do autor; o manifesto preserva
  o link `pageURL`. O fluxo baixa e hospeda as imagens em vez de usar hotlink
  permanente.
- **IMG-CA-11:** a chave é lida do `.env.local`, que é ignorado pelo Git; a
  busca falha com mensagem explícita se a variável estiver ausente, sem
  revelar o valor da chave em mensagens de erro.
- **IMG-CA-13:** `.env.example` documenta `PIXABAY_API_KEY` sem valor real; a
  configuração local da chave permanece somente em `.env.local`.
- **IMG-CA-12:** cada execução faz no máximo uma consulta à API (ou reutiliza
  cache); não há rotina de download em massa nem retry automático. Antes de
  cada chamada, um limitador local compartilhado entre execuções concorrentes
  reserva o horário da requisição e garante pelo menos 1,1 segundo entre
  chamadas à API, com estado persistido em `generated/cache/`. Se não for
  possível ler, reservar ou atualizar o limitador, a operação falha antes da
  chamada à API. Resposta HTTP 429 falha explicitamente e informa o tempo de
  espera quando o header `X-RateLimit-Reset` está presente, sem expor a chave.
  Esse intervalo limita o uso local a no máximo 55 chamadas em qualquer janela
  de 60 segundos, abaixo do limite documentado pela API de 100.

## Restrições e decisões

- Não usar imagens com rostos, marcas de concorrentes ou telas ligadas. A
  inspeção visual humana é obrigatória, pois a busca da API não garante esses
  critérios.
- A pessoa solicitante inspeciona a folha de contato gerada conforme
  `skills/imagens-equipamentos/references/aceite-visual.md` e aprova/rejeita
  cada patrimônio; nenhuma imagem é enviada antes dessa aprovação.
- A configuração Pixabay usa `PIXABAY_API_KEY`, somente em ambiente local e
  sem valor versionado; o `.env.local` é ignorado pelo Git. Resultados da API
  são reutilizados por 24 horas; cada execução é limitada a uma consulta de
  patrimônio para revisão humana e não executa downloads em massa. A
  documentação da API limita o uso a 100 requisições por 60 segundos e proíbe
  downloads sistemáticos em massa. Um limitador local compartilhado reserva
  no máximo uma chamada por intervalo de 1,1 segundo entre execuções, mantendo
  margem abaixo desse teto. Conforme a documentação da API, se uma
  interface vier a exibir resultados de busca, deverá indicar Pixabay; o
  fluxo desta skill não exibe uma lista de resultados na aplicação. A folha
  de contato identifica o autor e Pixabay, e o manifesto mantém o link para a
  página da foto. O uso das imagens deve seguir a
  [licença de conteúdo Pixabay](https://pixabay.com/service/terms/) e as
  [condições da API](https://pixabay.com/api/docs/); imagens não são
  permanentemente hotlinkadas. A chave de serviço Supabase nunca deve ser
  exposta ao navegador.
- A imagem é ilustrativa; não se deve afirmar que representa o modelo físico
  exato do equipamento.
- As consultas são exatamente as da tabela aprovada na spec
  [002 — dados iniciais](002-dados-iniciais.md).
- O uso da API deve cumprir os limites e a licença oficiais do Pixabay; as
  imagens finais são baixadas para o Storage local, sem hotlink permanente.
- Produção e qualquer Supabase remoto estão fora dos limites operacionais desta
  tarefa.

## Fora de escopo

Geração de imagens, remoção automática de rostos/logos, alteração de schema
para armazenar URLs, publicação em produção e alteração da interface do catálogo.
