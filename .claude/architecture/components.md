# Mapa de componentes e localização de tarefas

| Necessidade | Arquivos para começar | Dependências/contratos a seguir |
| --- | --- | --- |
| Inicialização, layout raiz, cabeçalho e aba | `index.ts`, `App.tsx`, `src/components/AppHeader.tsx` | `AppContext.activeTab`; provedores Safe Area e Gesture Handler |
| Estado global, execução de programa, eventos da placa | `src/context/AppContext.tsx` | `blocks.ts`, `CodeBlock.liveParamValues`, `serial*`, `audio*`; ver módulo `block-workspace` |
| Definir/renomear/adicionar blocos | `src/data/blocks.ts`, `CategoryBand.tsx`, `CodeBlock.tsx`, `Workspace.tsx` | `id`/`defId`, `BLOCK_TEMPLATES`, índice do parâmetro; rebuild não é necessário para JS |
| Gestos, encaixe, pilhas e canvas | `src/components/Workspace.tsx`, `CategoryBand.tsx`, `CodeBlock.tsx` | Estrutura `BlockStack` e filhos de controle; web usa PointerEvent/document, Android usa responder/modal |
| Comandos motores/LED e toque físico | `src/context/AppContext.tsx`, `src/serial.ts`, `src/serial.native.ts`, `BoardStatusSheet.tsx` | Protocolo serial, índices e eventos; consultar firmware externamente antes de alterar protocolo |
| Catálogo e reprodução de sons | `src/data/soundData.ts`, `src/components/SoundList.tsx`, `src/audio.ts`, `src/audio.native.ts`, `modules/pipas-audio` | IDs `fileKey` devem casar com `assets/sounds/*.wav` e mapa Android nativo |
| Gravação, trim e efeitos | `src/components/SoundRecorder.tsx`, `modules/pipas-recording`, `modules/pipas-audio` | Plataforma seleciona branch; contratos de caminho/URI diferem por plataforma |
| Salvar/recarregar/remover sons do usuário | `src/soundStorage.ts`, `src/context/AppContext.tsx` | Chave `pipas_user_sounds_v1`; arquivos locais e metadados |
| Configuração de build/permissões/USB assets | `app.json`, `eas.json`, `plugins/withUsbSerial.js`, `modules/*/expo-module.config.json` | Mudanças nativas/configuração exigem novo build Android |
| Gerar arquivos WAV sintéticos | `scripts/gen-sounds.js` | Escreve diretamente em `assets/sounds`; sem script npm associado |

Detalhes e riscos por domínio estão em [`modules/`](../modules/). Para efeitos transversais, leia [`critical/change-impact.md`](../critical/change-impact.md).
