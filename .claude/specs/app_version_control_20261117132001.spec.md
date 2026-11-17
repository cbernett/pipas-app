# Spec: indicador e controle da versão da aplicação

- **Spec:** Feature
- **Status:** implementação reaplicada; exports web e Android validados.
- **Risco:** LOW — divergência entre metadados de versão e a versão exibida pode levar a uma avaliação incorreta do artefato instalado.
- **Origem:** Usabilidade do desenvolvedor.
- **Diagnóstico no código:** `app.json` define `expo.version: "1.0.0"` e Android define `android.versionCode: 50`. `package.json` também declarava `version: "1.0.0"`. O painel de conexão não tinha indicador de versão.

## Contexto e problema

O aplicativo é disponibilizado na web pela Vercel e em Android por builds Expo. Como as publicações podem ocorrer em momentos diferentes, o desenvolvedor precisa identificar rapidamente qual versão está carregada em cada ambiente.

O projeto já declara a versão em `expo.version` e usa `android.versionCode` como identificador de build. Uma versão duplicada no manifesto npm criava outra fonte que poderia divergir. A interface também não exibia a versão do app.

## Objetivo

Usar uma única versão do produto, rastreável pela configuração Expo, e exibi-la no rodapé do painel de conexão em web e Android. Documentar como incrementar a versão para cada release.

## Escopo

**Inclui:** fonte canônica de versão; remoção do campo duplicado em `package.json`; indicador no painel; convenção MAJOR.MINOR.PATCH e instrução de atualização.

**Não inclui:** automação de deploy; sincronização de publicações; identificação de commit/build no indicador; mudança na política de `android.versionCode`.

## Requisitos

1. A versão pública segue o formato `MAJOR.MINOR.PATCH` (`X.Y.Z`): MAJOR para alterações incompatíveis/grandes, MINOR para funcionalidades compatíveis e PATCH para correções/ajustes pequenos.
2. `expo.version` em `app.json` é a fonte única da versão do produto. A interface lê a configuração Expo em runtime, sem literal de versão no componente.
3. A versão duplicada de `package.json` deixa de ser mantida como valor independente.
4. `android.versionCode` continua reservado ao identificador de build Android e não é exibido como versão do produto.
5. O painel de conexão apresenta a versão no rodapé, em posição visível e sem interferir nas ações de conexão. Deve funcionar em web e Android.
6. Se a configuração não trouxer uma versão, o app não falha nem inventa um valor; exibe “Versão indisponível”.
7. O repositório documenta o procedimento de incremento. A solução usa as APIs instaladas do Expo SDK 56, sem nova dependência exclusiva para acesso à configuração além de `expo-constants`.

## Critérios de aceite

- [x] `app.json` é a única fonte canônica e a versão em `package.json` foi removida.
- [x] O painel lê e apresenta a versão Expo em runtime para web e Android.
- [x] O rótulo fica fixo no rodapé do painel, fora da área rolável, e permanece visível quando o conteúdo principal rola.
- [x] A ausência da configuração mostra “Versão indisponível” sem impedir a renderização.
- [x] `android.versionCode` não é apresentado como versão do produto.
- [x] `docs/versioning.md` explica quando e como atualizar MAJOR, MINOR e PATCH.

## Referências

- [Configuração do app no Expo SDK 56 — `version`](https://docs.expo.dev/versions/v56.0.0/config/app.md)
- [Expo Constants no SDK 56 — `Constants.expoConfig`](https://docs.expo.dev/versions/v56.0.0/sdk/constants/)
