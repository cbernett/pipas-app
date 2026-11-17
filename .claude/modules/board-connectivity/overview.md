# Módulo: conectividade da placa

**Responsabilidade:** abstrair conexão USB, bytes seriais, eventos de toque/desconexão e enviar comandos para LED/motor.

**Arquivos:** `src/serial.ts` (Web Serial), `src/serial.native.ts` (Android), `src/components/BoardStatusSheet.tsx`, `src/components/BoardStatusButton.tsx`, `src/context/AppContext.tsx`, módulo `modules/pipas-usb-serial` e `plugins/withUsbSerial.js`.

As duas implementações expõem objeto `board` com API semelhante. Firmware da placa não está versionado neste projeto; protocolo precisa ser conferido com fonte de firmware/hardware antes de alteração.
