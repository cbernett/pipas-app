/**
 * Persists user-recorded sounds across sessions.
 *
 * Web:     localStorage stores { id, name, b64 } entries. On load, b64 is
 *          converted back to a blob URL so the rest of the app is unchanged.
 *
 * Native:  expo-file-system saves the audio file to the documents directory;
 *          AsyncStorage keeps the metadata index.
 */

import { Platform } from 'react-native';
import type { UserSound } from './context/AppContext';

const WEB_KEY = 'pipas_user_sounds_v1';

// ─── Web ────────────────────────────────────────────────────────────────────

async function blobUrlToBase64(blobUrl: string): Promise<string> {
  const res  = await fetch(blobUrl);
  const blob = await res.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror  = reject;
    reader.readAsDataURL(blob);
  });
}

function base64ToBlobUrl(b64: string): string {
  const [header, data] = b64.split(',');
  const mime = header.match(/:(.*?);/)?.[1] ?? 'audio/webm';
  const bytes = atob(data);
  const buf   = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) buf[i] = bytes.charCodeAt(i);
  const blob = new Blob([buf], { type: mime });
  return URL.createObjectURL(blob);
}

// ─── Native ─────────────────────────────────────────────────────────────────

async function getNativeStorage() {
  const [AsyncStorage, FileSystem] = await Promise.all([
    import('@react-native-async-storage/async-storage').then(m => m.default),
    import('expo-file-system'),
  ]);
  return { AsyncStorage, FileSystem };
}

const NATIVE_KEY = 'pipas_user_sounds_v1';

interface NativeMeta { id: string; name: string; path: string; }

// ─── Public API ─────────────────────────────────────────────────────────────

export async function loadSounds(): Promise<UserSound[]> {
  if (Platform.OS === 'web') {
    try {
      const raw = localStorage.getItem(WEB_KEY);
      if (!raw) return [];
      const entries: { id: string; name: string; b64: string }[] = JSON.parse(raw);
      return entries.map(e => ({ id: e.id, name: e.name, uri: base64ToBlobUrl(e.b64) }));
    } catch { return []; }
  }

  try {
    const { AsyncStorage, FileSystem } = await getNativeStorage();
    const raw = await AsyncStorage.getItem(NATIVE_KEY);
    if (!raw) return [];
    const metas: NativeMeta[] = JSON.parse(raw);
    // Filter out any whose file was deleted
    const valid: UserSound[] = [];
    for (const m of metas) {
      const info = await FileSystem.getInfoAsync(m.path);
      if (info.exists) valid.push({ id: m.id, name: m.name, uri: m.path });
    }
    return valid;
  } catch { return []; }
}

export async function saveSound(sound: UserSound): Promise<void> {
  if (Platform.OS === 'web') {
    try {
      const b64 = await blobUrlToBase64(sound.uri);
      const raw = localStorage.getItem(WEB_KEY);
      const entries: { id: string; name: string; b64: string }[] = raw ? JSON.parse(raw) : [];
      entries.push({ id: sound.id, name: sound.name, b64 });
      localStorage.setItem(WEB_KEY, JSON.stringify(entries));
    } catch (e) { console.warn('saveSound failed', e); }
    return;
  }

  try {
    const { AsyncStorage, FileSystem } = await getNativeStorage();
    const dest = `${FileSystem.documentDirectory}pipas_sound_${sound.id}.webm`;
    await FileSystem.copyAsync({ from: sound.uri, to: dest });
    const raw   = await AsyncStorage.getItem(NATIVE_KEY);
    const metas: NativeMeta[] = raw ? JSON.parse(raw) : [];
    metas.push({ id: sound.id, name: sound.name, path: dest });
    await AsyncStorage.setItem(NATIVE_KEY, JSON.stringify(metas));
  } catch (e) { console.warn('saveSound native failed', e); }
}

export async function deleteSound(id: string): Promise<void> {
  if (Platform.OS === 'web') {
    try {
      const raw = localStorage.getItem(WEB_KEY);
      if (!raw) return;
      const entries: { id: string; name: string; b64: string }[] = JSON.parse(raw);
      localStorage.setItem(WEB_KEY, JSON.stringify(entries.filter(e => e.id !== id)));
    } catch { }
    return;
  }

  try {
    const { AsyncStorage, FileSystem } = await getNativeStorage();
    const raw   = await AsyncStorage.getItem(NATIVE_KEY);
    const metas: NativeMeta[] = raw ? JSON.parse(raw) : [];
    const target = metas.find(m => m.id === id);
    if (target) {
      await FileSystem.deleteAsync(target.path, { idempotent: true });
    }
    await AsyncStorage.setItem(NATIVE_KEY, JSON.stringify(metas.filter(m => m.id !== id)));
  } catch { }
}
