# Base de conhecimento do Pipas Labs

Documentação modular e rastreável do repositório para agentes de IA. Leia primeiro [`CLAUDE.md`](CLAUDE.md); ele direciona para a área específica sem exigir leitura de toda a base.

## Navegação por níveis

1. **Contexto geral:** [`context/project-overview.md`](context/project-overview.md), [`architecture/overview.md`](architecture/overview.md).
2. **Arquitetura e domínio:** [`architecture/system-design.md`](architecture/system-design.md), [`architecture/data-flow.md`](architecture/data-flow.md), [`context/domain-knowledge.md`](context/domain-knowledge.md).
3. **Módulo da tarefa:** [`architecture/components.md`](architecture/components.md) aponta para `modules/<módulo>/`.
4. **Operação e risco:** consulte [`development/`](development/), [`critical/`](critical/) e [`skills/README.md`](skills/README.md) conforme necessário.

## Áreas do sistema

| Área | Entrada de leitura |
| --- | --- |
| Inicialização, telas e contexto global | [`modules/app-shell/overview.md`](modules/app-shell/overview.md) |
| Editor visual, blocos e execução | [`modules/block-workspace/overview.md`](modules/block-workspace/overview.md) |
| Placa e transporte serial | [`modules/board-connectivity/overview.md`](modules/board-connectivity/overview.md) |
| Sons e gravações | [`modules/sound-system/overview.md`](modules/sound-system/overview.md) |
| Persistência local | [`modules/local-persistence/overview.md`](modules/local-persistence/overview.md) |
| Ponte nativa Android | [`modules/native-modules/overview.md`](modules/native-modules/overview.md) |

## Convenções de evidência

- **Fato:** diretamente visível em código ou configuração citado.
- **Inferência:** comportamento deduzido da ligação entre implementações; identificado como tal.
- **Não verificado:** requer firmware, aparelho, serviço ou execução não disponível durante a análise.
- **Problema observado:** inconsistência estática concreta, sem presumir impacto em produção.
- **Recomendação:** melhoria proposta; não descreve o estado atual.

Os caminhos são relativos à raiz do repositório. A ausência de arquivos no inventário é evidência limitada ao checkout analisado, não prova de que a capacidade nunca existiu.

## Áreas ausentes neste checkout

- Não foram encontrados banco de dados, schemas ou migrations; portanto não existe diretório `database/` nesta base.
- Não foram encontrados backend, endpoints HTTP, autenticação, filas, cache remoto ou integrações de observabilidade.
- Não há testes automatizados, configuração de CI ou infraestrutura de build própria versionada. O build nativo é delegado ao Expo/EAS e a publicação web aponta para Vercel por `vercel.json`.
- `modules/pipas-recording` é um módulo local e é documentado; os módulos não são pacotes de backend.

## Manutenção da base

Ao mudar comportamento, atualize a documentação do módulo e os mapas arquiteturais diretamente afetados. Mudanças em parâmetros/IDs de blocos também atualizam domínio, fluxo de dados e impacto; alterações nativas/config plugins atualizam infraestrutura e setup; mudanças persistidas atualizam o documento de persistência. Registre decisões duráveis em `architecture/architectural-decisions.md`. Não edite docs não afetadas. Marque inferências e lacunas em vez de completá-las por suposição.

## Auditoria

Consulte [`audit.md`](audit.md) para escopo, lacunas, confiança e a segunda passagem de validação da documentação.
