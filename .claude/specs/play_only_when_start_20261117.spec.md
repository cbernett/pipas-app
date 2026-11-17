# Spec: Play inicia apenas scripts “quando iniciar”

- **Spec:** Bug de execução
- **Status:** proposta para análise; não implementada.
- **Risco:** HIGH — seleção incorreta pode acionar comandos de placa e áudio inesperados.
- **Origem:** `pipas-app-bugs-logs.md`, seção “Button Play inicializa blocos errados”.
- **Diagnóstico no código:** FAB em `Workspace.tsx` percorre cada stack não vazia e chama `triggerScript(stack.blocks)`, sem verificar o primeiro bloco. `src/data/blocks.ts` identifica “quando iniciar” por `defId: 'evt_1'`. O toque no bloco de evento segue outro fluxo (`handleEventTap`) e não deve ser alterado por esta regra.

## Contexto e problema

Play representa inicialização manual dos scripts cujo bloco de entrada é “quando iniciar”. A implementação atual também executa stacks iniciadas por eventos de toque ou por blocos de ação comuns, e portanto não respeita a semântica do botão.

## Objetivo

Definir deterministicamente os scripts elegíveis ao Play e disparar todos os elegíveis, preservando a semântica dos outros eventos e a capacidade de parar execução.

## Regras funcionais

1. Ao pressionar Play quando nada está executando, identificar apenas stacks cuja primeira instrução seja o evento `evt_1` (“quando iniciar”). Usar identidade semântica (`defId`), não posição/ordem de inserção nem texto visível como único critério.
2. Para cada stack elegível, executar a sequência completa iniciada por esse evento, incluindo blocos seguintes conectados e blocos de controle com filhos/else, conforme o executor atual.
3. Iniciar todas as stacks elegíveis na mesma ação, sem aguardar serialmente a conclusão de uma para iniciar a próxima. O contrato de concorrência de `triggerScript` deve permanecer respeitado.
4. Ignorar stacks iniciadas por “quando eu receber toque”, por ação (ex.: som), ou por qualquer outro tipo de bloco.
5. Se nenhuma stack elegível existir, não executar ações nem enviar comandos, nem entrar em estado de execução/Stop falso.
6. Pressionar Play durante execução continua acionando Stop, independentemente de quais scripts foram iniciados.
7. Eventos físicos/UI de toque mantêm seu próprio comportamento: podem iniciar a parte do script associada ao evento de toque, mas não são candidatos ao Play.
8. Uma stack desconectada de um bloco `evt_1` e que passe a começar por ação deixa de ser elegível. Um `evt_1` presente em posição interna, não inicial, não torna toda a stack elegível.

## Critérios de aceite

- [ ] `evt_1` + blocos conectados executa todos em ordem definida pelo executor.
- [ ] Duas ou mais stacks iniciadas por `evt_1` começam na mesma ação e nenhuma precisa terminar para a outra começar.
- [ ] Stack iniciada por evento de toque não é executada por Play; seu acionamento por toque continua funcionando.
- [ ] Stack iniciada por bloco de som/ação não é executada por Play.
- [ ] Canvas sem `evt_1` não produz efeito e continua com estado visual de inatividade.
- [ ] Bloco `evt_1` interno ou desconectado não inicia sequência indevida.
- [ ] Stop continua interrompendo execução e o feedback visual do FAB permanece consistente.

## Notas e limites

- O código atual tem `activeBlockId` como sinal global de atividade; múltiplos scripts concorrentes podem compartilhar esse indicador. Esta spec não exige redesenho do indicador, mas a implementação deve confirmar que iniciar várias stacks não torna Stop inacessível nem deixa estado ativo preso.
- O executor mantém efeitos já enviados à placa/áudio ao parar; Stop não é rollback.
