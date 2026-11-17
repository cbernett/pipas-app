# Spec: valores de parâmetros editados não persistem

- **Spec:** Bug
- **Status:** hipótese de bug baseada na estrutura atual; comportamento de reinstalação/recarga deve ser reproduzido antes de implementação.
- **Risco:** MEDIUM — programas restaurados podem reabrir com valores padrão em vez das escolhas feitas pelo usuário.
- **Evidências:** `AppContext.tsx` serializa `BlockStack[]` em `pipas_stacks_v1`; `liveParamValues` em `CodeBlock.tsx` não integra `WorkspaceBlock` nem o JSON salvo. Campos inicializam usando Map ou o valor template.

## Contexto

As stacks são gravadas em `localStorage` na web ou AsyncStorage no nativo. Instâncias de bloco persistem `id`, `defId`, label, category, color e eventuais filhos. Os campos numéricos e dropdowns mantêm edição numa Map em memória, separada do conteúdo persistido das stacks.

## Problema

Ao iniciar uma nova sessão do app, a Map de módulo é reconstruída vazia, mas as stacks podem ser carregadas do armazenamento. Na ausência de valor live, os campos usam os defaults de `BLOCK_TEMPLATES`. Assim, é possível que a interface e o programa restaurado percam valores customizados entre sessões. Esse resultado é inferido pelo fluxo estático e precisa ser confirmado em web e Android; não há teste automatizado ou reprodução de usuário anexada.

## Objetivo

Persistir os valores de parâmetros editados junto à representação do programa (ou por mecanismo com vínculo inequívoco às instâncias), restaurando-os corretamente sem quebrar stacks já armazenadas.

## Escopo

**Inclui:** representação, serialização, carregamento e compatibilidade dos valores de campos numéricos e dropdowns em blocos simples/aninhados.

**Não inclui:** alteração da semântica de execução, catálogo de blocos, sincronização remota, exportação/importação de projetos ou solução completa de undo/redo.

## Requisitos Funcionais e Não Funcionais

### Funcionais

- Depois de editar parâmetros e fechar/reabrir o app, o mesmo programa deve apresentar e executar os valores salvos.
- Deve funcionar em `innerBlocks` e `elseBlocks`.
- Stacks antigas sem propriedades de parâmetros devem carregar com defaults definidos pelos templates.
- Blocos duplicados devem manter ou reinicializar parâmetros conforme decisão de produto explícita; não devem compartilhar edições acidentalmente.
- Alterar dropdown de evento deve manter a correspondência entre valor exibido e script iniciado pelo pad.

### Não funcionais

- Formato JSON deve ter estratégia compatível/versionável, sem descartar silenciosamente dados antigos.
- Persistir apenas valores necessários, sem assets/objetos não serializáveis.
- Evitar gravação excessiva em storage para cada tecla se houver impacto perceptível; debounce ou commit pode ser avaliado.
- A restauração deve tratar JSON inválido/versões futuras com erro recuperável e diagnóstico suficiente.

## Fluxo Atual/Proposto

### Atual

```text
edição do parâmetro → Map em memória
stacks → JSON em localStorage/AsyncStorage
reinício → stacks restauradas; Map vazia → template/default
```

### Proposto

```text
edição → estado serializável ligado ao bloco
estado completo do programa → localStorage/AsyncStorage
reinício → valida/migra formato → render e executor leem valores restaurados
```

## Propostas Técnicas

1. Coordenar implementação com a spec de desacoplamento de `liveParamValues`; evitar criar uma segunda fonte de valores.
2. Preferir valores atuais serializáveis no `WorkspaceBlock` ou um documento de programa versionado que preserve a associação por ID estável; documentar tradeoffs antes da mudança.
3. Implementar leitura tolerante do formato antigo: propriedade ausente significa template default; dados conhecidos devem sobreviver a gravações subsequentes.
4. Definir comportamento para blocos duplicados/IDs reciclados e alterações futuras no schema.
5. Confirmar a reprodução no app antes da correção: editar um valor, encerrar/reabrir completamente e observar valor visual e resultado executado nas duas plataformas.

## Critério de Aceite

- [ ] Reprodução atual confirmada ou refutada e resultado anexado à implementação.
- [ ] Valores numéricos e dropdowns permanecem após reinício completo em web e Android.
- [ ] Blocos de controle aninhados restauram parâmetros e children.
- [ ] Uma stack antiga sem dados de parâmetros usa defaults sem crash.
- [ ] Duplicar/excluir blocos não mistura valores entre instâncias.
- [ ] Dados persistidos inválidos são tratados de modo recuperável e diagnosticável.
- [ ] Executor usa os valores restaurados, não somente a apresentação.

## Resultados Esperados

Programas locais retomam as escolhas do usuário após reiniciar o app; dados antigos continuam carregáveis. O risco permanece hipótese até ser reproduzido contra os clientes atuais.
