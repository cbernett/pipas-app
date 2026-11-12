# Módulo: módulos nativos Expo (Android)

O projeto inclui três Expo modules locais em `modules/`: `pipas-audio`, `pipas-recording` e `pipas-usb-serial`. Cada um contém fachada TypeScript, `expo-module.config.json` que registra classe Kotlin Android e projeto Gradle. Todos declaram somente `android`.

Eles são parte do binário: o development build deve ser gerado/instalado novamente após alterar Kotlin, configuração de plugin, permissões ou dependência nativa. Expo Go padrão não inclui essas implementações próprias. Veja [implementação](implementation.md), [dependências](dependencies.md) e [pontos críticos](critical-points.md).
