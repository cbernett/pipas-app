# Instruções para agentes de IA

## Projeto

Pipas Labs é um app Expo/React Native em TypeScript para montar e executar programas visuais de blocos, controlar uma placa por USB serial e reproduzir/gravar sons. A implementação multiplataforma tem caminhos específicos para web e Android.

## Como usar esta base

Comece por [`README.md`](README.md). Para arquitetura e domínio, consulte [`architecture/overview.md`](architecture/overview.md), [`architecture/system-design.md`](architecture/system-design.md) e os documentos de [`context/`](context/). Para uma tarefa localizada, use o mapa de [`architecture/components.md`](architecture/components.md) e leia a pasta do módulo em [`modules/`](modules/). Consulte [`critical/change-impact.md`](critical/change-impact.md) antes de mudanças que cruzem módulos.

**Antes de modificar qualquer componente, consulte a documentação correspondente e examine os arquivos de implementação referenciados. A documentação é um mapa de navegação, não substitui a inspeção do código-fonte.**

## Regras obrigatórias

- Siga a arquitetura observada; não introduza backend, banco, navegação ou abstrações não existentes sem solicitação explícita.
- Preserve os contratos paralelos web/Android de `src/serial.ts` e `src/serial.native.ts`, e de `src/audio.ts` e `src/audio.native.ts`.
- Considere IDs de bloco, índices de parâmetros e rótulos usados no interpretador como contratos entre `src/data/blocks.ts`, `src/components/CodeBlock.tsx` e `src/context/AppContext.tsx`.
- Código em `modules/*/android` e alterações em `app.json`/plugins mudam a superfície nativa e exigem rebuild do app Android. Mudanças apenas em JS/TS normalmente usam Fast Refresh.
- Não assuma que os comentários sobre firmware são uma especificação atual do hardware: o firmware da placa não está neste repositório.
- Não registre segredos, tokens ou dados pessoais. O repositório não define autenticação nem variáveis de ambiente de aplicação.
- Trate erros de forma compatível com o padrão local, mas não replique silenciosamente `catch` vazio sem avaliar o efeito na depuração.
- Não afirme que testes passaram sem executá-los. Não há suíte automatizada configurada no manifesto atual.

## Fluxo recomendado

1. Classifique a tarefa por módulo e siga o mapa de [`architecture/components.md`](architecture/components.md).
2. Leia os documentos do módulo, seus pontos críticos e os arquivos-fonte atuais.
3. Verifique callers, formatos persistidos, IDs/eventos nativos e caminhos de plataforma afetados.
4. Implemente o menor conjunto coerente de alterações, respeitando os limites documentados.
5. Execute validações relevantes descritas em [`development/testing.md`](development/testing.md) e [`development/debugging.md`](development/debugging.md); reporte claramente o que não foi executado.
6. Atualize somente a documentação afetada, conforme [`README.md`](README.md#manutenção-da-base).

## Expo

Antes de alterar código/configuração Expo, consulte a documentação versionada do SDK usado pelo projeto: <https://docs.expo.dev/versions/v56.0.0/>. Para development builds, consulte <https://docs.expo.dev/versions/v56.0.0/sdk/dev-client/>. Verifique as versões instaladas no `package.json` e `package-lock.json`; não use instruções de outra versão do SDK sem justificar compatibilidade.
