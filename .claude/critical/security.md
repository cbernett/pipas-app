# Segurança e permissões

## Superfície observada

- Android declara `android.permission.RECORD_AUDIO` e `android.permission.USB_PERMISSION` em `app.json`; plugin registra USB attach e filtro amplo `<usb-device />`.
- App pede permissão do microfone em runtime no branch Android do gravador.
- Browser pede acesso ao microfone e usuário seleciona porta via Web Serial.
- Sons e stacks são salvos localmente; não há login/backend encontrado.

## Riscos e cuidados

- CRITICAL: comandos USB podem movimentar hardware físico; validar destino, faixa e firmware antes de enviar.
- HIGH: tratar arquivos/paths de gravação como dados locais e validar acesso antes de playback/deleção.
- MEDIUM: dados no AsyncStorage/localStorage não são cifrados por uma camada definida pelo app; não armazenar segredos ali.
- MEDIUM: configuração de filtro USB aceita dispositivos a serem apresentados ao sistema; evitar restringir/expandir compatibilidade sem testar.

Não foi feita auditoria de segurança formal, análise de malware, pen-test ou threat model completo. Nenhum segredo de servidor foi identificado no inventário.
