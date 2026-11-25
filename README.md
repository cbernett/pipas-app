# Pipas App

Aplicativo da Pipas Labs para criar programas visuais e controlar a Placa Pipas. Monte sequências com blocos de eventos, movimento, luz, som e controle; conecte a placa por USB para executar comandos; e explore ou grave sons para usar nos programas.

## Funcionalidades

- Editor visual com blocos arrastáveis, parâmetros configuráveis e estruturas de repetição e condição.
- Comandos para LEDs, motores, sensores de toque e reprodução de sons.
- Conexão USB serial com a Placa Pipas no Android e na web compatível.
- Biblioteca de sons integrada e gravação de sons personalizados no dispositivo.
- Interface web e aplicativo Android, com módulos nativos Expo para as funções de áudio, gravação e USB no Android.

## Requisitos

- Node.js e npm.
- Android Studio e Android SDK para executar ou compilar a versão Android localmente.
- Um dispositivo Android e uma Placa Pipas conectável por USB para testar a comunicação com hardware.
- Para conexão USB na web, um navegador com suporte à Web Serial e uma porta USB disponível.

O projeto usa Expo SDK 56, React Native e TypeScript. Como há módulos nativos locais, o app Android precisa de um development build ou build próprio; o Expo Go não inclui esses módulos.

## Começar

Instale as dependências:

```bash
npm install
```

Inicie o servidor de desenvolvimento:

```bash
npm start
```

Para abrir a versão web:

```bash
npm run start:web
```

Para iniciar o app Android com o development build:

```bash
npm run start:android
```

Na primeira configuração local do Android, gere o projeto nativo e instale o app no dispositivo ou emulador:

```bash
npm run run:android
```

O comando `run:android` usa o Android Studio/SDK instalado na máquina. Para dispositivos físicos, conecte o aparelho com depuração USB habilitada.

## Build

Os perfis de build estão em `eas.json`. Com a CLI do EAS instalada e autenticada, use:

```bash
# Android e iOS, development build
npm run build:dev

# Android e iOS, produção
npm run build:prod

# Somente Android, produção
npm run build:android:prod
```

Também é possível exportar os bundles:

```bash
npm run export:web
npm run export:android
npm run export:ios
```

Os módulos nativos personalizados presentes neste repositório têm implementação Android. A exportação ou build para iOS não adiciona suporte iOS a esses módulos.

## Uso

1. Abra a aba **Código** e arraste blocos da biblioteca para o espaço de programação.
2. Edite os valores e conecte os blocos para montar uma sequência.
3. Conecte a Placa Pipas por USB e confirme a conexão no painel de status.
4. Execute o programa pelo botão de execução. Blocos de som também podem ser usados sem a placa.
5. Na aba **Sons**, selecione sons da biblioteca ou grave um som personalizado.

No navegador, a conexão USB depende do suporte do navegador à Web Serial e da autorização concedida ao selecionar a porta da placa. No Android, o sistema solicita a permissão USB ao conectar o hardware.

## Estrutura do projeto

```text
.
├── App.tsx                    # Entrada e composição principal da interface
├── app.json                   # Configuração Expo e metadados do app
├── eas.json                   # Perfis de build do EAS
├── modules/                   # Módulos Expo locais para recursos nativos Android
├── plugins/                   # Configuração nativa do USB e dos assets de áudio
├── src/
│   ├── components/            # Editor, blocos, conexão e componentes de som
│   ├── context/                # Estado e execução dos programas
│   ├── data/                   # Definições dos blocos e sons
│   ├── screens/                # Telas Código e Sons
│   ├── audio.ts                # Reprodução de áudio na web
│   ├── audio.native.ts         # Reprodução de áudio no Android
│   ├── serial.ts               # Comunicação USB via Web Serial
│   └── serial.native.ts        # Comunicação USB serial nativa Android
└── docs/
    └── versioning.md           # Política de versionamento da aplicação
```

## Versão

A versão pública do aplicativo é definida em `expo.version`, no arquivo `app.json`. Antes de publicar, atualize esse valor seguindo a política descrita em [`docs/versioning.md`](docs/versioning.md). O `android.versionCode` é um contador de build Android separado.

## Contribuição

Contribuições são bem-vindas. Abra uma issue para descrever uma mudança ou problema e envie um pull request com o escopo da alteração e instruções para reproduzir ou validar o comportamento.

## Licença

Este repositório inclui a licença MIT em [`LICENSE`](LICENSE).
