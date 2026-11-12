# Módulo: persistência local

Não há banco de dados relacional/remoto no checkout. A persistência funcional usa `localStorage` na web e AsyncStorage no nativo, mais arquivos no filesystem Android. As duas famílias são implementadas por `src/context/AppContext.tsx` (stacks) e `src/soundStorage.ts` (gravações).

Não foi criado diretório `database/` porque não há schema/migration para documentar. Consulte [fluxos de dados](../../architecture/data-flow.md) e [pontos críticos](critical-points.md).
