# Regras funcionais implementadas

As regras abaixo descrevem o estado do código examinado; não substituem especificação de produto/firmware.

- Blocos de hardware listados em `BOARD_DEFIDS` são bloqueados na UI de execução quando `boardStatus` não é `connected`; UI apresenta aviso “Conecte a placa para usar este bloco”.
- `triggerScript` também verifica se o programa contém bloco que exige placa antes de iniciar.
- Eventos de toque são convertidos para pads 1–3 e debounced por 350 ms no adaptador; `AppContext` agrupa sinais por 25 ms e tenta disparar stack associada.
- Se já existe uma execução, novo script comum cancela/reinicia a execução anterior após 30 ms; script contendo `som_4` não reinicia outra execução ativa.
- `ctrl_2` repete `innerBlocks`; `ctrl_3` repete até cancelamento; `ctrl_4/ctrl_5` consultam estado em memória para LED/motor e `ctrl_5` executa `elseBlocks` no caminho falso.
- Volume global é limitado a 0–1. Velocidade/brilho LED são limitados a 0–100.
- Som em bloco `som_4` aguarda promise de reprodução; `som_1` é fire-and-forget.
- As stacks usam `pipas_stacks_v1`; gravações usam `pipas_user_sounds_v1`.

## Pontos não confirmados

- O valor do estado LED/motor pode divergir do hardware, pois o contexto atualiza um mapa local após envio e não lê estado da placa.
- Sem firmware, não é possível validar se operações e números de comandos correspondem à versão embarcada.
- Validadores para parâmetros numéricos não foram encontrados como camada separada; não assumir limites funcionais universais além dos clamps presentes em ramos específicos.
