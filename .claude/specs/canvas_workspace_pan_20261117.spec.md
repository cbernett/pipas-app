# Spec: navegação da área de trabalho extensa

- **Spec:** Bug / usabilidade
- **Status:** proposta para análise; não implementada.
- **Risco:** HIGH — a interação de navegação concorre com arraste, encaixe e edição de blocos em componente de alta complexidade.
- **Origem:** `pipas-app-bugs-logs.md`, seção “Área de Trabalho Limitada”.
- **Diagnóstico no código:** `Workspace.tsx` define canvas fixo de 1200×1000 e `ScrollView`s em dois eixos. `scrollEnabled` habilita somente web e enquanto não há stack arrastada; no Android os gestos de rolagem estão desativados. As posições de blocos são coordenadas do canvas e já podem exceder a área visível.

## Contexto e problema

Programas grandes excedem o viewport e blocos fora dele ficam inacessíveis. A superfície precisa permitir mover a câmera (viewport) sobre o canvas, mantendo a posição relativa e as conexões dos blocos. A biblioteca inferior e o botão Play continuam como elementos fixos da tela, fora da navegação do canvas.

## Objetivo

Permitir navegar pelo canvas em todos os alvos suportados com mouse ou toque, sem deslocar blocos acidentalmente e sem alterar a posição lógica dos scripts.

## Escopo

**Inclui:** pan horizontal e vertical, coordenação do gesto com arraste/edição, limites de navegação, hit testing e conversão de coordenadas.

**Não inclui:** zoom, expansão infinita, reorganização automática, persistência do ponto de vista entre sessões ou mudança no modelo de dados. O canvas pode continuar limitado, desde que todos os blocos colocados sejam alcançáveis.

## Requisitos

1. Usuário pode deslocar a visualização em X e Y por gesto de arraste em espaço vazio (touch) e botão primário pressionado (web/desktop, quando aplicável).
2. Arrastar um bloco move apenas o bloco/stack; iniciar pan em cima de bloco não deve deslocá-lo. Durante edição de campo, dropdown ou gesto de encaixe, a navegação não deve capturar a interação.
3. O gesto deve permanecer contínuo até terminar/cancelar; cancelamento do sistema não pode deixar stack em estado de arraste nem `trashHover` ativo.
4. Pan não altera `stack.x`, `stack.y`, identidade, ordem, conexões ou parâmetros. Snapping e hit tests devem considerar o offset atual do canvas e continuar alinhados à renderização.
5. Canvas e conteúdo devem respeitar limites coerentes: navegação não pode mostrar área inútil ilimitada além das bordas; qualquer posição válida de bloco, inclusive a extensão visual de stacks/brackets, deve continuar alcançável.
6. A biblioteca de blocos, header, Play/Stop e pop-ups permanecem na tela e não acompanham o pan.
7. Mudança de orientação/dimensão e abertura/fechamento da biblioteca não podem desalinhar conteúdo e coordenadas de toque.
8. Manter comportamento funcional em Android e web; iOS deve ser validado se passar a ser alvo suportado.

## Critérios de aceite

- [ ] Com blocos que ultrapassem cada borda do viewport, o usuário consegue navegar até eles e retorná-los à região central.
- [ ] Pan iniciado em área vazia move a câmera nos dois eixos; iniciar em bloco preserva drag/seleção existente.
- [ ] Após pan, adicionar, mover, encaixar, separar e tocar blocos continuam usando a posição visual correta.
- [ ] A biblioteca e o botão Play permanecem fixos, inclusive durante pan junto às suas bordas.
- [ ] Um gesto interrompido não deixa drag, preview, destaque de lixeira ou offset em estado inválido.
- [ ] Verificado manualmente em Android e web com canvas vazio, stacks simples, blocos aninhados e conteúdo que exceda os quatro lados.

## Observações para implementação

- A proposta original menciona que o canvas provavelmente já se expande. O código observado usa dimensões fixas; não assumir expansão automática.
- Escolher uma única fonte de verdade para offset (scroll nativo ou transformação controlada) e aplicar a mesma transformação ao render e ao hit testing. Evitar somar offsets parcialmente em caminhos web/nativo.
- Revisar a coordenação de gestos no `Workspace.tsx` antes de adicionar mais responders: o componente já mantém implementações específicas por plataforma para arraste, divisão de stacks e arraste desde a biblioteca.
