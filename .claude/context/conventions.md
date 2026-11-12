# Convenções observadas

## Existentes

- TypeScript/TSX para app; Kotlin para módulos Android; JavaScript CommonJS para Babel/config plugin/scripts.
- Componentes React em PascalCase; módulos/funções em camelCase; IDs funcionais de blocos usam strings como `mov_1`, `evt_touch_1`, `ctrl_2`.
- Arquivos de tela/componentes em `src/screens` e `src/components`; dados estáticos em `src/data`.
- Textos da interface predominantemente em português brasileiro.
- Tipagem strict ativada por `tsconfig.json` (`expo/tsconfig.base`).
- Adaptação por plataforma com sufixo `.native.ts` e `Platform.OS`.
- `babel-preset-expo` e plugin Reanimated registrados em `babel.config.js`.
- Há catches que convertem falhas opcionais em no-op e logs com `console.warn`; comportamento varia por área.

## Não estabelecido formalmente

Não há ESLint/Prettier, padrão de commits, cobertura de testes, linter, regra de import order ou guia de API documentado no manifesto atual. Não impor formatação automática como convenção existente.

## Recomendação para agentes (não é padrão implementado)

Manter nomes/contratos de adaptadores de plataforma alinhados, evitar duplicar catálogo de sons, preferir erros observáveis a catches vazios e adicionar testes quando a infraestrutura de testes for introduzida. Propostas devem acompanhar mudança concreta; não reestruturar por iniciativa própria.
