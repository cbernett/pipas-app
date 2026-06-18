import { Platform } from 'react-native';

const SOUND_FILES: Record<string, any> = {
  'meow!': require('../assets/sounds/meow.wav'),
  'bah!':  require('../assets/sounds/bah.wav'),
  cheer:   require('../assets/sounds/cheer.wav'),
  erro:    require('../assets/sounds/erro.wav'),
  menu:    require('../assets/sounds/menu.wav'),
};

export const SOUND_NAMES = Object.keys(SOUND_FILES);

// Web uses the browser Audio API; native sound is not yet implemented
export async function playSound(name: string): Promise<void> {
  if (Platform.OS !== 'web') return;

  const source = SOUND_FILES[name];
  if (!source) return;

  try {
    const audio = new window.Audio(source);
    audio.play().catch(() => {});
  } catch (e) {
    console.warn('playSound error:', e);
  }
}

export async function stopAllSounds(): Promise<void> {
  // no-op on native; web sounds are fire-and-forget
}
