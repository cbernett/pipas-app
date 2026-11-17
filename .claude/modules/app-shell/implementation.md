# Implementação do app shell

- `index.ts`: importa `App` e chama `registerRootComponent` do Expo.
- `App.tsx`: aplica workaround global para font scaling Android; envolve árvore com `GestureHandlerRootView`, `SafeAreaProvider` e `AppProvider`; renderiza `StatusBar`, `AppHeader`, tela escolhida (`CodigoScreen` ou `SonsScreen`) e `BoardStatusSheet`.
- `AppHeader.tsx`: oferece tabs e indicador/entrada do status da placa.
- `CodigoScreen.tsx`: envolve workspace em `ErrorBoundary`, calcula espaço de drawer e apresenta aviso de placa.
- `SonsScreen.tsx`: monta catálogo/sons do usuário, botão de microfone e drawer animado para gravar/editar.

**Inferência:** o app mantém ambas telas no mesmo ponto de composição condicional; mudança de aba pode desmontar uma tela e montar a outra. Verificar comportamento de estado visual ao mexer nisso.
