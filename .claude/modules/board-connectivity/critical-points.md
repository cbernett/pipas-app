# Pontos críticos: placa

| Risco | Motivo | Cuidados e validação |
| --- | --- | --- |
| CRITICAL — protocolo/saída física | Comandos podem acionar LEDs/motores reais e códigos são hardcoded | Antes de tocar protocolo, confirmar firmware, pinagem, limites elétricos e hardware; testar com carga segura/ambiente supervisionado |
| HIGH — pares de adapter | Web e Android não são literalmente idênticos (auto-connect é nativo, parser varia) | Manter superfícies comuns alinhadas e testar a plataforma alterada |
| HIGH — permissão/reconexão USB | Kotlin tem broadcast receivers, retry e estado de intenção; bugs podem deixar recursos/estado incoerentes | Testar negar/aceitar permissão, remover cabo, reboot da placa, reconectar e desmontar |
| HIGH — handlers de receiver/manifest | `withUsbSerial` modifica manifesto e gera XML; changes afetam intent routing | Build limpo/prebuild e instalar em Android físico com placa |
| MEDIUM — baud rate | Default atual é 115200, comentários do web adapter descrevem 9600 em um trecho | Conferir baud usado pelo firmware; discrepância é observável e precisa investigação |
| MEDIUM — `isSupported` nativo | Kotlin retorna se há qualquer dispositivo USB, não se é placa compatível | UI pode anunciar suporte com outro periférico conectado |

Teste de parser sem dispositivo não está automatizado. Uma build JS no device não inclui mudança Kotlin/config plugin.
