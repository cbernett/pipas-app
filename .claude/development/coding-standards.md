# Padrões de código

## Evidência observada

- TypeScript strict; React function components/hooks; UI em TSX.
- Kotlin para Android native module; JS CommonJS em configuração/plugin/script.
- Pastas `screens`, `components`, `context`, `data`; `modules` para Expo modules locais.
- Adaptação `.native.ts` + arquivo TS genérico para serial e áudio.
- Português brasileiro na UI e nomes funcionais de blocos; IDs técnicos curtos e estáveis.

## Regras práticas para alterações

- Preservar interfaces compartilhadas web/native.
- Atualizar todos os mapas/listas quando mexer em som ou bloco; veja módulo crítico.
- Preservar formato de storage ou documentar migração.
- Para Expo, seguir docs SDK 56; usar `npx expo install` para dependências Expo-alinhadas.
- Evitar dep nova se código existente cobre a necessidade; verificar efeito no build nativo.

## O que não foi padronizado

Não há prettier/eslint/guia de imports/nomenclatura de testes/abstração formal de erros. Recomendações acima são orientação para consistência, não existência de uma política automatizada.
