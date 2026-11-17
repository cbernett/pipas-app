# Dependências do app shell

- Internas: `AppContext`, componentes de header/status e as duas telas.
- Externas: `react`, `react-native`, `expo`, `react-native-safe-area-context`, `react-native-gesture-handler`.
- Build: `babel-preset-expo`, plugin Reanimated (configurado globalmente).
- Não chama serviço remoto nem banco.

Contratos: `activeTab` aceita apenas `codigo | sons`; a tela deve estar sob `AppProvider`; componentes que usam safe area devem permanecer sob `SafeAreaProvider`; gestos dependentes do handler ficam sob `GestureHandlerRootView`.
