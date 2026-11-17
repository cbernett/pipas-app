# Setup de desenvolvimento

## Pré-requisitos identificados

- Node/npm compatíveis com Expo SDK 56 (a referência SDK 56 exige Node >=20.19.x).
- Dependências npm instaladas por `npm install`.
- Para Android local: Android Studio/SDK, JDK e dispositivo/emulador configurados; para EAS cloud: conta Expo, EAS CLI e credenciais Android quando solicitadas.
- Android conectado via USB exige USB debugging apenas para instalação/debug ADB; placa Pipas conecta-se separadamente ao dispositivo.

## Primeiro setup do cliente Android

1. Instalar dependências.
2. Login EAS (`eas login`) se usar build cloud.
3. Criar o development APK com `eas build --platform android --profile development` ou build local (`npx expo run:android` com toolchain configurado).
4. Instalar o APK no device.
5. Iniciar Metro com `npx expo start --dev-client`; conectar development client e manter Metro ativo.

O `projectId` EAS já está em `app.json`. Expo Go genérico não inclui os módulos Kotlin deste app. Ver documentação versionada oficial do Expo 56 antes de mudanças Expo: <https://docs.expo.dev/versions/v56.0.0/>.
