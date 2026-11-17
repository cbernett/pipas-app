---
name: sound-catalog-recording
description: Use when changing catalog sounds, playback, user recordings, waveform preview, trim/effects, audio assets, or sound persistence.
---

# Skill: sons e gravação

## Quando utilizar

Qualquer mudança no catálogo, `fileKey`, reprodução, gravação web/Android, efeito/trim, edição ou CRUD de som criado pelo usuário.

## Leia antes

- `.claude/architecture/data-flow.md`.
- `.claude/modules/sound-system/*` e `.claude/modules/local-persistence/*`.
- `.claude/critical/known-issues.md`, `.claude/critical/change-impact.md`.
- Inspecione `soundData.ts`, `SoundList.tsx`, `blocks.ts`, `audio.ts`, `audio.native.ts`, `SoundRecorder.tsx`, `soundStorage.ts`, `SonsScreen.tsx`, Kotlin e assets conforme a mudança.

## Procedimento

1. Determine se o som é asset estático ou gravação de usuário.
2. Ao adicionar item estático, trace `fileKey` do catálogo e dropdown até mapa de arquivo, WAV e cópia Android do plugin.
3. Ao alterar gravação, trace start → stop → preview → trim/effect → save → storage → reload → playback → delete em ambas as plataformas pertinentes.
4. Preserve distinção de URI web (Blob URL) e path Android.
5. Valide no browser e Android para mudanças compartilhadas; alteração Kotlin precisa rebuild.

## Restrições

- Não assuma catálogo único: há cópias em arquivos distintos.
- Não assuma MIME/extensão uniforme: gravação Android é AAC/MPEG-4, apesar de persistência nomear caminho `.webm`.
- Não tratar promise nativa como duração do áudio; alguns métodos resolvem após iniciar player.
- APIs de gravação dependem de permissão/runtime browser.

## Exemplo do repositório

`src/audio.native.ts` traduz `fileKey` para basename sem extensão e `PipasAudioModule` abre `assets/sounds/$name.wav`; `withUsbSerial` copia os WAVs para Android. Validar esse encadeamento ao adicionar som.

## Validação

Sem testes automatizados configurados. Faça teste manual dos estados e persistência; informe se não usou dispositivo/browser. Consulte `.claude/development/testing.md`.
