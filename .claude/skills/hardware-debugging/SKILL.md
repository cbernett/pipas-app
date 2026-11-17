---
name: hardware-debugging
description: Use when diagnosing USB connection, serial protocol, pad events, LED or motor commands, reconnect behavior, or board hardware integration.
---

# Skill: diagnóstico de hardware

## Quando utilizar

Falhas de conexão, permissão, baud, touch events, bytes enviados, reconexão, LED/motor ou divergência web/Android.

## Leia antes

- `.claude/modules/board-connectivity/*`, `.claude/critical/security.md`, `.claude/critical/sensitive-components.md`.
- `.claude/architecture/data-flow.md`, `.claude/context/business-rules.md`.
- `BoardStatusSheet.tsx`, ambos `serial` adapters, `PipasUsbSerialModule.kt`, interpretador e plugin.

## Procedimento

1. Separe falha Metro/JS, permission/USB, serial transport, parser e regra de bloco.
2. Capture plataforma, versão do app, dispositivo/adaptador, baud, momento da falha e log local.
3. Compare bytes observados com parser de plataforma e confirme se evento chega ao `AppContext`.
4. Antes de alterar protocolo ou enviar comandos, verifique especificação/firmware: firmware não está no checkout.
5. Teste detach/reattach, permissão, tentativa manual, execução/cancelamento e versão Android relevante.

## Segurança

- Comandos podem movimentar hardware; usar setup controlado/supervisionado.
- Não elevar permissões de arquivos SUID/cache como tentativa genérica de resolver erro de DevTools desktop.
- Não interpretar `isSupported()` Android (qualquer device USB presente) como confirmação de placa compatível.

## Exemplo do repositório

O parser Android aceita bytes `0..2` e ASCII `'0'..'2'`; o web parseia caracteres numéricos para pad+1. O código diz que há debounce de 350 ms no adapter e agrupamento de 25 ms no contexto. Confirme esses limites nos arquivos atuais antes de usá-los como diagnóstico.

## Validação

Precisa de hardware real para concluir validação funcional. Se indisponível, reporte teste estático/limitado, não afirme que o comando está correto no firmware.
