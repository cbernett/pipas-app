# Restrições e limites técnicos

- Expo SDK 56; consulte documentação exata <https://docs.expo.dev/versions/v56.0.0/> antes de alterar config ou código Expo.
- APK de desenvolvimento precisa conter os módulos nativos locais. Fast Refresh cobre JS/TS; mudanças Kotlin, autolinking, permissões, plugins, recursos nativos ou dependências nativas requerem novo build e instalação.
- Módulos `pipas-audio`, `pipas-recording`, `pipas-usb-serial` declaram `platforms: ["android"]`.
- Integração Web Serial depende do browser e interação do usuário para obter porta; não está disponível em todo browser.
- Assets de som estão hardcoded/referenciados em mapas e também copiados para Android assets pelo plugin USB (apesar de não ser responsabilidade USB em si).
- Armazenamento local não sincroniza e pode estar sujeito a limites de browser; arquivos Android são locais ao app.
- Nenhuma configuração `.env`/segredo de runtime foi identificada.
- O hardware/firmware e aparelhos físicos não estão no repositório, impedindo confirmação de protocolo ou validação material.
- Não há suíte automatizada aparente para impedir regressões de drag-and-drop, áudio, persistência ou protocolo.
