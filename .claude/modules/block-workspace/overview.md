# Módulo: editor e execução de blocos

**Responsabilidade:** apresentar biblioteca, montar stacks visuais, editar parâmetros e executar blocos/controles ou scripts iniciados por toque.

**Arquivos centrais:** `src/data/blocks.ts`, `src/components/BlockLibraryBottomSheet.tsx`, `CategoryBand.tsx`, `CodeBlock.tsx`, `Workspace.tsx`, `RunButton.tsx`, `src/context/AppContext.tsx`.

`AppContext` contém tanto estado da interface quanto interpretador; não há AST/compilador separado. Ver [`implementation.md`](implementation.md) e [`critical-points.md`](critical-points.md).
