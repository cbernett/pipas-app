# Spec: estado dos parâmetros acoplado ao componente visual

- **Spec:** Bug
- **Status:** proposta para análise; não implementada.
- **Risco:** HIGH — o executor depende de estado exportado por um componente de UI e há dependência circular entre módulos.
- **Evidências:** `src/components/CodeBlock.tsx` exporta `liveParamValues` (Map global) e campos editáveis escrevem nela; `src/context/AppContext.tsx` importa a Map para execução e eventos; `CodeBlock.tsx` também importa `useApp` do contexto.

## Contexto

Os blocos guardam valores iniciais em `BLOCK_TEMPLATES`. Ao editar um campo numérico ou dropdown, `CodeBlock.tsx` atualiza seu state local e grava a string numa Map indexada por `${blockId}_${paramIdx}`. `AppContext` lê essa Map durante interpretação, incluindo seleção de som, parâmetros de controle e busca de eventos.

## Problema

O valor usado pela lógica do programa vive em um módulo de componente visual, fora do modelo de bloco e fora do contexto React. A execução depende de uma instância global de Map compartilhada por side effect. Isso acopla UI e interpretador, dificulta teste isolado e aumenta o risco de valores obsoletos quando blocos mudam de ID, ordem de parâmetros, desmontam ou são removidos. A importação mútua `AppContext` ↔ `CodeBlock` é um ciclo de dependência.

## Objetivo

Definir uma propriedade clara para os valores editados dos parâmetros e estabelecer uma via previsível entre editor, modelo do workspace e executor, preservando comportamento e compatibilidade com stacks existentes.

## Escopo

**Inclui:** armazenamento e leitura dos valores editáveis de parâmetros; comunicação entre `CodeBlock`, workspace/contexto e executor; atualização/remoção de valores ao alterar blocos.

**Não inclui:** redesenho dos campos; migração geral da arquitetura de contexto; mudança de semântica de blocos ou comandos de hardware; persistência entre sessões (coberta pela spec [`parametros_editor_nao_persistidos_bug_20261112173815.spec.md`](parametros_editor_nao_persistidos_bug_20261112173815.spec.md)).

## Requisitos Funcionais e Não Funcionais

### Funcionais

- Um valor editado deve ser o valor que o executor usa para a mesma instância de bloco.
- Campos numéricos e dropdowns devem continuar exibindo o valor corrente durante renderizações e interações.
- Ao excluir/substituir uma instância, valores sem dono não devem afetar outra instância.
- Valores padrão devem continuar vindo de `BLOCK_TEMPLATES` quando não houver edição.
- Eventos de toque devem resolver dropdown de evento do mesmo modelo de estado usado na execução manual.

### Não funcionais

- Eliminar a dependência do contexto de execução sobre o módulo visual `CodeBlock.tsx`.
- Evitar regressão de renderização/performance em `Workspace.tsx` (componente com gestos e hierarquia aninhada complexos).
- Preservar IDs funcionais e a representação atual das stacks persistidas.
- Manter tipagem explícita de parâmetro (tipo/valor) ou uma representação equivalente fácil de validar.

## Fluxo Atual/Proposto

### Atual

```text
TextInput/Dropdown em CodeBlock
  ├─ atualiza state local do campo
  └─ grava `${blockId}_${paramIdx}` em liveParamValues global
                                      └─ AppContext lê durante execução
```

### Proposto

```text
Editor → ação tipada de atualização de parâmetro
       → store/modelo dono do workspace
       → render do bloco e executor leem a mesma fonte
```

O armazenamento deve pertencer a uma camada de dados/estado compartilhada, não ao arquivo de apresentação.

## Propostas Técnicas

1. Mover tipos e estado de parâmetro para módulo sem dependência de UI; `CodeBlock` envia alterações por callback/context/store.
2. Avaliar colocar valores atuais serializáveis no `WorkspaceBlock`, preservando `defId` e templates como defaults; alternativa é store dedicado ligado ao ciclo de vida das instâncias. Escolher uma abordagem antes de implementar, considerando persistência (spec separada), clone, undo e blocos aninhados.
3. Substituir lookup posicional frágil por identificadores de parâmetro estáveis, se isso puder ser feito com compatibilidade; caso contrário, encapsular e centralizar os índices atuais.
4. Ao remover/duplicar/extrair blocos no workspace, definir explicitamente como copiar/limpar os valores associados.
5. Remover o ciclo de imports como consequência da separação, sem mover regras funcionais para a UI.

## Critério de Aceite

- [ ] `AppContext` não importa mais símbolos de `CodeBlock.tsx`.
- [ ] Alterar um campo e executar imediatamente usa o valor exibido.
- [ ] Dropdowns de som, dispositivo, estado e evento continuam corretos.
- [ ] Número, loop e condição funcionam em blocos aninhados.
- [ ] Excluir, duplicar e extrair um bloco não vaza valores para outro ID.
- [ ] Valor default continua correto quando ainda não houve edição.
- [ ] A estrutura antiga de stacks pode ser carregada sem crash; política para valores ausentes é definida.
- [ ] Validação cobre web e Android, incluindo edição, render e execução; relatório registra o que não foi possível testar.

## Resultados Esperados

Estado de parâmetros com dono explícito, execução previsível e menor acoplamento visual/lógico. A proposta não determina ainda se o modelo do bloco ou um store dedicado será a fonte final; essa decisão precisa considerar a spec de persistência relacionada.
