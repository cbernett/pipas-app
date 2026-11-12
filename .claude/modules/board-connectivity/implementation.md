# Implementação de conectividade

- Web: `serial.ts` pede porta por `navigator.serial.requestPort()` em gesto do usuário, abre com 8N1 e baud atual default 115200, alterna DTR/RTS, lê fluxo e escreve bytes.
- Android: `serial.native.ts` delega a `PipasUsbSerial`; adapta `onData` a bytes, parseia toque, emite logs e registra auto-connect para attach.
- Kotlin `PipasUsbSerialModule`: procura driver padrão, tenta `CdcAcmSerialDriver` para produtos encontrados, solicita permissão, abre primeira porta, configura serial, emite `onData`, faz tentativas de reconexão após erro e eventos de desconexão.
- `BoardStatusSheet`: controla conexão manual, retry, status, log serial de até 60 linhas e observação de plug/unplug.
- `AppContext`: debounces/agrupa pads e seleciona scripts de evento; execução envia comandos através do adapter.
- Plugin `withUsbSerial`: adiciona filtro de dispositivo USB, intent-filter/metadata e copia WAVs para assets Android.

## Protocolo que o código assume

Comentários e parser indicam pad 1–3 a partir de ASCII `'0'..'2'` na web e bytes binários `0x00..0x02` ou ASCII `'0'..'2'` no Android. Escritas incluem comandos em nibble e comandos de dois bytes para brilho/velocidade. Isto é **contrato implementado/hipótese do app, não especificação validada do firmware**.
