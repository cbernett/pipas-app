# Dependências de conectividade

- Internas: `BoardStatusSheet`, `BoardStatusButton`, `AppContext`, blocos e interpretador.
- Web: Web Serial API e browser compatível.
- Android: `expo-modules-core`, `usb-serial-for-android:3.7.0`, Android USB Host/permission APIs.
- Configuração: `app.json` declara permissões e plugin; `modules/pipas-usb-serial/expo-module.config.json` autolinks módulo apenas em Android.

Contrato de plataforma: `board.isSupported`, `isConnected`, `setBaudRate`, `connect`, `disconnect`, `sendCommand`, `sendBrightness`, `sendSpeed`, `onTouch`, `onRawLine`, `onDisconnect`; `startAutoConnect` é adicional na implementação native. Conferir ambos adaptadores ao mudar chamadas compartilhadas.
