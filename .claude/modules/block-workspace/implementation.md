# Implementação do editor e interpretador

## Modelo

`blocks.ts` define `BlockDef`, `BlockParamDef`, `BlockPartDef`, `WorkspaceBlock` e `BlockStack`, além de `BLOCKS`, `BLOCK_TEMPLATES` e `EXAMPLE_STACKS`. Um bloco pode ter `innerBlocks` e `elseBlocks`.

## Interface/gestos

- `BlockLibraryBottomSheet` expande categorias.
- `CategoryBand` oferece arrastar da biblioteca, com implementação web e nativa.
- `CodeBlock` renderiza evento, bloco sequencial ou estrutura bracket/C; campos numéricos e dropdowns escrevem na `liveParamValues` Map global.
- `Workspace` coordena canvas, movimento, snapping/encaixe, divisão/extração de blocos e atualização de stacks. É um componente extenso com tratamento específico de PointerEvents web e responder/modal nativo.
- O canvas tem dimensões fixas `CANVAS_W = 1200` e `CANVAS_H = 1000`, dentro de `ScrollView`s aninhados. O scroll só fica habilitado na web quando não há stack em arraste (`scrollEnabled={Platform.OS === 'web' ? !draggingId : false}`); logo a área rolável declarada não é utilizável por gesto no Android atualmente.
- A área de exclusão atualmente é uma faixa inferior determinada por `TRASH_ZONE_CLOSED` (64 px) ou `TRASH_ZONE_OPEN` (340 px). No web e no nativo a lógica usa coordenada vertical de tela; o estado visual é compartilhado por `trashHover`.

## Execução

`AppContext.executeScript` percorre listas recursivamente; controla `ctrl_2` (repetir), `ctrl_3` (loop), `ctrl_4/5` (condição/else), marca bloco ativo, executa ação e aguarda pequeno intervalo. `stopRun` seta abort flag. `tapBlock` executa uma ação isolada. `triggerScript` protege blocos que requerem placa, trata concorrência e inicia script. `simulateTouch` é ponto de entrada para toque em teste/demo/UI; eventos reais também chegam pelo adaptador serial.

O botão Play está implementado em `Workspace.tsx`: se já existe execução, chama `stopRun`; caso contrário, percorre todas as stacks não vazias e chama `triggerScript(stack.blocks)`, sem filtrar tipo de bloco inicial. O toque em um bloco de evento usa `handleEventTap` e executa o sufixo da stack a partir do evento. Não confundir o botão flutuante Play/Stop com o ícone/tela de biblioteca de sons.

Os IDs `defId` e índices de parâmetro são usados na execução. Labels aparecem como fallback; preservar esse acoplamento ao alterar templates.
