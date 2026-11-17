# Versionamento da aplicação

A versão pública do produto tem uma única fonte de verdade: `expo.version` em `app.json`. O aplicativo lê esse valor da configuração Expo em runtime; não mantenha um número de versão separado no código ou em `package.json`.

Use três números no formato `MAJOR.MINOR.PATCH`:

- **MAJOR** (`1.4.2` → `2.0.0`): mudança incompatível ou alteração grande no comportamento esperado.
- **MINOR** (`1.4.2` → `1.5.0`): nova funcionalidade compatível; zere PATCH.
- **PATCH** (`1.4.2` → `1.4.3`): correção ou ajuste pequeno; mantenha MAJOR e MINOR.

Antes de publicar uma alteração, atualize `expo.version` em `app.json`. A nova versão aparecerá no painel de conexão quando o bundle web ou o build/update Android correspondente carregar a configuração atualizada. `android.versionCode` é o contador de build Android, tem finalidade diferente e segue o processo de build/publicação da plataforma.

Exemplos a partir de `1.0.0`: correção `1.0.1`; funcionalidade `1.1.0`; mudança grande `2.0.0`.
