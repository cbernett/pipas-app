import { Platform } from 'react-native';

const SOUND_FILES: Record<string, any> = {
  'meow!':  require('../assets/sounds/meow.wav'),
  'bah!':   require('../assets/sounds/bah.wav'),
  cheer:    require('../assets/sounds/cheer.wav'),
  erro:     require('../assets/sounds/erro.wav'),
  menu:     require('../assets/sounds/menu.wav'),
  laser:       require('../assets/sounds/laser.wav'),
  boing:       require('../assets/sounds/boing.wav'),
  tambor:      require('../assets/sounds/tambor.wav'),
  sino:        require('../assets/sounds/sino.wav'),
  foguete:     require('../assets/sounds/foguete.wav'),
  moeda:       require('../assets/sounds/moeda.wav'),
  alarme:      require('../assets/sounds/alarme.wav'),
  vitoria:     require('../assets/sounds/vitoria.wav'),
  splash:      require('../assets/sounds/splash.wav'),
  buzzer:      require('../assets/sounds/buzzer.wav'),
  // orchestra strings
  violino:     require('../assets/sounds/violino.wav'),
  viola:       require('../assets/sounds/viola.wav'),
  violoncelo:  require('../assets/sounds/violoncelo.wav'),
  contrabaixo: require('../assets/sounds/contrabaixo.wav'),
  // woodwinds
  flauta:      require('../assets/sounds/flauta.wav'),
  oboe:        require('../assets/sounds/oboe.wav'),
  clarinete:   require('../assets/sounds/clarinete.wav'),
  fagote:      require('../assets/sounds/fagote.wav'),
  // brass
  trompete:    require('../assets/sounds/trompete.wav'),
  trombone:    require('../assets/sounds/trombone.wav'),
  trompa:      require('../assets/sounds/trompa.wav'),
  tuba:        require('../assets/sounds/tuba.wav'),
  // pitched percussion
  harpa:       require('../assets/sounds/harpa.wav'),
  piano:       require('../assets/sounds/piano.wav'),
  xilofone:    require('../assets/sounds/xilofone.wav'),
  timpano:     require('../assets/sounds/timpano.wav'),
  // rock band
  guitarra:    require('../assets/sounds/guitarra.wav'),
  baixo:       require('../assets/sounds/baixo.wav'),
  bumbo:       require('../assets/sounds/bumbo.wav'),
  caixa:       require('../assets/sounds/caixa.wav'),
  chimbal:     require('../assets/sounds/chimbal.wav'),
  prato:       require('../assets/sounds/prato.wav'),
  teclado:     require('../assets/sounds/teclado.wav'),
  // extra percussion
  cowbell:     require('../assets/sounds/cowbell.wav'),
  triangulo:   require('../assets/sounds/triangulo.wav'),
  pandeiro:    require('../assets/sounds/pandeiro.wav'),
  agogo:       require('../assets/sounds/agogo.wav'),
  djembe:      require('../assets/sounds/djembe.wav'),
  maracas:     require('../assets/sounds/maracas.wav'),
  // beats
  rock_beat:   require('../assets/sounds/rock_beat.wav'),
  samba:       require('../assets/sounds/samba.wav'),
  funk:        require('../assets/sounds/funk.wav'),
  hiphop:      require('../assets/sounds/hiphop.wav'),
  latina:      require('../assets/sounds/latina.wav'),
  eletronica:  require('../assets/sounds/eletronica.wav'),
  // melodias
  feliz:       require('../assets/sounds/feliz.wav'),
  misteriosa:  require('../assets/sounds/misteriosa.wav'),
  triste:      require('../assets/sounds/triste.wav'),
  suspense:    require('../assets/sounds/suspense.wav'),
  fanfarra:    require('../assets/sounds/fanfarra.wav'),
  reggae:      require('../assets/sounds/reggae.wav'),
  // vozes
  risada:      require('../assets/sounds/risada.wav'),
  uau:         require('../assets/sounds/uau.wav'),
  assobio:     require('../assets/sounds/assobio.wav'),
  voz_robo:    require('../assets/sounds/voz_robo.wav'),
  contagem:    require('../assets/sounds/contagem.wav'),
  // ambiente
  chuva:       require('../assets/sounds/chuva.wav'),
  trovao:      require('../assets/sounds/trovao.wav'),
  fogo:        require('../assets/sounds/fogo.wav'),
  ondas:       require('../assets/sounds/ondas.wav'),
  floresta:    require('../assets/sounds/floresta.wav'),
  espaco:      require('../assets/sounds/espaco.wav'),
  // animais
  leao:        require('../assets/sounds/leao.wav'),
  elefante:    require('../assets/sounds/elefante.wav'),
  sapo:        require('../assets/sounds/sapo.wav'),
  pato:        require('../assets/sounds/pato.wav'),
  lobo:        require('../assets/sounds/lobo.wav'),
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
