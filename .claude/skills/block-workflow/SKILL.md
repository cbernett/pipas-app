---
name: block-workflow
description: Use when changing block definitions, parameter editing, workspace drag and drop, nested control blocks, or script execution in Pipas Labs.
---

# Skill: fluxo de blocos

## Quando utilizar

Ao criar, alterar ou investigar tipos de bloco, campos, empilhamento, controle aninhado, disparo, cancelamento ou estado de execução.

## Leia antes

- `.claude/architecture/data-flow.md`, `.claude/context/business-rules.md`.
- `.claude/modules/block-workspace/{overview,implementation,critical-points}.md`.
- `.claude/critical/change-impact.md`.
- Implementações atuais: `src/data/blocks.ts`, `src/components/CodeBlock.tsx`, `src/components/Workspace.tsx`, `src/context/AppContext.tsx`.

## Procedimento

1. Identifique `defId`, entradas de `BLOCK_TEMPLATES`, índice de cada parâmetro, label, category e componente renderizador.
2. Procure todos os leitores de ID/label, `BOARD_DEFIDS`, controles recursivos, trigger por toque e persistência.
3. Se adicionar ação, atualize o interpretador e proteções de conexão aplicáveis; se não requer placa, não adicionar artificialmente.
4. Preserve filhos `innerBlocks`/`elseBlocks` e comportamento de workspace/preview.
5. Validar visualmente, parâmetro, execução, bloco aninhado, cancelamento e armazenamento de stack conforme escopo.

## Convenções e restrições

- Não renomear IDs existentes sem compatibilidade com dados já persistidos.
- `liveParamValues` usa chave `${block.id}_${paramIdx}` e contém strings; a leitura numérica usa `BLOCK_TEMPLATES` como fallback.
- Labels podem ser fallback semântico. Atualizar texto exige busca no interpretador.
- `ctrl_2/3/4/5` dependem de children; `ctrl_4/5` consultam estado de dispositivo local, não telemetria.
- Evitar reescrever a matemática de gestos sem validar web e Android.

## Exemplo deste repositório

`ctrl_5` tem parâmetro de dispositivo no índice 1 e estado no índice 3, usa `innerBlocks` e `elseBlocks`, é desenhado em `CodeBlock.tsx` e interpretado em `AppContext.tsx`. Confirme os índices exatos nos templates antes de reutilizar o exemplo.

## Validação

Não há runner de teste configurado. Faça validação manual correspondente e reporte limites; consulte `.claude/development/testing.md`.
