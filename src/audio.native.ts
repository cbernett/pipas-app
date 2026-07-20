import { PipasAudio } from '../modules/pipas-audio';

// Maps the display name used in the app to the bare filename (no extension)
const SOUND_FILE: Record<string, string> = {
  'meow!':  'meow',
  'bah!':   'bah',
  cheer:    'cheer',
  erro:     'erro',
  menu:     'menu',
  laser:       'laser',
  boing:       'boing',
  tambor:      'tambor',
  sino:        'sino',
  foguete:     'foguete',
  moeda:       'moeda',
  alarme:      'alarme',
  vitoria:     'vitoria',
  splash:      'splash',
  buzzer:      'buzzer',
  violino:     'violino',
  viola:       'viola',
  violoncelo:  'violoncelo',
  contrabaixo: 'contrabaixo',
  flauta:      'flauta',
  oboe:        'oboe',
  clarinete:   'clarinete',
  fagote:      'fagote',
  trompete:    'trompete',
  trombone:    'trombone',
  trompa:      'trompa',
  tuba:        'tuba',
  harpa:       'harpa',
  piano:       'piano',
  xilofone:    'xilofone',
  timpano:     'timpano',
  guitarra:    'guitarra',
  baixo:       'baixo',
  bumbo:       'bumbo',
  caixa:       'caixa',
  chimbal:     'chimbal',
  prato:       'prato',
  teclado:     'teclado',
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
