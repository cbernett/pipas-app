# Spec: navegação da área de trabalho extensa

- **Spec:** Bug / usabilidade
- **Status:** implementada; Validado manualmente.
- **Risco:** HIGH — a interação de navegação concorre com arraste, encaixe e edição de blocos em componente de alta complexidade.
- **Origem:** `pipas-app-bugs-logs.md`, seção “Área de Trabalho Limitada”.
- **Diagnóstico original:** `Workspace.tsx` tinha canvas fixo de 1200×1000 e `scrollEnabled` habilitado apenas na web, deixando os gestos de rolagem desativados no Android. As posições de blocos podiam ultrapassar a área visível.

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

## Verificação desta implementação

- [x] Pan em espaço vazio por arraste de mouse na web, pan por toque/scroll nativo em Android e iOS, mantendo os offsets existentes do `ScrollView`.
- [x] Arrastar blocos continua no fluxo próprio; eventos em área vazia fora do canvas não iniciam pan.
- [x] Coordenadas web usam o retângulo DOM já deslocado pelo scroll; coordenadas nativas usam `scrollOffset` medido. A área rolável aumenta com as dimensões/posições medidas das stacks, mantendo limites finitos.
- [x] Exportação Expo para web e Android concluída com sucesso.
- [ ] Validar interação real em Android e web com blocos nas quatro bordas, encaixe, separação, edição de parâmetros e biblioteca aberta/fechada.

O repositório não declara runner nem script de testes automatizados. `npx tsc --noEmit` continua falhando em cinco erros preexistentes fora do workspace: três tipos de eventos em `modules/pipas-usb-serial/index.ts`, um parâmetro sem tipo em `src/components/SoundRecorder.tsx`, a duração string em `src/screens/SonsScreen.tsx` e `documentDirectory` em `src/soundStorage.ts`.
