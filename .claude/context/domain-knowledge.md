# Conhecimento de domínio

## Conceitos funcionais

- **Bloco:** unidade de programa com `id`, `defId`, label, categoria, cor e, para controles, filhos.
- **Stack/pilha:** conjunto ordenado de blocos em uma posição do workspace (`x`, `y`); evento de toque inicia a cauda da pilha correspondente.
- **Placa:** hardware Pipas acessado por USB serial; recebe comandos e emite bytes de toque para três pads.
- **LED/motor:** atuadores endereçados por índices e comandos; estado usado por `se ... então` é mantido no interpretador, não consultado ao hardware.
- **Som de catálogo:** item associado a `fileKey` e asset WAV.
- **Som do usuário:** gravação com ID/nome/URI local e duração opcional.

## Categorias de blocos

`src/data/blocks.ts` enumera Movimento, Luz, Som, Eventos e Controle. O inventário e templates são a fonte de verdade operacional em código, não este resumo.

## Processos

1. Montar stacks arrastando itens da biblioteca.
2. Editar parâmetros diretamente nos blocos.
3. Executar uma stack manualmente ou dispará-la por toque serial.
4. Criar/editar/gravar som e selecioná-lo para reprodução por bloco.

## Inferências e limites

O app parece destinado a uma atividade educativa/experimental de programação física; essa finalidade é inferida de UI e vocabulário, não há especificação de produto no checkout. O firmware, pinout real, protocolo versionado e regras elétricas não foram incluídos.
