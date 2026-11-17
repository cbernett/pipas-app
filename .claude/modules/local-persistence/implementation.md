# Implementação da persistência

## Stacks

`AppContext` armazena JSON de `BlockStack[]` em `pipas_stacks_v1`. Web usa localStorage; Android usa AsyncStorage via import dinâmico. Erros de load/save são engolidos; valor corrompido falha parse e não restaura.

## Sons do usuário

`soundStorage.ts` usa `pipas_user_sounds_v1`.

- Web armazena Base64 (com Data URL) junto com id/nome; no carregamento cria Blob URLs. Metadado `duration` não é incluído na estrutura web atual.
- Nativo guarda array id/name/path/duration em AsyncStorage; arquivo é copiado para `FileSystem.documentDirectory`, e `loadSounds` elimina da lista carregada metadados cujo arquivo não existe (não apaga registro do storage automaticamente).
- Delete nativo remove arquivo e atualiza metadados; erros são engolidos.

Não há migração/versionamento além do sufixo `v1` nas chaves; nenhuma rotina de backup, sincronização ou exportação foi localizada.
