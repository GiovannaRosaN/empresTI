---
description: Contrato de operacao entre mim e o agente neste projeto
globs: []
alwaysApply: true
---

# Contrato de operação

## Git
> leitor: agente

Git, commits, branches, push e deploy seguem [AGENTS.md](../AGENTS.md) e
[spec-flow.md](spec-flow.md). Este arquivo não substitui essas regras:
o agente não cria commit nem faz push sem solicitação explícita.

## Autorização por tipo de ação
> leitor: agente

| ação                                        | nível          |
|---------------------------------------------|----------------|
| Editar arquivo existente dentro do escopo da tarefa | livre          |
| Criar arquivo novo                          | avisar depois  |
| Deletar ou renomear arquivo                 | pedir antes    |
| Instalar ou atualizar dependência           | pedir antes    |
| Criar ou alterar migration                  | pedir antes    |
| Editar `.env` e `.env.example` localmente, conforme `rules/secrets.md` | avisar depois |
| Acessar serviços remotos do projeto e consultar configuração ou envs | livre no escopo da tarefa |
| Alterar configuração remota ou envs de serviços do projeto | livre quando necessário e dentro do escopo da tarefa |
| Deploy ou alteração destrutiva em produção/dados remotos | pedir antes |

O que cada nível significa:
- livre — faça e siga em frente.
- avisar depois — faça e me diga na resposta o que fez.
- pedir antes — descreva o que pretende fazer e PARE.
- pedir antes — descreva o que pretende fazer e PARE até receber autorização.
  Acesso remoto não autoriza expor segredos; siga `rules/secrets.md`.

## Configuração do operador
> leitor: humano — isto não é instrução para o agente

| fase                              | modelo / raciocínio |
|-----------------------------------|---------------------|
| Escrever a spec                   | raciocínio alto     |
| Planejar e quebrar em tarefas     | raciocínio alto     |
| Executar uma tarefa já decidida   | rápido              |
| Debugar algo que quebrou          | raciocínio alto     |
| Revisar o diff antes do commit    | padrão              |

- Revisão de diff acontece em sessão limpa, de preferência com
  modelo diferente do que escreveu o código.
- Sessão longa não se corrige com regra mais enfática: encerre seguindo
  [handoff/handoff.md](../handoff/handoff.md), somente depois de perguntar ao
  usuário se ele deseja que um handoff seja criado ou atualizado, e abra outra.