# Build e implantação

## Android

`eas.json` define builds internos de desenvolvimento APK e produção AAB. O development profile inclui `expo-dev-client`, necessário para os módulos nativos próprios. EAS build cloud necessita login/credenciais e rede; build local requer Android toolchain e ambiente Expo configurado.

Mudança JS/TS pode ser carregada por Metro/Fast Refresh no development client. Mudança Kotlin, plugin, permissão, módulo nativo ou dependência nativa exige novo build.

## Web

`npm run build` executa `expo export --platform web`; configuração Vercel em `vercel.json` usa esse comando, publica `dist` e reescreve rotas para `index.html`.

## Automação

Nenhum pipeline CI/CD/workflow foi localizado. Não há evidência de processo de publicação mobile automatizado nem store metadata além do manifesto Expo. `scripts/gen-sounds.js` gera/atualiza arquivos de asset localmente, não é pipeline de deploy.
