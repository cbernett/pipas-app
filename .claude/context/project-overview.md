# Contexto do projeto

## O que é

Aplicação cliente chamada **App Pipas Labs** (`app.json`), voltada a criar sequências de blocos de programação e operá-las com uma placa Pipas por USB. Também oferece catálogo de efeitos/sons e gravação de sons pelo usuário.

## Stack declarada

- Expo `~56.0.12`, React Native `0.85.3`, React `19.2.3`, TypeScript `~6.0.3`, Expo Dev Client `~56.0.28`.
- Android nativo em Kotlin em módulos Expo locais; web em React Native Web.
- Interfaces funcionais em português.

## Plataformas e capacidade

Android é a plataforma que integra USB Serial, gravação nativa e MediaPlayer. Web oferece gravação e áudio via APIs do browser, e USB via Web Serial (navegador compatível). Embora haja scripts de iOS, os módulos locais listam somente Android; paridade iOS não está demonstrada.

## Entrada

`package.json.main` é `index.ts`; este registra `App.tsx` com Expo. O mapa de arquivos está em [`../architecture/components.md`](../architecture/components.md).
