---
name: android-native-module
description: Use when adding or modifying Pipas Labs Expo modules, Kotlin code, Android permissions, autolinking, or config plugins.
---

# Skill: módulo nativo Android

## Quando utilizar

Mudanças em `modules/*/android`, fachada nativa TS, `expo-module.config.json`, `app.json`, Gradle ou `plugins/withUsbSerial.js`.

## Leia antes

- `.claude/infrastructure/environment.md`, `.claude/development/setup.md`.
- `.claude/modules/native-modules/{overview,implementation,critical-points}.md`.
- `.claude/critical/security.md` e `.claude/critical/change-impact.md`.
- Documentação exata do SDK: <https://docs.expo.dev/versions/v56.0.0/>. Consulte a navegação “Expo Modules API” disponível nessa versão antes de alterar a API nativa.
- Examine facade `modules/<name>/index.ts`, Kotlin, config JSON e todos os callers.

## Procedimento

1. Defina API TS↔Kotlin com nomes, tipos, eventos e erros correspondentes.
2. Verifique permission lifecycle, receiver cleanup, thread, codecs/files, compatibilidade Android e eventual integração plugin.
3. Preserve module name, package/namespace e registro autolinking.
4. Se tocar USB, confirme protocolo/firmware fora deste repositório antes de mudar bytes/comandos.
5. Faça build Android novo (Fast Refresh não atualiza Kotlin/plugin) e instale no dispositivo.

## Convenções e restrições

- Módulos atuais declaram Android apenas; não reivindique suporte iOS por herança.
- Não introduza dependência nativa sem revisar lockfile/Gradle e efeito no development build.
- Não conceda permissões/perfis mais amplos do que fluxo requer.
- Operações da placa podem acionar hardware real; exigir validação adequada.

## Exemplo do repositório

`PipasUsbSerial` é exposto pelo `requireNativeModule('PipasUsbSerial')`; Kotlin declara `Name("PipasUsbSerial")` e eventos `onData`, `onDisconnect`, `onError`, `onDeviceAttached`. Ao adicionar método, atualize ambos os lados e callers.

## Critérios de validação

Build limpo, instalação em Android, fluxo nominal e erro/permissão; USB exige placa/firmware compatíveis. Consulte `.claude/development/testing.md` e registre o que não foi possível executar.
