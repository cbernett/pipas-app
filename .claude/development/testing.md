# Testes e validação

## Estado atual

Não há diretório de testes, runner (Jest/Vitest/etc.), configuração E2E ou script de test no manifesto atual. O campo `testID` localizado em UI não significa que haja suíte configurada. Cobertura automatizada não foi identificada.

## Validação manual recomendada por mudança

- Shell/tela: abrir Código e Sons, alternar abas, verificar safe areas e modais Android/web.
- Workspace: criar stack, reordenar/encaixar, editar campos, bloco bracket/else, excluir, reiniciar app para conferir persistência.
- Execução: script simples, controles aninhados, cancelar `sempre`, reiniciar durante execução, disparar evento.
- Placa: conectar/desconectar, permissão, monitor, touch e comando real apenas com firmware/hardware compatíveis.
- Som: reproduzir itens do catálogo, gravar, preview, trim/efeito, salvar, reiniciar app, editar/remover e usar som em bloco.
- Nativo/config: build Android novo e instalação; validação apenas no Metro não cobre Kotlin/config plugins.
- Web: `npm run build` quando aplicável e validação no browser alvo; Web Serial exige browser compatível.

Esta lista é orientação de validação, não evidência de execução. Registre ambiente/plataforma e passos realmente feitos ao reportar resultado.
