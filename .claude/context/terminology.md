# Glossário

| Termo | Significado no código |
| --- | --- |
| `defId` | Identificador de tipo de bloco (ex.: `som_1`, `ctrl_2`), usado pelo interpretador e templates. |
| `id` do bloco | Identificador de instância, usado em chaves de parâmetro live e identidade React. |
| `BLOCK_TEMPLATES` | Array de partes textuais/parâmetros que compõe rótulo e entradas do bloco. |
| `liveParamValues` | `Map` global em `CodeBlock.tsx` que mantém strings de valores editados, fora de React state global. |
| `WorkspaceBlock` | Instância de bloco, pode conter `innerBlocks` e `elseBlocks`. |
| `BlockStack` | Lista ordenada de blocos e posição no canvas. |
| Canvas/área de trabalho | Superfície de edição que contém `BlockStack`s; atualmente mede 1200×1000 px em `Workspace.tsx`, dentro de `ScrollView`s horizontal e vertical. |
| Stack/script | No modelo, um `BlockStack` é uma sequência ordenada; a linguagem do produto usa “script” para blocos conectados. Uma stack pode começar por evento ou por bloco de ação. |
| `evt_1` | `defId` do bloco de evento “quando iniciar”, conforme `src/data/blocks.ts`. |
| Zona de exclusão | Área inferior exibida pela biblioteca durante arraste; `trashHover` controla o estado visual e o workspace decide apagar ao soltar. |
| C-block/bracket | Bloco de controle que contém blocos filhos; renderizado por `BracketBlock`. |
| pad/toque | Entrada numerada 1–3 recebida da placa e associada a stack com bloco de evento correspondente. |
| `fileKey` | Chave funcional do som, mapeada para basename WAV e valores de dropdown. |
| Development build | Build Expo instalado no dispositivo com `expo-dev-client` e módulos nativos do app. |

Os termos C-block/bracket são linguagem descritiva derivada dos nomes/estrutura do código; não são tipos exportados.
