# Integrações externas

| Integração | Plataforma/uso | Configuração e limite |
| --- | --- | --- |
| Placa Pipas USB serial | Android via USB Host + lib `usb-serial-for-android`; web via Web Serial | `BoardStatusSheet`, serial adapters, módulo Kotlin, plugin. Firmware ausente; ver módulo de conectividade |
| Expo/EAS | build/distribuição interna e project linkage | `app.json`, `eas.json`; sem serviço de backend usado pela lógica do app |
| Vercel | configuração de hosting/export web | `vercel.json`; publicação efetiva não verificada |
| Browser media APIs | gravação, efeitos e serial web | requer permissões/compatibilidade do navegador |

Não foram encontrados integração de login, analytics, pagamentos, backend HTTP, storage remoto, push notifications ou SDK de crash reporting. Isso descreve o código inspecionado, não necessariamente serviços externos operados por terceiros fora do repositório.
