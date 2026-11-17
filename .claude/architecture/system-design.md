# Desenho do sistema

## Inicialização e composição

`index.ts` chama `registerRootComponent(App)`. `App.tsx` envolve a aplicação com `GestureHandlerRootView`, `SafeAreaProvider` e `AppProvider`; `AppContent` exibe cabeçalho, a tela escolhida pelo estado `activeTab` e o sheet de status USB.

## Duas áreas funcionais

- **Código:** `CodigoScreen` monta `Workspace`, biblioteca inferior e aviso de placa. Workspace mantém interações de arrastar/encaixar e chama operações de `AppContext`. Os blocos e seus parâmetros são definidos em `src/data/blocks.ts` e renderizados por `CodeBlock`.
- **Sons:** `SonsScreen` monta `SoundList` e o drawer `SoundRecorder`. Gravações entram em `AppContext`, que chama `soundStorage` para persistir os arquivos e metadados.

## Execução de blocos

`AppContext` interpreta `WorkspaceBlock[]` recursivamente. Blocos `ctrl_2/3/4/5` controlam repetição/condição e filhos `innerBlocks`/`elseBlocks`; outros blocos disparam som ou comando na placa. Valores editados são lidos da `Map liveParamValues` exportada pelo componente `CodeBlock`.

## Integração com hardware

`src/serial.ts` implementa a abstração de placa na web; `src/serial.native.ts` implementa a mesma superfície para Android via `PipasUsbSerial`. `BoardStatusSheet` é a UI de conexão e mensagens. `AppContext` assina eventos de toque e executa a stack associada.

## Áudio

Sons de catálogo são chaveados por `fileKey`. Web usa `Audio`; Android usa `PipasAudio` e arquivos copiados para assets pela config plugin. Sons de usuário são gravados por uma implementação web ou módulo Android e persistidos por `soundStorage`.

## Persistência e serviços

Persistência é local ao dispositivo/navegador. Não foram identificados servidor de aplicação, banco remoto, chamadas HTTP de negócio, conta de usuário ou sync entre dispositivos. EAS/Vercel são infraestrutura de build/distribuição, não serviços chamados pela lógica funcional.
