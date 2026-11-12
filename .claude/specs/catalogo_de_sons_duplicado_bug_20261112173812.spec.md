# Spec: catálogo de sons duplicado

- **Spec:** Bug
- **Status:** proposta para análise; não implementada.
- **Risco:** HIGH — alterações incompletas podem deixar sons listados sem opção de seleção ou sem reprodução.
- **Evidências:** `src/components/SoundList.tsx` mantém `SECTIONS`; `src/data/soundData.ts` mantém `SOUND_SECTIONS`; `src/data/blocks.ts` declara `SOUND_OPTS`; `src/audio.ts` e `src/audio.native.ts` mantêm mapas de assets/nomes. O picker de blocos lê `soundData.ts`, enquanto a lista principal tem seus próprios dados.

## Contexto

O app possui catálogo estático de sons para a tela Sons e para o seletor de sons nos blocos. O mesmo conceito é representado por listas e mapeamentos em vários arquivos. Para adicionar um som, é necessário localizar todas essas declarações, o asset correspondente e o mapeamento da plataforma.

## Problema

Não existe uma fonte única para nomes, chaves e metadados do catálogo. Uma alteração pode atualizar apenas parte das listas: o som aparece em uma tela, mas não no picker de blocos, ou uma `fileKey` não encontra o arquivo requerido pelo adapter da plataforma. Os conteúdos não são necessariamente idênticos e não há validação automática de cobertura.

## Objetivo

Reduzir divergências do catálogo e tornar explícito o mapeamento entre cada `fileKey` e os recursos necessários em web e Android, preservando as opções e o comportamento existentes.

## Escopo

**Inclui:** catálogo da biblioteca, opções de blocos de som, metadados de apresentação, mapeamento para assets e procedimento/validação de inclusão de sons.

**Não inclui:** redesenho da interface de áudio, alteração dos arquivos WAV, novo sistema de downloads, nem unificação do mecanismo de playback nativo e web.

## Requisitos Funcionais e Não Funcionais

### Funcionais

- O mesmo conjunto de sons suportados deve ser apresentado na biblioteca e nos dropdowns de blocos, respeitando filtros/apresentações específicas existentes.
- Cada `fileKey` deve resolver para exatamente um recurso válido em cada plataforma onde o som é suportado.
- Busca, favoritos rápidos, nomes visíveis, emojis, agrupamentos e ordem atuais devem ser preservados salvo mudança explicitamente aprovada.
- Um som novo deve ter um único procedimento documentado de cadastro e ser identificável como suportado ou não suportado por plataforma.

### Não funcionais

- Preservar `fileKey`s persistidos ou utilizados por blocos já salvos.
- Manter imports de assets estáticos compatíveis com Metro; não depender de `require()` dinâmico calculado em runtime sem validar o bundler.
- Não adicionar dependência de execução sem necessidade.
- Erros de mapeamento devem ser verificáveis antes do uso (idealmente em validação automatizada ou estrutura tipada).

## Fluxo Atual/Proposto

### Atual

```text
SoundList.SECTIONS ───────────────> tela Sons
soundData.SOUND_SECTIONS ─────────> picker em CodeBlock
blocks.SOUND_OPTS ────────────────> opções de bloco
audio.ts SOUND_FILES ─────────────> assets web
audio.native.ts SOUND_FILE ───────> nomes dos assets Android
```

### Proposto

```text
Catálogo tipado compartilhado ────> tela Sons
                            ├─────> picker e opções de bloco
                            └─────> identificação de fileKey
Mapa explícito de recursos estáticos por plataforma ─> playback
```

O mapa de assets pode permanecer explícito para satisfazer a resolução estática do Metro, mas deve ser ligado/verificado em relação ao catálogo, sem listas funcionais duplicadas.

## Propostas Técnicas

1. Tratar `src/data/soundData.ts` como fonte de metadados do catálogo e derivar dele lista da tela e opções dos dropdowns, removendo arrays de catálogo repetidos após confirmar equivalência de conteúdo e ordem.
2. Centralizar a correspondência `fileKey` → recurso web e `fileKey` → basename Android em um módulo de recursos tipado, mantendo `require()` estático para cada WAV no caminho web.
3. Representar explicitamente aliases atuais (por exemplo `meow!`/`meow.wav` e `bah!`/`bah.wav`) em vez de inferi-los a partir do nome de apresentação.
4. Adicionar verificação de integridade apropriada ao tooling existente ou, se não houver runner, ao menos documentar checklist de completude. A inclusão de um framework de testes é decisão separada.
5. Antes da implementação, comparar as listas reais e registrar as diferenças para evitar remoção acidental de sons/metadata.

## Critério de Aceite

- [ ] Uma definição compartilhada fornece os dados funcionais para tela Sons e picker de blocos.
- [ ] Todos os `fileKey`s atualmente usados em `blocks.ts` estão no catálogo e têm recurso correspondente em cada plataforma suportada.
- [ ] A lista preserva IDs, nomes, agrupamentos, ordem e quick picks atuais, exceto mudanças explicitamente documentadas.
- [ ] Sons do usuário continuam separados do catálogo estático e não são removidos por essa mudança.
- [ ] Playback de uma amostra representativa funciona em web e Android; novos mapeamentos têm validação verificável.
- [ ] Não há dependência nova introduzida sem justificativa.

## Resultados Esperados

Menos divergência entre biblioteca, blocos e adapters; menor risco de erro ao adicionar/remover som; relação `fileKey`/asset rastreável. A melhoria não elimina diferenças necessárias de implementação entre playback web e Android.
