# Implementação de sons

- `soundData.ts` descreve seções, itens, IDs, `fileKey`, emoji, duração nominal e picks usados no picker de bloco.
- `SoundList.tsx` contém outro array de seções de catálogo (duplicado), lista biblioteca/meus e chama adapter de áudio ou funções do contexto.
- `audio.ts` mapeia `fileKey` para `require` WAV; só toca via `window.Audio` em web. `audio.native.ts` mapeia nomes para basename e chama `PipasAudio.play`.
- `PipasAudioModule.kt` usa `MediaPlayer` para assets/arquivos e tem métodos para speed, echo, trim e render de efeitos AAC/M4A por MediaCodec.
- `SoundRecorder.tsx` seleciona implementação por Platform: Android pede `RECORD_AUDIO`, chama `PipasRecording`, consulta amplitude, usa `PipasAudio` para preview/render; web usa `getUserMedia`, `MediaRecorder`, `AudioContext`/`OfflineAudioContext` e canvas para waveform/EQ.
- `SonsScreen.tsx` gerencia drawer, edição, salvamento e exclusão; contexto persiste itens e eles podem ser tocados em blocos.

## Divergência de implementação

No branch web, `SoundList.tsx` tem um catálogo próprio; `soundData.ts` é usado no picker de blocos. Atualizar apenas um pode criar catálogo inconsistente. Conferir também os mapas de áudio e a presença do WAV.
