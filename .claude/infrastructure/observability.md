# Logs e observabilidade

- `BoardStatusSheet` mostra monitor serial local, limitado a 60 linhas.
- O código usa `console.warn`/`console.error` em alguns erros de áudio/executor; múltiplos caminhos capturam erros sem repassar ao usuário.
- `CodigoScreen` contém `ErrorBoundary` visual restrito à tela de código.
- Não foram encontrados SDKs de crash report, telemetry, analytics, tracing, log aggregation ou alertas.
- Diagnóstico Android de falha nativa requer Android Logcat; erros de bundle e JS aparecem no terminal Metro/LogBox/React Native DevTools. DevTools pode falhar como processo desktop Linux sem necessariamente impedir Metro (ver issue RN em [`critical/known-issues.md`](../critical/known-issues.md)).

Não enviar dados de gravação/porta USB/logs a serviços externos: nenhum pipeline dessa natureza foi identificado.
