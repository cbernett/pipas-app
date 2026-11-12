# Implementação dos módulos nativos

## `pipas-audio`

Fachada `modules/pipas-audio/index.ts`; módulo `PipasAudioModule.kt`. Oferece play de asset WAV, play de arquivo, speed, eco/replay, trim, stop individual/all e renderização com efeitos via decode/PCM/encode AAC-M4A.

## `pipas-recording`

Fachada `modules/pipas-recording/index.ts`; `PipasRecordingModule.kt` mantém um `MediaRecorder`, grava AAC dentro de container MPEG-4 em arquivo `.m4a` dentro de cache, expõe start/stop/cancel e amplitude de pico.

## `pipas-usb-serial`

Fachada TS com `EventEmitter`; classe Kotlin registra listener USB attach, encontra driver, request permission, abre serial, emite bytes e eventos de conexão e tenta reconectar após erro.

## Registro/build

Cada `expo-module.config.json` liga classe Kotlin ao autolinking Expo. Gradle dos módulos depende de `expo-modules-core`; só USB adiciona `com.github.mik3y:usb-serial-for-android:3.7.0`. `app.json` configura o plugin local `./plugins/withUsbSerial`, que cria filtro, adiciona intent metadata e copia sons.
