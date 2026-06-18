import { PipasAudio } from '../modules/pipas-audio';

// Maps the display name used in the app to the bare filename (no extension)
const SOUND_FILE: Record<string, string> = {
  'meow!': 'meow',
  'bah!':  'bah',
  cheer:   'cheer',
  erro:    'erro',
  menu:    'menu',
};

export const SOUND_NAMES = Object.keys(SOUND_FILE);

export async function playSound(name: string): Promise<void> {
  const file = SOUND_FILE[name];
  if (!file) return;
  try {
    await PipasAudio.play(file);
  } catch (e) {
    console.warn('playSound error:', e);
  }
}

export async function stopAllSounds(): Promise<void> {
  try {
    await PipasAudio.stopAll();
  } catch (e) {}
}
