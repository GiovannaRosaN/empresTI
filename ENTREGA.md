# Entrega da prática

## Decisões registradas nesta entrega

| decisão | por quê | onde ficou registrado |
|---|---|---|
| O limite continua em 3 itens, não 5. | O PRD determina o máximo de 3; o roteiro não substitui essa regra de negócio aprovada. | `docs/specs/mvp.md`, `docs/specs/modelo-banco-prd.md` |
| A spec de dados iniciais define os 12 equipamentos e seus estados; o seed importa a lista compartilhada e mantém `TI-0004` e `TI-0007` em manutenção. | Uma fonte compartilhada evita divergência entre documentação, seed e inventário. | `docs/specs/002-dados-iniciais.md`, `skills/imagens-equipamentos/equipment.json`, `prisma/seed.mjs` |
| Mensagens de bloqueio são específicas para limite e atraso; se ambos se aplicam, apresentar ambas. A mensagem do limite informa o máximo de 3, conforme o PRD. | O briefing não fornece texto exato e menciona 5, em conflito com o máximo de 3 do PRD; a spec define o comportamento sem inventar a redação literal. | `docs/specs/mvp.md` |
| A confirmação cria o empréstimo imediatamente; enquanto não devolvido, permanece aberto, conta no limite e indisponibiliza o equipamento. Não há etapa de retirada, e a retirada física não reinicia o prazo. | Evita introduzir reserva ou estado intermediário fora da decisão de produto e mantém a disponibilidade coerente. | `docs/specs/mvp.md`, `docs/specs/modelo-banco-prd.md`, `docs/specs/fluxo-devolucao.md` |
| O prazo é de 14 dias úteis, de segunda a sexta, sem descontar feriados; começa no próximo dia útil após a confirmação, que é o dia 1. | Define uma regra de cálculo reproduzível sem presumir calendário de feriados. | `docs/specs/mvp.md`, `docs/specs/modelo-banco-prd.md`, `docs/specs/fluxo-devolucao.md` |
| O vencimento é até o fim do dia em `America/Sao_Paulo`; atraso começa à meia-noite local do dia seguinte. | A premissa foi aprovada para esta prática; o horário de funcionamento continua fora do escopo. | `docs/specs/modelo-banco-prd.md`, `docs/specs/mvp.md`, `docs/specs/fluxo-devolucao.md` |
| A devolução normal encerra o empréstimo; a decisão sobre devolução danificada ou incompleta permanece pendente. | Não presumir condição do equipamento nem fluxo de Operações para dano/incompletude antes da decisão do time. | `docs/perguntas-prd.md`, `docs/specs/fluxo-devolucao.md`, `docs/specs/mvp.md` |
| Somente `ADMIN` pode reativar equipamento fora de uso, como permissão independente do tratamento de devolução danificada/incompleta. | A reativação foi confirmada como regra independente; a pendência de dano não a altera. | `docs/specs/fluxo-devolucao.md`, `docs/specs/acesso-provisionamento.md` |
| O mesmo verificador tem modos pré e pós-código, com entradas, checklists e vereditos próprios. | A revisão prévia identifica lacunas antes da implementação; a posterior exige evidências de código e testes. Adaptar preserva as duas revisões sem duplicar agentes. | `agents/verificador-spec.md`, `rules/spec-flow.md`, `AGENTS.md` |
| A autorização da aplicação exige uma `Membership` única para cada identidade, vinculada ao tenant e papel; ausência ou duplicidade bloqueia o acesso. Contexto de usuário, tenant e papel é derivado no servidor e passado ao banco dentro da transação. A conta do professor não é provisionada, permanece sem empréstimos e os testes usam conta secundária. | A identidade do Supabase Auth sozinha não concede o contexto de autorização. A matriz de acesso, cardinalidade e contexto confiável foram aprovados para a v1; tenant, papel e processo da conta de produção continuam pendentes. | `docs/specs/acesso-provisionamento.md`, `rules/tests.md` |
| O patrimônio é único por tenant e empréstimo em aberto é definido por `returned_at IS NULL`, sem coluna duplicada `Loan.status`. | Alinha o schema à spec e evita status divergente; a migration foi criada, mas não aplicada a nenhum banco. | `docs/specs/modelo-banco-prd.md`, `prisma/schema.prisma`, migration Prisma |
| O seed foi limitado a bancos locais e é bloqueado em produção. | O `.env.example` aponta para hosts remotos de exemplo e o seed contém dados de demonstração; a barreira evita executá-lo inadvertidamente em produção. | `prisma/seed.mjs`, `docs/specs/acesso-provisionamento.md` |
| Mantive Pixabay como provedor; “pixay” foi esclarecido como Pixabay, não Pexels. | A confirmação explícita eliminou a ambiguidade do roteiro. | `docs/specs/imagens-equipamentos.md`, `skills/imagens-equipamentos/SKILL.md` |
| Mantive os dois registros de devolução previstos no PRD; o sistema registra a ação, mas não comprova fisicamente a entrega. | Ambos os fluxos já estavam no PRD; a sugestão do agente não deveria tratá-los como uma decisão de produto nova. | `docs/specs/mvp.md`, `docs/specs/fluxo-devolucao.md` |

## Situação da implementação e validação

- As telas de catálogo, detalhe, meus empréstimos e Operações estão conectadas
  aos procedimentos tRPC/Prisma; as regras de limite, atraso, prazo e acesso
  são aplicadas no servidor.
- O schema Prisma e a migration de integridade foram criados para alinhar a
  unicidade por tenant, proteger referências entre tenant/equipamento/
  membership e impedir empréstimos abertos duplicados por equipamento. Em
  2026-11-11, as duas migrations foram aplicadas ao PostgreSQL Supabase local
  usando explicitamente `127.0.0.1:54322`; `prisma migrate status` confirmou
  que o schema local está atualizado. A aplicação das migrations não substitui
  testes de constraints, RLS e concorrência.
- A validação inicial passou com `npm run typecheck`, `npm test` (40 testes) e
  `npm run build`. Na rodada rápida de 2026-11-11, a suíte passou com 48 testes;
  também passaram `npm run typecheck`, `npm run build` e `git diff --check`.
- `node ./node_modules/prisma/build/index.js validate` passou; `npm run
  seed:local` recusou execução porque `DATABASE_URL` não aponta para banco
  local.
- O primeiro `supabase start` foi limitado pelo registry Docker (`Rate
  exceeded`). Depois foi confirmado que os serviços locais já estavam
  disponíveis: PostgreSQL na porta 54322 e API Supabase na 54321. Nenhuma
  migration ou seed foi executado em banco remoto.
- Download de imagens Pixabay, revisão visual humana e upload no Storage não
  foram executados nesta rodada. Permanecem necessários o processamento das
  imagens candidatas, a inspeção humana e o Supabase local; nenhuma imagem foi
  enviada.
- O `.env` existente apontava para hosts não locais e não foi usado para acessar
  esses destinos. O Next.js foi iniciado com URLs locais explícitas e
  `http://localhost:3000/login` respondeu HTTP 200.
- A conta `marcelo.grilo@institutojef.org.br` não foi encontrada no Auth local.
  `TEACHER_SEED_PASSWORD` não está configurada em `.env.local`; por isso, a
  conta não foi provisionada e o login com essa conta ainda não pode ser
  testado. A senha não foi gravada no seed nem em arquivo versionado; o seed
  existente exige a variável local e recusa destinos remotos.
- Foi solicitada uma alternativa de contingência que gravaria no código a
  senha padrão da turma para a conta `marcelo.grilo@institutojef.org.br`,
  mantendo-a sem empréstimos. Essa senha **não foi colocada no código, seed,
  logs ou documentação versionada**, pois credenciais não devem ser incluídas
  no repositório. O seed existente recebe `TEACHER_SEED_PASSWORD` somente do
  ambiente local e recusa destinos remotos.
- A revisão pós-código do subagente verificador foi executada e retornou
  `NÃO PRONTA` para as specs 002, 003 e imagens. O verificador identificou
  evidências insuficientes para DADOS-CA-01 a DADOS-CA-06; EMP-CA-01 a
  EMP-CA-09; e IMG-CA-01 a IMG-CA-08, IMG-CA-10 e IMG-CA-11. Para imagens,
  IMG-CA-09, IMG-CA-12 e IMG-CA-13 foram atendidos pelos testes automatizados.
- A tag Git `entrega-pratica` não foi criada, conforme a recusa de autorização
  registrada anteriormente; nenhum commit ou push foi realizado.

### Implementação rápida — 2026-11-11

- `loan.create` ganhou sete testes de procedimento para criação elegível,
  limite, atraso, limite combinado com atraso, equipamento indisponível e
  tentativa de enviar usuário/tenant no input. As regras de prazo ganharam
  cobertura da virada de ano. Esses testes não substituem integração com
  PostgreSQL nem testes de interface.
- O verificador foi executado novamente para a Spec 003: `NÃO PRONTA`.
  Considerou EMP-CA-02 a EMP-CA-05 atendidos; EMP-CA-01 não comprova persistência
  e indisponibilidade, e EMP-CA-06 a EMP-CA-09 permanecem sem evidência
  suficiente de concorrência real, isolamento completo e interface.
- O limite permaneceu em três; não houve acesso a produção, execução de seed,
  uso de credenciais ou alteração do fluxo de imagens Pixabay.
- Embora o pedido de contingência tenha autorizado colocar a senha da turma no
  código caso o Supabase falhasse, não o fiz: isso exporia uma credencial em
  arquivos versionados e contrariaria as regras de segurança do projeto. A
  alternativa segura é fornecer a senha ao seed por `TEACHER_SEED_PASSWORD`
  configurada apenas localmente, quando o Supabase local estiver disponível.
- A revisão pós-código continua `NÃO PRONTA`: a cobertura real de banco,
  concorrência, RLS e telas segue pendente.
- A decisão sobre como tratar equipamento danificado ou incompleto continua
  pendente; não foi presumida nesta entrega.

## Links
- Repositório (turma REST: back e front):
  [GiovannaRosaN/empresTI](https://github.com/GiovannaRosaN/empresTI)
- Produção (Vercel): não informado; nenhum deploy foi realizado nesta entrega.

## 1. Conflitos: o que foi pedido contra o que já existia
Todo pedido desta prática (briefings, requisitos, pedidos do time)
que contrariava o PRD, um ADR, uma rule, o conceito visto em sala ou
outro trecho do próprio enunciado.

| pedido | contrariava o quê | o que você fez | por quê | onde ficou registrado | commit |
|--------|-------------------|----------------|---------|-----------------------|--------|
| O briefing considera bloqueado o pedido quando a pessoa já tem 5 empréstimos ativos. | O PRD estabelece no máximo 3 empréstimos simultâneos por pessoa. | Mantive o limite de 3; o texto da mensagem usa esse limite. Alterar para 5 exige revisão formal do PRD. | Preservar a regra de negócio aprovada e não substituir silenciosamente o PRD pelo briefing. | `docs/PRD.md`, `docs/specs/mvp.md`, `docs/specs/modelo-banco-prd.md` | — |
| Uma sugestão do agente propôs preservar os dois registros de devolução e alinhar os documentos antes da segunda revisão, sem pedir autorização explícita. | O PRD já prevê que o colaborador registra a devolução do próprio item e que Operações registra o recebimento no balcão. | Preservei ambos os fluxos e alinhei as specs: a ação do colaborador encerra o empréstimo como declaração, enquanto Operações registra o recebimento; nenhum registro do sistema comprova por si só a entrega física. | Aplicar o comportamento já definido no PRD, sem transformar uma sugestão do agente em nova decisão de produto. | `docs/PRD.md`, `docs/specs/mvp.md`, `docs/specs/fluxo-devolucao.md` | — |
| O plano citava Pexels para as imagens. | A pessoa esclareceu que o provedor pretendido era Pixabay. | Mantive Pixabay em toda a skill e documentação de imagens. | Respeitar a correção explícita da pessoa e não trocar o provedor por inferência do agente. | `docs/specs/imagens-equipamentos.md`, `skills/imagens-equipamentos/SKILL.md` | — |

## 1b. Lacunas: o que foi pedido de forma incompleta
Tudo que você precisou decidir porque o pedido não dizia.
Cada decisão também está registrada na spec correspondente.

| spec | o que faltava | alternativas | o que decidiu | por quê | commit |
|------|---------------|--------------|---------------|---------|--------|
| `docs/specs/modelo-banco-prd.md` | O PRD original não especificava quais patrimônios estariam em manutenção; o briefing da prática identifica `TI-0004` e `TI-0007`. | Não fixar ativos nos dados iniciais; ou incluir os dois códigos específicos informados no briefing. | Incluir `TI-0004` e `TI-0007` como `MAINTENANCE` nos dados iniciais e registrar que a origem é o briefing da prática. | Formalizar o dado externo ao PRD para que os ativos não sejam apresentados como disponíveis. | — |
| `docs/specs/mvp.md` | O briefing não define a mensagem exibida quando o pedido é bloqueado por quantidade de empréstimos ou por atraso. Também menciona o limite de 5, que conflita com o limite de 3 do PRD. | Exibir mensagem genérica ou uma mensagem por motivo; mostrar um ou ambos os motivos quando aplicável. Para a quantidade, seguir 3 conforme o PRD ou alterar formalmente o limite para 5. | Decisão registrada nesta entrega e refletida na spec funcional: exibir “Você atingiu o limite de 3 empréstimos ativos. Devolva um item antes de solicitar outro.” para o limite e “Você possui empréstimos em atraso. Regularize as devoluções antes de solicitar outro equipamento.” para atraso; se ambos se aplicarem, mostrar os dois motivos. Manter 3 até aprovação formal de mudança do PRD. | Orientar a pessoa com clareza sem alterar silenciosamente uma regra de negócio aprovada. | — |
| `docs/specs/fluxo-devolucao.md` | Era necessário distinguir o registro da devolução feito pelo colaborador do registro de recebimento feito por Operações, sem alegar confirmação física automática. | Remover um dos fluxos; tratar os dois como equivalentes; ou manter ambos com seus efeitos documentados. | Manter ambos conforme o PRD: o colaborador registra a declaração e encerra o empréstimo; Operações registra o recebimento no balcão e seleciona a condição observada no fluxo normal. O sistema não comprova fisicamente a entrega. | Preservar o escopo do PRD e deixar explícito o limite do que o sistema atesta. | — |
| `docs/specs/fluxo-devolucao.md` | O tratamento de devolução danificada ou incompleta não está decidido. | Definir uma transição de condição agora ou manter o caso pendente até aprovação. | Manter pendente; não inferir transição para manutenção/fora de uso nesse caso. | Evitar criar regra de negócio sem decisão aprovada. | — |
| `docs/specs/modelo-banco-prd.md` | O horário de funcionamento e vencimento no fechamento do setor não estão definidos. | Usar o fim do dia como premissa da prática ou esperar decisão operacional. | Usar o fim do dia em `America/Sao_Paulo`, com atraso à meia-noite local seguinte, e registrar que eventual mudança precisa ser validada com Operações. | Tornar o prazo testável sem afirmar que o horário do setor foi definido. | — |

## 2. Onde o agente tentou decidir por você

O agente escreveu: “Sim: o PRD prevê os dois registros — o colaborador informa
a devolução do próprio item, e Operações registra a devolução quando recebe no
balcão. Vou preservar ambos; o sistema registra a ação, mas não comprova
fisicamente a entrega. Agora vou alinhar os documentos com as decisões já
aprovadas antes da segunda revisão da spec.”

Essa formulação propôs a preservação/alinhamento sem pedir autorização
explícita. O comportamento em si, porém, não era uma decisão nova: os dois
registros já constavam no PRD. Mantive os dois fluxos e atualizei as specs para
distinguir a declaração feita pelo colaborador do recebimento registrado por
Operações. Também ficou explícito que nenhum dos registros é prova física
automática de entrega.

## 3. Uma decisão que merece (ou não) um ADR

A exigência de uma única `Membership` por identidade autenticada, com tenant e
papel derivados no servidor, tem alternativas defensáveis (como seleção de
tenant quando houver mais de um vínculo). Ela foi registrada na spec de acesso,
mas não virou um ADR separado: é uma regra de autorização da v1 e não altera a
decisão arquitetural central do ADR-001. O ADR já define tRPC, Prisma,
Supabase Auth e RLS como defesa em profundidade.

## 4. A skill imagens-equipamentos

- `SKILL.md` descreve o procedimento de trabalho, configuração local e ordem
  das etapas. `references/aceite-visual.md` contém critérios de inspeção que
  dependem de julgamento visual. Os scripts executam busca/download, conversão
  800×600, folha de contato, aprovação/rejeição e upload. Essa separação mantém
  instruções operacionais, critérios humanos e operações repetíveis em seus
  lugares apropriados.
- Código verifica patrimônio, campos/hosts Pixabay aceitos, erros e proteção
  da chave, cache e intervalo entre consultas, dimensões, estado de revisão e
  destino Supabase local. A ausência de rostos, marcas/logos e telas legíveis
  depende de inspeção humana: a API e seus metadados não comprovam esses
  atributos visuais.
- O uploader recusa host Supabase remoto antes de criar o cliente/enviar dados;
  os scripts são restritos a destinos locais. Assim, o próprio fluxo de upload
  não oferece caminho para publicar em produção.
- Nenhuma foto foi baixada ou submetida à revisão nesta execução. Portanto,
  não há fotos reprovadas registradas; a contagem é **não aplicável**, e não
  “zero reprovações após inspeção”.

## 5. O subagente verificador

- O agente é acionado pelo fluxo de specs antes do código (`antes-do-codigo`)
  e depois da implementação (`depois-do-codigo`). O gatilho por etapa garante
  revisão de clareza/testabilidade antes de implementar e verificação de
  evidências depois, sem misturar os dois vereditos.
- Ele lê `AGENTS.md`, as rules obrigatórias, a spec e, quando aplicável, os
  arquivos de plano e tarefas. A leitura própria fornece fontes verificáveis e
  evita depender de contexto herdado incompleto.
- O agente tem instrução explícita para não implementar nem editar e sua lista
  de ferramentas é `read`, `search` e `execute`, sem ferramenta de edição. As
  regras também proíbem comandos que alterem arquivos, banco ou Git. Isso é um
  limite do harness/instruções; a revisão não deve executar operações de
  escrita.
- O sistema é um monólito Next.js, como determina o ADR-001. A revisão considera
  as camadas `app/`, `src/`, `prisma/` e testes, em vez de presumir que front e
  back estejam em repositórios separados.

## 6. O verificador em ação

### Teste do erro plantado — execução parcial

- Spec focalizada: `docs/specs/verificacao-ca04.md`. A revisão pré-código
  retornou `APTA`.
- Teste local de referência: `npm test -- src/server/services/loan-rules.test.ts`
  passou, com 10 testes.
- Erro plantado no código: `MAX_ACTIVE_LOANS` alterado temporariamente de 3 para
  4. A execução seguinte falhou com **3 testes falhos e 7 aprovados**, incluindo
  o limite atingido e a combinação de limite com atraso.
- A alteração do limite foi revertida antes de o subagente concluir a revisão.
  O verificador executou o teste já com o limite restaurado e reportou 10 testes
  aprovados; portanto, **não observou a execução vermelha**. Mesmo assim, marcou
  o critério `CA-04` como `REPROVADO`, pois o teste não exercita o procedimento
  `loan.create`. Veredito: `NÃO PRONTA`.
- Uma segunda tentativa de plantar expectativa incorreta no teste foi revertida
  depois que a execução do terminal foi negada; essa tentativa não tem resultado
  de teste nem revisão do subagente.
- Na revisão pós-código posterior, a Spec 003 continuou `NÃO PRONTA`. Os testes
  de procedimento ampliaram a evidência; ainda faltam integração PostgreSQL,
  concorrência, persistência/indisponibilidade comprovadas, isolamento completo
  e testes identificados para as telas.
- Na rodada rápida de 2026-11-11, `npm test` passou com 48 testes,
  `npm run typecheck`, `npm run build` e `git diff --check` também passaram.
  Testes de integração com PostgreSQL real não foram executados porque o daemon
  Docker local não estava em execução.
- **Commits e hashes:** nenhum commit foi criado. A política Git deste repositório
  proíbe commits pelo agente; os hashes ficam pendentes de commits feitos pelo
  usuário após revisar as alterações.

### Revisões das specs

- `docs/specs/mvp.md`: revisão pré-código final — `APTA`, após harmonizar a
  decisão pendente sobre dano/incompletude, aprovar o vencimento e tornar CA-08
  mensurável.
- `docs/specs/verificacao-ca04.md`: revisão pré-código — `APTA`.
- Revisão pós-código de `docs/specs/verificacao-ca04.md`: tabela acima, veredito
  `NÃO PRONTA`; a cobertura do bloqueio de limite não exercitava
  `loan.create` como colaborador. O teste atual cobre a recusa de criação por
  `ADMIN`, mas ainda não substitui os testes de integração das regras do fluxo.
- Revisão pré-código das specs `002-dados-iniciais.md`,
  `003-solicitar-emprestimo.md` e `imagens-equipamentos.md`: `APTA`.
- Revisão pós-código dessas três specs: `NÃO PRONTA`. Evidências por critério,
  limitações dos testes simulados e verificações bloqueadas estão registradas
  acima; não se declara nenhuma dessas entregas pronta.

## 7. Uma regra sua que esta prática pôs à prova

A exigência do fluxo SDD de identificar lacunas e obter decisões antes de
implementar foi posta à prova pela sugestão do agente sobre preservar e alinhar
os dois registros de devolução. O agente deveria ter apresentado isso como
alinhamento ao PRD já aprovado, e não como decisão a tomar sem autorização.
Mantive os dois fluxos conforme o PRD e documentei seus efeitos e limites nas
specs. Não foi feita alteração de ADR ou de regra operacional nesta rodada.

## 8. O que ficou de fora e o que faria diferente

Ficaram de fora: migration e validação de RLS/constraints/concorrência em
PostgreSQL local; testes de integração/E2E e cobertura visual completa; geração,
revisão humana e upload das imagens Pixabay; provisionamento da conta do
professor ou qualquer alteração em produção; deploy, tag, commit e push. O
tratamento de devolução danificada ou incompleta também permanece pendente de
decisão.

Em uma próxima rodada, eu separaria desde o início “implementado” de
“comprovado por teste”, executaria a validação de banco local antes de declarar
os critérios correspondentes atendidos e registraria as evidências de revisão
visual das imagens. A estimativa e execução desta rodada não autorizam
operações em produção.