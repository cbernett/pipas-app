# Decisões e escolhas arquiteturais observadas

Este arquivo registra escolhas identificáveis no checkout. Não foi encontrado ADR formal anterior.

| ID | Escolha atual | Evidência | Consequência/limite |
| --- | --- | --- | --- |
| D-001 | App universal Expo/React Native, com web via RN Web | `package.json`, `app.json`, caminhos de plataforma | Recursos nativos Android têm suporte assimétrico em web/iOS |
| D-002 | Navegação entre Código/Sons por estado `activeTab` | `App.tsx`, `AppContext.tsx`, `AppHeader.tsx` | Sem deep links/roteamento observados |
| D-003 | Transporte e áudio possuem arquivo genérico e variante `.native.ts` | `src/serial.ts`, `src/serial.native.ts`, `src/audio.ts`, `src/audio.native.ts` | Contratos devem se manter equivalentes; Metro resolve a implementação por plataforma |
| D-004 | Integrações exclusivas Android encapsuladas em módulos Expo locais | `modules/*`, configs Expo module | Mudanças nos módulos requerem rebuild do binário |
| D-005 | Estado de programa/sons fica local no cliente | `AppContext.tsx`, `soundStorage.ts` | Sem sync/backup remoto; storage e formatos locais são contratos persistentes |
| D-006 | O app interpreta blocos diretamente no contexto React | `AppContext.tsx` | Responsabilidade concentrada, estreita acoplamento UI/dados e exige cuidado com execução concorrente/abort |

Não inferir que estas escolhas foram deliberadamente aprovadas; descrevem decisões refletidas pela implementação. Registre futuras escolhas novas com contexto, alternativa considerada, consequências e data.
