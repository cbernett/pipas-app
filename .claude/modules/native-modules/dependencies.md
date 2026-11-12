# Dependências nativas

- Expo Modules Core e Kotlin/Android SDK conforme configuração do build gerado Expo.
- USB Serial Android 3.7.0 via JitPack/Maven em `modules/pipas-usb-serial/android/build.gradle`.
- Android MediaRecorder/MediaPlayer/MediaCodec/MediaExtractor/MediaMuxer para áudio.
- Módulos TypeScript chamam `requireNativeModule('PipasAudio'|'PipasRecording'|'PipasUsbSerial')`.
- Chamadores TS: `audio.native.ts`, `serial.native.ts`, `SoundRecorder.tsx`, `AppContext.tsx`.

**Não verificado:** compatibilidade com versões específicas de dispositivos, SDK Android e formato real de hardware; validar build e aparelho após alteração.
