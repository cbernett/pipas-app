# Spec: exclusão previsível de blocos e scripts

- **Spec:** Bug / melhoria de interação
- **Status:** proposta para análise; não implementada.
- **Risco:** HIGH — exclusão acidental remove conteúdo; cancelamento incompleto pode deixar blocos inacessíveis.
- **Origem:** `pipas-app-bugs-logs.md`, seção “Exclusão de bloco ineficiente”.
- **Diagnóstico no código:** `Workspace.tsx` considera a zona inferior por coordenada Y de tela e alterna sua altura entre 64 px (biblioteca fechada) e 340 px (aberta). `BlockLibraryBottomSheet` mostra sobreposição de lixeira quando `trashHover` está ativo. A lógica atual não mede o hitbox real do handle; no nativo o drag de stack e overlay também têm caminhos separados.

## Contexto e problema

Apagar exige levar o conteúdo muito para baixo, sob a biblioteca. Soltar fora da tela pode deixar conteúdo fora de alcance. A intenção de exclusão deve ser identificada pela posição do ponteiro/toque, com feedback claro, sem depender de quanto do bloco está oculto.

## Objetivo

Tornar o descarte por arraste previsível e oferecer um menu contextual expansível para excluir bloco ou script sem arraste.

## Requisitos: arraste para excluir

1. A zona de descarte corresponde a uma área interativa definida pela geometria real do handle/menu da biblioteca, disponível tanto aberta quanto fechada; não inferir a intenção pela caixa do bloco arrastado ou por percentual oculto.
2. O ponteiro/toque do usuário determina a entrada na zona. Ao entrar, mostrar affordance explícito de descarte (ícone/texto/realce) e manter visível o suficiente para confirmar a ação.
3. Soltar dentro da zona confirmada exclui a unidade arrastada; soltar fora reposiciona/encaixa normalmente.
4. Se o usuário soltar o gesto fora da área utilizável, ou o gesto for cancelado/interrompido, restaurar a unidade à posição/stack válida anterior. Não deixar blocos órfãos, ocultos ou inacessíveis.
5. Definir e manter comportamento consistente para arrastar stack inteira, destacar bloco intermediário (split) e overlay resultante. A exclusão da porção destacada deve apagar somente a porção que está sendo arrastada; a porção que permaneceu não pode desaparecer.
6. Mudança de estado da biblioteca durante o arraste não deve deslocar a zona sem atualizar o hit test e o feedback.
7. O alvo não deve ser ativado apenas porque a caixa do bloco cruza a borda inferior; a posição do contato é que conta.

## Requisitos: menu contextual

1. Pressionar e segurar um bloco em touch ou usar clique direito em web abre menu contextual ancorado ao bloco, sem disparar execução, edição ou arraste.
2. Menu contém ação “Apagar” (ícone e rótulo acessíveis) e fecha ao escolher ação, tocar fora, pressionar Escape (web) ou cancelar sistema.
3. A estrutura de ações deve aceitar novos itens no futuro, com identificador estável, rótulo, estado habilitado e handler; a interface não deve codificar um menu de uso único com somente um botão hard-coded.
4. A exclusão por menu aplica as mesmas regras de escopo que arraste: um bloco não inicial pode ser removido sem apagar irmãos; escolher bloco inicial/script remove a sequência conectada correspondente. Antes da implementação, confirmar UX exata para excluir um bloco individual que mantém cauda conectada.
5. Menu funciona sobre área visível e evita ficar recortado pelas bordas do viewport ou pela biblioteca.

## Critérios de aceite

- [ ] Em biblioteca aberta ou fechada, alcançar a área do handle com o ponto de contato mostra estado de descarte antes de soltar.
- [ ] Soltar na área apaga o alvo uma única vez; soltar fora preserva o conteúdo e posição resultante válida.
- [ ] Cancelamento do gesto restaura stack/overlay e limpa `trashHover`/preview.
- [ ] Excluir durante drag de stack inteira, bloco intermediário e overlay produz o escopo esperado sem perdas colaterais.
- [ ] Long press e clique direito abrem o mesmo conjunto de ações; abrir o menu não executa o bloco.
- [ ] “Apagar” no menu remove o alvo correto e fecha o menu; Escape/clique fora/cancelamento apenas fecha.
- [ ] O menu aceita uma ação futura sem reescrever a lógica de posicionamento, abertura/fechamento e seleção.
- [ ] Testado manualmente em Android e web; validar feedback visual, teclado/acessibilidade web e a interação com campos editáveis.

## Decisões pendentes para produto

- Confirmar se a zona de descarte é apenas o handle da biblioteca ou um alvo sobreposto de maior área alinhado a ele. O relato pede alcançar o topo do hitbox do botão de menu; esta spec interpreta o alvo como zona de descarte claramente visível associada ao handle.
- Confirmar semântica do menu ao apagar bloco do meio: remover só o bloco e conectar seus vizinhos, ou separar/remover a cauda. Até essa regra ser decidida, preservar conexões sem transformação implícita destrutiva.
