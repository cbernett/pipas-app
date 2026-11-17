# Dependências de persistência

- `@react-native-async-storage/async-storage` no nativo.
- `expo-file-system` para copiar, inspecionar e remover arquivos de gravação.
- APIs browser: `localStorage`, `Blob`, `FileReader`, `URL.createObjectURL`, `fetch`.
- `AppContext` serializa stacks; `SonsScreen`/`SoundRecorder` acionam operações de áudio que depois persistem.

Não foram encontrados ORM, SQLite, migrations, API remota ou schema declarativo.
