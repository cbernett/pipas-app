# Pontos críticos: sons

| Risco | Razão | Cuidados/validação |
| --- | --- | --- |
| HIGH — catálogo duplicado | `SoundList.tsx`, `soundData.ts`, `blocks.ts`, `audio.ts`, `audio.native.ts` mantêm mapas/listas | Ao adicionar/remover/renomear sound key, conferir todos e WAV; reproduzir por catálogo, picker e programa |
| HIGH — formatos nativos | Recorder gera `.m4a`; storage salva com sufixo `.webm`; render de efeitos é AAC em container MP4 | Preservar path real/decodificação; validar gravação, edição, reinício do app e playback Android |
| HIGH — estado/recursos de gravação | Captura de microfone, timers, MediaRecorder/MediaPlayer, streams e módulos nativos | Validar cancelar, sair do drawer, negar permissão, gravar novamente e falhas de codec |
| MEDIUM — implementações de efeito diferem | Web usa graph/OfflineAudioContext; Android usa métodos nativos distintos, inclusive robot como replay | Não presumir mesmo resultado sonoro; comparar por plataforma |
| MEDIUM — URL Blob vs caminho | `UserSound.uri` representa URL web ou path Android | Não tratar uri universal como URL HTTP; adaptar chamadas de playback/persistência por Platform |
| MEDIUM — persistência best-effort | vários erros em load/save são capturados e ignorados/logados | validar erro de armazenamento e arquivos ausentes |

Sem equipamento e browser de áudio executados nesta análise, qualidade sonora e timing não foram aferidos.
