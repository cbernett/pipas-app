# Comandos disponíveis

Declarados em `package.json`:

| Comando | Efeito |
| --- | --- |
| `npm start` | `expo start` (Metro/dev server) |
| `npm run android` | `expo run:android` (prepara/builda/instala Android local quando toolchain está configurado) |
| `npm run ios` | `expo run:ios`; não confirma paridade dos módulos nativos Android |
| `npm run web` | `expo start --web` |
| `npm run build` | export web em `dist` |

Comandos EAS não são scripts npm deste projeto:

```sh
eas build --platform android --profile development
eas build --platform android --profile production
```

`node scripts/gen-sounds.js` é um utilitário local que grava WAVs em `assets/sounds`; examine o script antes de executar porque sobrescreve os nomes de saída que gera. Nenhum comando de teste, lint ou typecheck está declarado no `package.json`.
