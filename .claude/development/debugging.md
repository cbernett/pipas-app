# Depuração

- **Metro/JS:** iniciar `npx expo start --dev-client`; observar erros de transformação/runtime no terminal e overlay do cliente.
- **Fast Refresh:** edição JS/TS costuma refletir sem rebuild quando development build está conectado ao Metro. Módulo Kotlin/permissão/plugin/dep nativa pede rebuild e reinstalação.
- **React Native DevTools:** abrir pelo menu dev/atalho `j` no terminal Expo quando disponível. O erro de `chrome-sandbox` no Linux pode ser não fatal para Metro; se o QR/servidor aparece, o bundle ainda pode ser servido. Não alterar permissões SUID de cache sem entender o ambiente.
- **Android nativo:** usar Android Studio/Logcat e logs de Gradle para Kotlin/USB/MediaCodec; terminal JS não substitui log nativo.
- **Web:** inspecionar console e permissões do browser para Web Serial, microfone e Web Audio; testar contexto seguro e browser compatível.
- **Placa:** monitor serial `BoardStatusSheet` apresenta mensagens locais; conferir baud, dispositivo, permissão e protocolo com firmware.

Expo SDK 56 referência: <https://docs.expo.dev/versions/v56.0.0/>. Dev client: <https://docs.expo.dev/versions/v56.0.0/sdk/dev-client/>.
