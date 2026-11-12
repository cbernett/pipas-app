# Dependências do editor

- Internas: `AppContext`, `blocks.ts`, `soundData.ts`, `audio*`, `serial*`, screens e componentes entre si.
- Externas: React/React Native, gesture-handler para gesto nativo, Reanimated configurado, safe area.
- Persistência: `AppContext` salva a estrutura em AsyncStorage/localStorage.
- Hardware/áudio: interpretador chama interfaces internas de serial/áudio; detalhes nos módulos correspondentes.

Acoplamento notável: `AppContext` importa `liveParamValues` de `CodeBlock.tsx`; evitar mover/duplicar store sem revisar entrada dos valores e execução.
