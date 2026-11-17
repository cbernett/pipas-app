# Spec: extensão do arquivo de áudio Android incompatível

- **Spec:** Bug
- **Status:** inconsistência estática; falha de reprodução ainda precisa ser reproduzida em dispositivo.
- **Risco:** MEDIUM — extensão de arquivo pode confundir ferramentas e lógica que infere formato pelo sufixo; o impacto no MediaPlayer não foi confirmado.
- **Evidências:** `PipasRecordingModule.kt` grava com `MediaRecorder.OutputFormat.MPEG_4` e `AudioEncoder.AAC` em arquivo `.m4a`; `PipasAudioModule.kt` renderiza em container MPEG-4/AAC; `soundStorage.ts` copia o arquivo para `pipas_sound_<id>.webm`.

## Contexto

No Android, gravação nativa é criada no cache como arquivo `.m4a`. Se o usuário aplica efeitos/trim, `PipasAudio.renderWithEffects` gera também saída MPEG-4/AAC com sufixo `_fx.m4a`. `soundStorage.saveSound` copia a URI/path recebida para o diretório de documentos, mas escolhe sempre a extensão `.webm`. Metadados guardam o caminho resultante e `PipasAudio.playFile` passa esse caminho ao `MediaPlayer`.

## Problema

O sufixo do arquivo persistido diz WebM, enquanto o container/codec produzido pelo app é MPEG-4/AAC. Não está confirmado que `MediaPlayer` falhe por causa da extensão, pois recebe um caminho e pode detectar o conteúdo; ainda assim, a discrepância é enganosa e pode quebrar inspeção, manutenção, compartilhamento ou consumidores que dependam da extensão.

## Objetivo

Alinhar nome/extensão persistidos ao formato real do áudio Android e assegurar que gravação normal e renderizada continuem funcionando depois de salvar, reiniciar, editar e excluir.

## Escopo

**Inclui:** nome de destino Android em `soundStorage.ts`, consistência de MIME/extensão, leitura de registros existentes e validação de playback/render.

**Não inclui:** mudar codec/container, converter gravações existentes, alterar armazenamento web (que guarda Base64 a partir de Blob URL), ou redesenhar gravação.

## Requisitos Funcionais e Não Funcionais

### Funcionais

- Arquivos persistidos devem ter extensão correspondente ao container real gerado.
- Áudio bruto gravado e áudio renderizado devem ser salvos, carregados, reproduzidos, editados e removidos corretamente.
- Registros antigos cujo caminho termina em `.webm` devem continuar acessíveis ou ser migrados sem perda, com fallback documentado para arquivo ausente.
- Uma edição deve apontar para o arquivo de saída correta, preservando original ou substituindo-o segundo comportamento definido.

### Não funcionais

- Migração deve ser idempotente, limitada aos arquivos esperados e não sobrescrever dados sem verificar origem/destino.
- O armazenamento não deve inferir o codec apenas do nome exibido do som.
- Falhas de cópia/migração devem ser diagnosticáveis e não apagar a gravação original.
- Não alterar dependência nativa ou codec sem necessidade comprovada.

## Fluxo Atual/Proposto

### Atual

```text
MediaRecorder → rec_<timestamp>.m4a (AAC/MPEG-4)
render opcional → rec_<timestamp>_fx.m4a (AAC/MPEG-4)
soundStorage → Documents/pipas_sound_<id>.webm
AsyncStorage guarda path .webm → MediaPlayer recebe path
```

### Proposto

```text
gravação/render → arquivo com formato conhecido
persistência Android → destino com extensão coerente (.m4a, caso o codec atual seja mantido)
metadados → path real e formato validado
carregamento/playback → arquivo existente e decodificável
```

## Propostas Técnicas

1. Confirmar em Android real os bytes/container de arquivo gravado e renderizado e reproduzir o fluxo atual (`record → save → relaunch → play`).
2. Mantendo AAC/MPEG-4, alterar o destino de persistência Android para `.m4a`; não renomear a fonte temporária antes da cópia bem-sucedida.
3. Definir compatibilidade para registros `v1` com `.webm`: a opção mais simples é continuar lendo o path salvo existente e aplicar a extensão correta apenas para novos arquivos; renomeação/migração física requer análise cuidadosa de dados e atualização atômica dos metadados.
4. Centralizar a extensão/formato Android para gravação e renderização, ou tornar explícito o formato no metadado, se coexistirem formatos no futuro.
5. Verificar `saveSound`, `loadSounds`, `deleteSound`, edição via `SonsScreen` e reprodução via `AppContext` após implementação.

## Critério de Aceite

- [ ] Gravação sem efeito salva como arquivo cuja extensão e conteúdo correspondem a MPEG-4/AAC.
- [ ] Gravação editada/renderizada salva e toca após encerramento completo e reabertura do app.
- [ ] Arquivos existentes apontados por metadados antigos continuam tocáveis ou recebem migração segura e idempotente.
- [ ] Se a cópia falhar, arquivo-fonte não é apagado e a falha fica observável.
- [ ] Editar, salvar novamente e excluir remove os arquivos esperados sem apagar gravação alheia.
- [ ] O fluxo web permanece inalterado e validado separadamente.
- [ ] Resultado em pelo menos um Android suportado é registrado; suporte adicional não é presumido.

## Resultados Esperados

Extensão dos arquivos persistidos alinhada ao formato efetivamente produzido e gravações Android previsíveis ao recarregar. A spec não afirma que a extensão atual seja a causa direta de falha no `MediaPlayer`; essa hipótese deve ser verificada antes de ampliar a correção.
