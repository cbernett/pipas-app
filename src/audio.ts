import { Audio } from 'expo-av';

const SOUND_FILES: Record<string, any> = {
  'meow!': require('../assets/sounds/meow.wav'),
  'bah!':  require('../assets/sounds/bah.wav'),
  cheer:   require('../assets/sounds/cheer.wav'),
  erro:    require('../assets/sounds/erro.wav'),
  menu:    require('../assets/sounds/menu.wav'),
};

let currentSound: Audio.Sound | null = null;

export async function playSound(name: string): Promise<void> {
  const source = SOUND_FILES[name];
  if (!source) return;

  try {
    // Stop any currently playing sound
    if (currentSound) {
      await currentSound.stopAsync().catch(() => {});
      await currentSound.unloadAsync().catch(() => {});
      currentSound = null;
    }

    await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
    const { sound } = await Audio.Sound.createAsync(source, { shouldPlay: true });
    currentSound = sound;

    sound.setOnPlaybackStatusUpdate((status) => {
      if (status.isLoaded && status.didJustFinish) {
        sound.unloadAsync().catch(() => {});
        if (currentSound === sound) currentSound = null;
      }
    });
  } catch (e) {
    console.warn('playSound error:', e);
  }
}

export async function stopAllSounds(): Promise<void> {
  if (currentSound) {
    await currentSound.stopAsync().catch(() => {});
    await currentSound.unloadAsync().catch(() => {});
    currentSound = null;
  }
}

export const SOUND_NAMES = Object.keys(SOUND_FILES);
