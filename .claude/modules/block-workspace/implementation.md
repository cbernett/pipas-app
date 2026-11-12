# Implementação do editor e interpretador

## Modelo

`blocks.ts` define `BlockDef`, `BlockParamDef`, `BlockPartDef`, `WorkspaceBlock` e `BlockStack`, além de `BLOCKS`, `BLOCK_TEMPLATES` e `EXAMPLE_STACKS`. Um bloco pode ter `innerBlocks` e `elseBlocks`.

## Interface/gestos

- `BlockLibraryBottomSheet` expande categorias.
- `CategoryBand` oferece arrastar da biblioteca, com implementação web e nativa.
- `CodeBlock` renderiza evento, bloco sequencial ou estrutura bracket/C; campos numéricos e dropdowns escrevem na `liveParamValues` Map global.
- `Workspace` coordena canvas, movimento, snapping/encaixe, divisão/extração de blocos e atualização de stacks. É um componente extenso com tratamento específico de PointerEvents web e responder/modal nativo.

## Execução

`AppContext.executeScript` percorre listas recursivamente; controla `ctrl_2` (repetir), `ctrl_3` (loop), `ctrl_4/5` (condição/else), marca bloco ativo, executa ação e aguarda pequeno intervalo. `stopRun` seta abort flag. `tapBlock` executa uma ação isolada. `triggerScript` protege blocos que requerem placa, trata concorrência e inicia script. `simulateTouch` é ponto de entrada para toque em teste/demo/UI; eventos reais também chegam pelo adaptador serial.

Os IDs `defId` e índices de parâmetro são usados na execução. Labels aparecem como fallback; preservar esse acoplamento ao alterar templates.
