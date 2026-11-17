# Dependências de som

- Internas: `AppContext`, `soundStorage.ts`, `soundData.ts`, `audio*`, telas/componentes de som.
- Catálogo: `assets/sounds/*.wav` mapeados explicitamente em TS e copiados ao bundle Android por `withUsbSerial`.
- Web: `MediaRecorder`, `getUserMedia`, Web Audio API, Blob/FileReader, Canvas.
- Android: `PipasRecording` usa `MediaRecorder`; `PipasAudio` usa `MediaPlayer`, `MediaCodec`, `MediaExtractor`, `MediaMuxer`.
- Dependências Expo externas: FileSystem/AsyncStorage são usados na persistência por `soundStorage`.

Os formatos e formatos de path variam por plataforma; detalhes em [fluxo de dados](../../architecture/data-flow.md).
