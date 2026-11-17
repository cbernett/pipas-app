# Pontos críticos: editor e execução

| Risco | Local/razão | Cuidados e validação |
| --- | --- | --- |
| HIGH — contrato dos blocos | `blocks.ts`, `CodeBlock.tsx`, `AppContext.tsx`, `Workspace.tsx` compartilham `id`, `defId`, índices e filhos | Verificar catálogo, edição, persistência antiga, execução e blocos aninhados |
| HIGH — execução assíncrona/abort | `AppContext.executeScript`, `stopRun`, callbacks de toque e timers | Testar cancelar loop, novo script durante execução e desconexão USB; side effects já enviados não são revertidos automaticamente |
| HIGH — geometria/gestos | `Workspace.tsx` (mais de mil linhas), métricas/hit tests específicos por plataforma | Validar drag, encaixe, extração de bracket, scroll, dropdown/input e gesto nativo em Android e web |
| MEDIUM — valores live fora do React | `liveParamValues` global em `CodeBlock.tsx`, chaves por ID/índice | Renomear template/mudar índice pode desconectar valor editado; estado não é explicitamente persistido com stacks |
| MEDIUM — labels usados por regra | Fallbacks no executor e detecção de waits/eventos | Alterar texto pode mudar semântica; preferir analisar uso de todos os labels |
| MEDIUM — estado condicional local | `deviceStateRef` é previsão local após comandos, não leitura física | Não tratá-lo como telemetria confiável |

**Validação manual mínima:** criar stack simples e aninhada, editar parâmetros, salvar/recuperar, iniciar/parar, verificar evento de toque e cada plataforma aplicável. Não há testes automatizados configurados.
