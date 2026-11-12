# Pontos críticos: app shell

| Risco | Motivo/impacto | Cuidados e validação |
| --- | --- | --- |
| MEDIUM — ordem dos providers | Contexto, safe areas e gestos dependem dos providers no topo | Preservar composição; abrir ambas as abas em Android/web |
| MEDIUM — seleção de tela condicional | Alternar `activeTab` pode desmontar uma tela e perder estado local/drawer | Testar troca de aba durante modal/animação e retornar |
| LOW — escala global de texto Android | `App.tsx` altera `Text.defaultProps`/`TextInput.defaultProps` em runtime | Mudanças de tipografia precisam ser verificadas no Android |
| MEDIUM — tratamento de exceção local | `CodigoScreen` tem ErrorBoundary, não é uma boundary global de toda a árvore | Não inferir cobertura de erros nativos/assíncronos |

Não há testes automatizados específicos do shell configurados.
