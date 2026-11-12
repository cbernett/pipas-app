# Pontos críticos: persistência

| Risco | Razão | Cuidados e validação |
| --- | --- | --- |
| HIGH — compatibilidade JSON das stacks | JSON antigo é carregado diretamente sem validação/migração | Ao mudar tipos/IDs/estrutura, preservar dados existentes ou criar migração e testar instalação com storage preenchido |
| HIGH — caminho/formato do áudio | metadata pode apontar para path/extensão que não representa o formato; arquivo é parte da persistência | Testar save, app restart, playback, edit/delete e arquivo ausente |
| MEDIUM — sem sync/backup | apenas storage local | Não prometer compartilhamento entre aparelhos ou recuperação após uninstall |
| MEDIUM — erros silenciosos | catches escondem falhas de storage; UI pode divergir do estado persistido | Se alterar, distinguir erro e comportamento otimista; validar com storage indisponível |
| MEDIUM — web Base64/limite de quota | blobs inteiros serializados em localStorage podem exceder quota | Testar gravações grandes e erro de quota; não presumir armazenamento ilimitado |
| LOW — divergência de metadata web/nativo | duração não persiste no formato web atual | Não inferir mesma paridade de dados entre plataformas |

Nenhuma database migration existe, portanto não há migration test a executar.
