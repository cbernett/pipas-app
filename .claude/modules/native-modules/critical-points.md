# Pontos críticos: módulos nativos

| Risco | Motivo | Cuidados/validação |
| --- | --- | --- |
| CRITICAL — USB pode acionar hardware | escrita serial afeta placa e atuadores | conferir firmware e testar em hardware supervisionado |
| HIGH — ciclo de vida/permissões | BroadcastReceiver, PendingIntent, MediaRecorder e MediaPlayer precisam liberar recursos | validar cancelamento, permissão negada, detach, rebuild/reinstall e repetidas sessões |
| HIGH — contrato JS/Kotlin | nomes de módulo, parâmetros, promessa/eventos e shape dos eventos são contratos em runtime | manter `index.ts` e Kotlin sincronizados; build/install Android depois |
| HIGH — renderização codec | caminhos do MediaCodec dependem de MIME, canal, tamanho e codec device | validar arquivos gerados com playback, trim e erros de encoder |
| HIGH — alteração exige novo binário | Kotlin/autolinking/config plugin não chega pelo Fast Refresh | gerar development build novo; cache JS não incorpora código nativo |
| MEDIUM — plataformas não simétricas | módulos listam apenas Android | não afirmar suporte iOS sem implementação |

Validação mínima após mudanças: build Android limpo, instalação em device/emulador adequado, fluxo específico do módulo e inspeção de log nativo; os comandos estão em `development/`.
