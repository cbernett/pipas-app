# Componentes sensíveis

| Componente | Risco | Dependentes/contratos | Verificação |
| --- | --- | --- | --- |
| `src/context/AppContext.tsx` | HIGH | UI, execução, áudio, placa, storage, live params | controle/loops, abort, persistência e evento |
| `src/components/Workspace.tsx` | HIGH | layout, drag, nested blocks, IDs | web + Android, todos gestos e scroll |
| `src/components/CodeBlock.tsx` | HIGH | templates, live param store, renderer | inputs/dropdowns/brackets e execução com valores |
| `src/components/SoundRecorder.tsx` | HIGH | APIs browser, recorder/audio nativos, storage | permissão, stop/cancel, trim/efeitos/save/play |
| `modules/pipas-usb-serial/**` | CRITICAL | placa e comandos físicos | firmware e hardware real supervisionado |
| `modules/pipas-audio/**`, `pipas-recording/**` | HIGH | codecs, arquivos e permissões | build e aparelho Android |
| `plugins/withUsbSerial.js` | HIGH | Android manifest/assets na geração nativa | prebuild/build limpo e USB/assets |
| `src/soundStorage.ts` | HIGH | formato persistido e arquivos locais | dados antigos, restart, remoção, formato de arquivo |

Criticidade deriva de hardware, estado assíncrono, formato persistido, APIs específicas de plataforma ou alta conectividade entre áreas.
