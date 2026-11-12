# Matriz de impacto de mudanças

| Alteração | Arquivos vizinhos a inspecionar | Impacto/contrato | Validação |
| --- | --- | --- | --- |
| Novo bloco/ID/param | `blocks.ts`, `CodeBlock.tsx`, `Workspace.tsx`, `AppContext.tsx` | templates, índices, filhos/execução, persistência | render, editar, persistir e executar |
| Label/evento de toque | `blocks.ts`, `AppContext.findTouchStack`, renderer, firmware docs externos | fallback de string pode afetar trigger | toque 1–3, dropdown alterado e label default |
| Comando LED/motor | executor, `serial.ts`, `.native.ts`, Kotlin, firmware | bytes, pin indices, side effects físicos | conferir especificação/hardware; teste supervisionado |
| Novo som catálogo | `soundData.ts`, `SoundList.tsx`, `blocks.ts`, `audio.ts`, `audio.native.ts`, asset WAV, plugin | fileKey deve atravessar picker→adapter→asset | catálogo/picker/programa Android e web |
| Gravação/efeito | `SoundRecorder.tsx`, módulos audio/recording, `soundStorage.ts`, SonsScreen | formatos, lifecycle, uri/path, runtime permission | record→preview→trim/effect→save→restart→play/delete |
| Mudar modelo persistido | `AppContext`, `soundStorage.ts`, estruturas em `blocks.ts` | usuários têm dados locais JSON preexistentes | simular valores antigos e migração/recovery |
| Dependency nativa / Kotlin | `package.json`/lock, module config, Gradle, facade TS, app config | autolinking e binário Android | build limpo, instalar novo APK |
| Plugin/permissão Android | `app.json`, `plugins/withUsbSerial.js`, manifest gerado | intent filters, assets e runtime access | prebuild/build e aparelho real |
| UI ou navegação shell | `App.tsx`, screens, header/context | tela desmontada, drawer e safe area | Android/web, troca tabs com modal aberto |
| Hosting web | `vercel.json`, script `build`, Expo web config | `dist`, SPA rewrite | export local e preview hospedado se configurado |

Contratos ainda não verificados (firmware, codec em aparelhos diversos, deploy real) devem ser apontados como tal no PR/relato.
