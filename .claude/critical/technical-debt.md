# Débito técnico observado

Esta lista descreve manutenção potencial, sem prioridade de produto:

- Consolidar catálogo de som em fonte única (avaliar compatibilidade dos labels `fileKey`).
- Separar `liveParamValues` do componente visual e evitar ciclo `AppContext` ↔ `CodeBlock` com desenho que mantenha comportamento.
- Introduzir validação/migração versionada de JSON persistido para stacks e sons.
- Harmonizar extensão MIME/formato de áudio gravado/renderizado e testar em Android.
- Centralizar contrato do protocolo e testar parser/bytes com vetores de firmware; firmware não está neste checkout.
- Aumentar visibilidade de erro nos adaptadores e persistência em vez de catches vazios.
- Reduzir responsabilidade/tamanho de `Workspace.tsx`, `SoundRecorder.tsx`, `CodeBlock.tsx` e `AppContext.tsx` em mudanças focadas, preservando gestos.
- Criar testes automatizados para modelo/interpretador/adaptadores puros, quando infraestrutura for autorizada.
- Verificar cobertura iOS ou declarar plataforma Android/web como escopo funcional suportado.

São recomendações, não instruções para refatorar sem solicitação.
