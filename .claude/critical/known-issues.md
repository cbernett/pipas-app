# Problemas e inconsistências observadas

Achados estáticos no checkout, sem alteração/correção nesta atividade:

1. **Catálogo repetido:** catálogo de `SoundList.tsx` diverge estruturalmente do catálogo compartilhado `src/data/soundData.ts`; há mapas também em `blocks.ts`, `audio.ts` e `audio.native.ts`. É fácil esquecer uma cópia ao incluir um som.
2. **Formato Android registrado com extensão `.webm`:** Kotlin grava/renderiza AAC em container MPEG-4 `.m4a`, porém `soundStorage.ts` copia o destino para `pipas_sound_<id>.webm`. O caminho é passado a MediaPlayer; a extensão pode não impedir decodificação, mas é enganosa/inconsistente. Confirmar comportamento no device.
3. **Comentários/protocolo inconsistentes:** `serial.ts` header menciona baud 9600, enquanto valor default efetivo é 115200. Parser web converte byte `'0'`→pad 1; native parser aceita bytes binários 0–2 e ASCII 0–2. Sem firmware não se pode declarar qual convenção está correta.
4. **Contexto importa do componente visual:** `AppContext.tsx` importa `liveParamValues` de `CodeBlock.tsx` e este componente importa `AppContext`; há acoplamento cíclico de módulo.
5. **Estado de parâmetros não acompanha serialização:** stacks persistidas não incluem explicitamente valores `liveParamValues`; ao remontar, valores editados podem permanecer apenas na Map de runtime e dependem do bloco ainda renderizado.
6. **iOS aparenta paridade incompleta:** scripts/config iOS existem, mas módulos locais declaram Android apenas e APIs nativas de áudio/serial são chamadas fora do web; execução funcional iOS não está confirmada.
7. **Erros de persistência muitas vezes silenciosos:** load/save/delete de storage capturam falhas, limitando diagnóstico.

## Depuração DevTools Linux

Há relato aberto/encerrado como completado no React Native upstream para mensagem equivalente; colaborador afirma que instalação desktop é eager e, em falha, o CLI recua ao fluxo anterior sem interromper o servidor. Isso é contexto do RN, não garantia de qualquer falha distinta: <https://github.com/facebook/react-native/issues/54906>.

Ver [`technical-debt.md`](technical-debt.md) para oportunidades, sem assumir prioridade de correção.
