# Módulo: app shell

**Responsabilidade:** inicializar providers, compor o layout e alternar as telas de código e sons.

**Arquivos:** `index.ts`, `App.tsx`, `src/screens/CodigoScreen.tsx`, `src/screens/SonsScreen.tsx`, `src/components/AppHeader.tsx`, `src/context/AppContext.tsx`.

Não existe roteador: `activeTab` do contexto escolhe condicionalmente uma tela em `App.tsx`. O contexto também fornece a execução de blocos e persistência, assunto descrito em [`../block-workspace/overview.md`](../block-workspace/overview.md).

**Dependências de infraestrutura:** React Native, Expo, Safe Area Context, Gesture Handler.

**Plataformas:** o shell usa Platform para pequenos ajustes de Android/web; veja [implementação](implementation.md) e [pontos críticos](critical-points.md).
