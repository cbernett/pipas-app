# Ambiente e configuração

## Configuração Expo

`app.json`: nome/slug/version, orientação retrato, ícones, iOS supportsTablet, Android package `com.pipaslabs.app`, versionCode 50, permissões USB e microfone, plugin USB e EAS projectId. Não há `app.config.js` nem arquivo `.env*` de runtime identificado.

`eas.json`: profiles `development` (developmentClient + distribuição interna + APK), `internal` (APK usando assembleRelease) e `production` (AAB); `appVersionSource` local. Leia o arquivo para detalhes vigentes.

## Ferramentas declaradas

- SDK Expo 56 e toolchain compatível do Android requerida para build local; SDK mínimo/target é materializado pelo prebuild/Expo e não há diretório `android/` no checkout examinado.
- TypeScript strict via `expo/tsconfig.base`.
- Babel usa preset Expo e plugin Reanimated.

## Segredos e variáveis

Não foram encontrados `.env`, variáveis `process.env` de produto, chaves API nem secret manager. `extra.eas.projectId` é identificador público de projeto, não segredo de autenticação.

Para alterar configuração Expo, consultar antes a versão exata em <https://docs.expo.dev/versions/v56.0.0/>.
