export interface SoundEntry {
  id: string;
  name: string;
  fileKey: string;
  duration: string;
  emoji: string;
}

export interface SoundSection {
  title: string;
  color: string;
  sounds: SoundEntry[];
}

export const SOUND_SECTIONS: SoundSection[] = [
  {
    title: 'Clássicos',
    color: '#E8A030',
    sounds: [
      { id: '1',  name: 'Miado',    fileKey: 'meow!',   duration: '0.6s', emoji: '🐱' },
      { id: '2',  name: 'Bah!',     fileKey: 'bah!',    duration: '0.5s', emoji: '😒' },
      { id: '3',  name: 'Aplausos', fileKey: 'cheer',   duration: '1.8s', emoji: '👏' },
      { id: '4',  name: 'Erro',     fileKey: 'erro',    duration: '0.6s', emoji: '❌' },
      { id: '5',  name: 'Menu',     fileKey: 'menu',    duration: '0.5s', emoji: '🎵' },
    ],
  },
  {
    title: 'Efeitos',
    color: '#5BC4D1',
    sounds: [
      { id: '6',  name: 'Laser',    fileKey: 'laser',   duration: '0.4s', emoji: '⚡' },
      { id: '7',  name: 'Boing',    fileKey: 'boing',   duration: '0.8s', emoji: '🎈' },
      { id: '8',  name: 'Tambor',   fileKey: 'tambor',  duration: '0.5s', emoji: '🥁' },
      { id: '9',  name: 'Sino',     fileKey: 'sino',    duration: '1.2s', emoji: '🔔' },
      { id: '10', name: 'Foguete',  fileKey: 'foguete', duration: '0.9s', emoji: '🚀' },
      { id: '11', name: 'Moeda',    fileKey: 'moeda',   duration: '0.6s', emoji: '💰' },
      { id: '12', name: 'Alarme',   fileKey: 'alarme',  duration: '1.0s', emoji: '🚨' },
      { id: '13', name: 'Vitória',  fileKey: 'vitoria', duration: '1.3s', emoji: '🏆' },
      { id: '14', name: 'Splash',   fileKey: 'splash',  duration: '0.6s', emoji: '💦' },
      { id: '15', name: 'Buzzer',   fileKey: 'buzzer',  duration: '0.4s', emoji: '📢' },
    ],
  },
  {
    title: 'Cordas',
    color: '#9268F6',
    sounds: [
      { id: '16', name: 'Violino',     fileKey: 'violino',     duration: '1.4s', emoji: '🎻' },
      { id: '17', name: 'Viola',       fileKey: 'viola',       duration: '1.4s', emoji: '🎻' },
      { id: '18', name: 'Violoncelo',  fileKey: 'violoncelo',  duration: '1.6s', emoji: '🎻' },
      { id: '19', name: 'Contrabaixo', fileKey: 'contrabaixo', duration: '1.4s', emoji: '🎻' },
    ],
  },
  {
    title: 'Madeiras',
    color: '#68C665',
    sounds: [
      { id: '20', name: 'Flauta',    fileKey: 'flauta',    duration: '1.2s', emoji: '🎵' },
      { id: '21', name: 'Oboé',      fileKey: 'oboe',      duration: '1.2s', emoji: '🎵' },
      { id: '22', name: 'Clarinete', fileKey: 'clarinete', duration: '1.2s', emoji: '🎵' },
      { id: '23', name: 'Fagote',    fileKey: 'fagote',    duration: '1.3s', emoji: '🎵' },
    ],
  },
  {
    title: 'Metais',
    color: '#F5A623',
    sounds: [
      { id: '24', name: 'Trompete',  fileKey: 'trompete',  duration: '1.0s', emoji: '🎺' },
      { id: '25', name: 'Trombone',  fileKey: 'trombone',  duration: '1.2s', emoji: '🎺' },
      { id: '26', name: 'Trompa',    fileKey: 'trompa',    duration: '1.4s', emoji: '🎺' },
      { id: '27', name: 'Tuba',      fileKey: 'tuba',      duration: '1.4s', emoji: '🎺' },
    ],
  },
  {
    title: 'Percussão Afinada',
    color: '#E84C88',
    sounds: [
      { id: '28', name: 'Harpa',    fileKey: 'harpa',    duration: '1.8s', emoji: '🎸' },
      { id: '29', name: 'Piano',    fileKey: 'piano',    duration: '2.0s', emoji: '🎹' },
      { id: '30', name: 'Xilofone', fileKey: 'xilofone', duration: '0.9s', emoji: '🪘' },
      { id: '31', name: 'Tímpano',  fileKey: 'timpano',  duration: '1.5s', emoji: '🥁' },
    ],
  },
  {
    title: 'Banda de Rock',
    color: '#F05252',
    sounds: [
      { id: '32', name: 'Guitarra', fileKey: 'guitarra', duration: '1.2s', emoji: '🎸' },
      { id: '33', name: 'Baixo',    fileKey: 'baixo',    duration: '1.2s', emoji: '🎸' },
      { id: '34', name: 'Bumbo',    fileKey: 'bumbo',    duration: '0.5s', emoji: '🥁' },
      { id: '35', name: 'Caixa',    fileKey: 'caixa',    duration: '0.3s', emoji: '🥁' },
      { id: '36', name: 'Chimbal',  fileKey: 'chimbal',  duration: '0.2s', emoji: '🥁' },
      { id: '37', name: 'Prato',    fileKey: 'prato',    duration: '2.5s', emoji: '🥁' },
      { id: '38', name: 'Teclado',  fileKey: 'teclado',  duration: '1.8s', emoji: '🎹' },
    ],
  },
  {
    title: 'Percussão',
    color: '#A86232',
    sounds: [
      { id: '39', name: 'Cowbell',   fileKey: 'cowbell',   duration: '1.0s', emoji: '🔔' },
      { id: '40', name: 'Triângulo', fileKey: 'triangulo', duration: '2.0s', emoji: '🔺' },
      { id: '41', name: 'Pandeiro',  fileKey: 'pandeiro',  duration: '0.5s', emoji: '🪘' },
      { id: '42', name: 'Agogô',     fileKey: 'agogo',     duration: '0.8s', emoji: '🔔' },
      { id: '43', name: 'Djembe',    fileKey: 'djembe',    duration: '0.5s', emoji: '🥁' },
      { id: '44', name: 'Maracas',   fileKey: 'maracas',   duration: '0.3s', emoji: '🪘' },
    ],
  },
  {
    title: 'Batidas',
    color: '#3B82F6',
    sounds: [
      { id: '45', name: 'Rock',       fileKey: 'rock_beat',  duration: '2.0s', emoji: '🤘' },
      { id: '46', name: 'Samba',      fileKey: 'samba',      duration: '2.4s', emoji: '🎉' },
      { id: '47', name: 'Funk',       fileKey: 'funk',       duration: '2.4s', emoji: '🕺' },
      { id: '48', name: 'Hip-Hop',    fileKey: 'hiphop',     duration: '2.7s', emoji: '🎤' },
      { id: '49', name: 'Latina',     fileKey: 'latina',     duration: '2.2s', emoji: '💃' },
      { id: '50', name: 'Eletrônica', fileKey: 'eletronica', duration: '1.9s', emoji: '🎛️' },
    ],
  },
  {
    title: 'Melodias',
    color: '#10B981',
    sounds: [
      { id: '51', name: 'Feliz',      fileKey: 'feliz',      duration: '2.4s', emoji: '😊' },
      { id: '52', name: 'Misteriosa', fileKey: 'misteriosa', duration: '2.7s', emoji: '🌙' },
      { id: '53', name: 'Triste',     fileKey: 'triste',     duration: '3.1s', emoji: '😢' },
      { id: '54', name: 'Suspense',   fileKey: 'suspense',   duration: '3.4s', emoji: '😱' },
      { id: '55', name: 'Fanfarra',   fileKey: 'fanfarra',   duration: '2.2s', emoji: '🎺' },
      { id: '56', name: 'Reggae',     fileKey: 'reggae',     duration: '3.0s', emoji: '🌴' },
    ],
  },
  {
    title: 'Vozes',
    color: '#F59E0B',
    sounds: [
      { id: '57', name: 'Risada',   fileKey: 'risada',   duration: '0.7s', emoji: '😂' },
      { id: '58', name: 'Uau!',     fileKey: 'uau',      duration: '0.5s', emoji: '😮' },
      { id: '59', name: 'Assobio',  fileKey: 'assobio',  duration: '1.0s', emoji: '😗' },
      { id: '60', name: 'Voz Robô', fileKey: 'voz_robo', duration: '0.6s', emoji: '🤖' },
      { id: '61', name: 'Contagem', fileKey: 'contagem', duration: '1.2s', emoji: '🔢' },
    ],
  },
  {
    title: 'Ambiente',
    color: '#6366F1',
    sounds: [
      { id: '62', name: 'Chuva',    fileKey: 'chuva',    duration: '2.0s', emoji: '🌧️' },
      { id: '63', name: 'Trovão',   fileKey: 'trovao',   duration: '2.0s', emoji: '⛈️' },
      { id: '64', name: 'Fogo',     fileKey: 'fogo',     duration: '2.0s', emoji: '🔥' },
      { id: '65', name: 'Ondas',    fileKey: 'ondas',    duration: '2.5s', emoji: '🌊' },
      { id: '66', name: 'Floresta', fileKey: 'floresta', duration: '2.0s', emoji: '🌲' },
      { id: '67', name: 'Espaço',   fileKey: 'espaco',   duration: '2.0s', emoji: '🌌' },
    ],
  },
  {
    title: 'Animais',
    color: '#EC4899',
    sounds: [
      { id: '68', name: 'Leão',     fileKey: 'leao',     duration: '1.5s', emoji: '🦁' },
      { id: '69', name: 'Elefante', fileKey: 'elefante', duration: '0.8s', emoji: '🐘' },
      { id: '70', name: 'Sapo',     fileKey: 'sapo',     duration: '0.7s', emoji: '🐸' },
      { id: '71', name: 'Pato',     fileKey: 'pato',     duration: '0.4s', emoji: '🦆' },
      { id: '72', name: 'Lobo',     fileKey: 'lobo',     duration: '1.8s', emoji: '🐺' },
    ],
  },
];

// Flat list for quick lookup by fileKey
export const ALL_SOUNDS: SoundEntry[] = SOUND_SECTIONS.flatMap(s => s.sounds);

export const EMOJI_FOR: Record<string, string> = Object.fromEntries(
  ALL_SOUNDS.map(s => [s.fileKey, s.emoji])
);

export const NAME_FOR: Record<string, string> = Object.fromEntries(
  ALL_SOUNDS.map(s => [s.fileKey, s.name])
);

// Quick picks shown at the top of the sound picker
export const QUICK_PICKS: string[] = [
  'meow!', 'laser', 'tambor', 'piano', 'guitarra',
  'risada', 'samba', 'fanfarra',
];
