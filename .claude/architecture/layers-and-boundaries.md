# Camadas e limites

## Limites observados

1. **Composição/telas:** `App.tsx`, `src/screens/*` montam interface e coordenam componentes visuais.
2. **UI e interação:** `src/components/*` contém componentes; `Workspace`, `CodeBlock` e `SoundRecorder` também mantêm lógica substancial.
3. **Estado/orquestração:** `src/context/AppContext.tsx` guarda contexto React, persiste stacks, interpreta blocos, controla execução e liga touch → script.
4. **Dados/configuração:** `src/data/blocks.ts` e `src/data/soundData.ts` são catálogos TypeScript estáticos.
5. **Adaptadores:** pares `serial(.native).ts` e `audio(.native).ts`; `soundStorage.ts` escolhe API por `Platform.OS`.
6. **Plataforma nativa:** `modules/*/index.ts` expõem módulos Expo; implementação Android está em Kotlin. `plugins/withUsbSerial.js` injeta manifesto e assets.

## Limites que não existem formalmente

- Não há roteador formal: as abas são estado condicional em `App.tsx`.
- Não há camada de domínio independente; regras de execução vivem no contexto.
- Não há camada de API/backend, repositórios de banco, autenticação ou sync.
- Os diretórios `modules/` são módulos Expo locais ligados ao build, não uma arquitetura de microserviços.

## Acoplamentos a preservar/avaliar

- `AppContext.tsx` importa `liveParamValues` de `CodeBlock.tsx`, cruzando estado/execução para dentro do componente visual; `CodeBlock` importa o próprio contexto. É um ciclo de dependência potencial, observável estaticamente.
- Interpretador usa strings de `label` como fallback além do `defId`; renomear rótulos pode alterar execução quando não há valor live.
- `soundData.ts`, `blocks.ts`, `SoundList.tsx`, `audio*.ts` e arquivos WAV contêm listas/mapas do catálogo em mais de um lugar.
- Config plugin assume formato gerado específico do Manifest Android e copia todos os arquivos existentes no diretório de sons.

## Direção de dependência desejável no estado atual

Trate isso como descrição, não como mandato de refatoração: UI consulta contexto; contexto usa abstrações de placa/áudio/storage; adaptadores chamam APIs web ou módulos nativos. Ao criar uma alteração, minimize novas dependências no sentido inverso.
