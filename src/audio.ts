import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';
import type { AudioPlayer } from 'expo-audio';

const SOUND_FILES: Record<string, any> = {
  'meow!': require('../assets/sounds/meow.wav'),
  'bah!':  require('../assets/sounds/bah.wav'),
  cheer:   require('../assets/sounds/cheer.wav'),
  erro:    require('../assets/sounds/erro.wav'),
  menu:    require('../assets/sounds/menu.wav'),
};

let currentPlayer: AudioPlayer | null = null;

export async function playSound(name: string): Promise<void> {
  const source = SOUND_FILES[name];
  if (!source) return;

  try {
    if (currentPlayer) {
      currentPlayer.remove();
      currentPlayer = null;
    }

    await setAudioModeAsync({ playsInSilentModeIOS: true });
    const player = createAudioPlayer(source);
    currentPlayer = player;
    player.play();
  } catch (e) {
    console.warn('playSound error:', e);
  }
}

export async function stopAllSounds(): Promise<void> {
  if (currentPlayer) {
    currentPlayer.remove();
    currentPlayer = null;
  }
}

export const SOUND_NAMES = Object.keys(SOUND_FILES);
