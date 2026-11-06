import React, { useState, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { playSound, stopAllSounds } from '../audio';
import { useApp } from '../context/AppContext';

export interface Sound {
  id: string;
  name: string;
  fileKey: string;
  duration: string;
  uri?: string;
}

type SubTab = 'biblioteca' | 'meus';

interface Props {
  onSelectSound: (sound: Sound) => void;
  onEditSound?: (sound: Sound) => void;
  initialSubTab?: SubTab;
}

interface SoundEntry {
  id: string;
  name: string;
  fileKey: string;
  duration: string;
  emoji: string;
}

interface Section {
  title: string;
  color: string;
  sounds: SoundEntry[];
}

const SECTIONS: Section[] = [
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
    title: 'Orquestra — Cordas',
    color: '#9268F6',
    sounds: [
      { id: '16', name: 'Violino',     fileKey: 'violino',     duration: '1.4s', emoji: '🎻' },
      { id: '17', name: 'Viola',       fileKey: 'viola',       duration: '1.4s', emoji: '🎻' },
      { id: '18', name: 'Violoncelo',  fileKey: 'violoncelo',  duration: '1.6s', emoji: '🎻' },
      { id: '19', name: 'Contrabaixo', fileKey: 'contrabaixo', duration: '1.4s', emoji: '🎻' },
    ],
  },
  {
    title: 'Orquestra — Madeiras',
    color: '#68C665',
    sounds: [
      { id: '20', name: 'Flauta',    fileKey: 'flauta',    duration: '1.2s', emoji: '🎵' },
      { id: '21', name: 'Oboé',      fileKey: 'oboe',      duration: '1.2s', emoji: '🎵' },
      { id: '22', name: 'Clarinete', fileKey: 'clarinete', duration: '1.2s', emoji: '🎵' },
      { id: '23', name: 'Fagote',    fileKey: 'fagote',    duration: '1.3s', emoji: '🎵' },
    ],
  },
  {
    title: 'Orquestra — Metais',
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
      { id: '57', name: 'Risada',    fileKey: 'risada',   duration: '0.7s', emoji: '😂' },
      { id: '58', name: 'Uau!',      fileKey: 'uau',      duration: '0.5s', emoji: '😮' },
      { id: '59', name: 'Assobio',   fileKey: 'assobio',  duration: '1.0s', emoji: '😗' },
      { id: '60', name: 'Voz Robô',  fileKey: 'voz_robo', duration: '0.6s', emoji: '🤖' },
      { id: '61', name: 'Contagem',  fileKey: 'contagem', duration: '1.2s', emoji: '🔢' },
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
      { id: '68', name: 'Leão',      fileKey: 'leao',     duration: '1.5s', emoji: '🦁' },
      { id: '69', name: 'Elefante',  fileKey: 'elefante', duration: '0.8s', emoji: '🐘' },
      { id: '70', name: 'Sapo',      fileKey: 'sapo',     duration: '0.7s', emoji: '🐸' },
      { id: '71', name: 'Pato',      fileKey: 'pato',     duration: '0.4s', emoji: '🦆' },
      { id: '72', name: 'Lobo',      fileKey: 'lobo',     duration: '1.8s', emoji: '🐺' },
    ],
  },
];

// Flat list for compatibility with the rest of the app
const LIBRARY_SOUNDS: Sound[] = SECTIONS.flatMap(s =>
  s.sounds.map(({ emoji: _e, ...rest }) => rest)
);

export default function SoundList({ onSelectSound, onEditSound, initialSubTab = 'biblioteca' }: Props) {
  const [subTab, setSubTab]       = useState<SubTab>(initialSubTab);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const insets                    = useSafeAreaInsets();
  const audioBlobRef              = useRef<HTMLAudioElement | null>(null);
  const playingIdRef              = useRef<string | null>(null);
  const { userSounds, deleteUserSound } = useApp();

  const extraSounds: Sound[] = userSounds.map(s => ({
    id: s.id, name: s.name, fileKey: s.name,
    duration: s.duration != null ? `${s.duration.toFixed(1)}s` : '',
    uri: s.uri,
  }));

  const handlePlay = async (sound: Sound) => {
    if (playingIdRef.current === sound.id) {
      if (Platform.OS === 'web' && audioBlobRef.current) {
        audioBlobRef.current.pause();
        audioBlobRef.current = null;
      } else if (Platform.OS !== 'web' && sound.uri) {
        const { PipasAudio } = require('../../modules/pipas-audio');
        PipasAudio.stopFile(sound.uri).catch(() => {});
      } else {
        await stopAllSounds();
      }
      playingIdRef.current = null;
      setPlayingId(null);
      return;
    }
    playingIdRef.current = sound.id;
    setPlayingId(sound.id);
    const clearPlaying = () => { playingIdRef.current = null; setPlayingId(null); };
    const onError = () => clearPlaying();
    if (Platform.OS === 'web' && sound.uri) {
      const audio = new Audio(sound.uri);
      audioBlobRef.current = audio;
      audio.onended = () => { audioBlobRef.current = null; clearPlaying(); };
      audio.play().catch(onError);
    } else if (Platform.OS !== 'web' && sound.uri) {
      const { PipasAudio } = require('../../modules/pipas-audio');
      PipasAudio.playFile(sound.uri).catch(onError);
      const dur = sound.duration ? parseFloat(sound.duration) : 3;
      setTimeout(clearPlaying, (isNaN(dur) ? 3 : dur) * 1000);
    } else {
      playSound(sound.fileKey).then(clearPlaying).catch(onError);
    }
  };

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      {/* Sub-tabs */}
      <View style={styles.subTabBar}>
        <TouchableOpacity style={styles.subTab} onPress={() => setSubTab('biblioteca')} activeOpacity={0.7}>
          <Text style={[styles.subTabText, subTab === 'biblioteca' && styles.subTabActive]}>BIBLIOTECA</Text>
          {subTab === 'biblioteca' && <View style={styles.subTabUnderline} />}
        </TouchableOpacity>
        <TouchableOpacity style={styles.subTab} onPress={() => setSubTab('meus')} activeOpacity={0.7}>
          <Text style={[styles.subTabText, subTab === 'meus' && styles.subTabActive]}>MEUS SONS</Text>
          {subTab === 'meus' && <View style={styles.subTabUnderline} />}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {subTab === 'biblioteca' ? (
          SECTIONS.map(section => (
            <View key={section.title} style={styles.section}>
              <Text style={[styles.sectionHeader, { color: section.color }]}>{section.title}</Text>
              <View style={styles.grid}>
                {section.sounds.map(sound => {
                  const isPlaying = playingId === sound.id;
                  return (
                    <TouchableOpacity
                      key={sound.id}
                      style={[
                        styles.tile,
                        { backgroundColor: isPlaying
                            ? section.color
                            : `${section.color}22`,
                          borderColor: isPlaying ? section.color : `${section.color}55`,
                        },
                      ]}
                      onPress={() => onSelectSound(sound)}
                      activeOpacity={0.75}
                    >
                      {/* Emoji */}
                      <Text style={styles.tileEmoji}>{sound.emoji}</Text>
                      {/* Name */}
                      <Text
                        style={[styles.tileName, isPlaying && styles.tileNameActive]}
                        numberOfLines={2}
                      >
                        {sound.name}
                      </Text>
                      {/* Play button */}
                      <TouchableOpacity
                        style={[styles.tilePlay, isPlaying && { backgroundColor: section.color + 'aa' }]}
                        onPress={() => handlePlay(sound)}
                        hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
                      >
                        <Text style={[styles.tilePlayIcon, isPlaying && styles.tilePlayIconActive]}>
                          {isPlaying ? '■' : '▶'}
                        </Text>
                      </TouchableOpacity>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ))
        ) : (
          <>
            {extraSounds.length === 0 && (
              <Text style={styles.emptyText}>Toca no botão abaixo para começar.</Text>
            )}
            <View style={styles.grid}>
              {extraSounds.map(sound => {
                const isPlaying = playingId === sound.id;
                return (
                  <View key={sound.id} style={styles.tileWrapper}>
                    <TouchableOpacity
                      style={[styles.tile, {
                        backgroundColor: isPlaying ? '#5BC4D1' : 'rgba(91,196,209,0.13)',
                        borderColor: isPlaying ? '#5BC4D1' : 'rgba(91,196,209,0.35)',
                      }]}
                      onPress={() => onSelectSound(sound)}
                      activeOpacity={0.75}
                    >
                      <Text style={styles.tileEmoji}>🎵</Text>
                      <TouchableOpacity
                        style={styles.soundNameTouch}
                        onPress={onEditSound ? () => onEditSound(sound) : undefined}
                        activeOpacity={onEditSound ? 0.6 : 1}
                      >
                        <Text style={[styles.tileName, isPlaying && styles.tileNameActive, onEditSound && styles.tileNameEditable]} numberOfLines={2}>
                          {sound.name}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.tilePlay, isPlaying && { backgroundColor: 'rgba(91,196,209,0.5)' }]}
                        onPress={() => handlePlay(sound)}
                        hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
                      >
                        <Text style={[styles.tilePlayIcon, isPlaying && styles.tilePlayIconActive]}>
                          {isPlaying ? '■' : '▶'}
                        </Text>
                      </TouchableOpacity>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.deleteBtn}
                      onPress={() => deleteUserSound(sound.id)}
                      hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
                    >
                      <Text style={styles.deleteBtnText}>✕</Text>
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          </>
        )}
        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

const TILE_SIZE = 96;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },

  subTabBar: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 4,
    gap: 24,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  subTab:          { paddingBottom: 10, alignItems: 'center' },
  subTabText:      { fontSize: 14, fontWeight: '600', color: 'rgba(255,255,255,0.4)' },
  subTabActive:    { color: '#FFF' },
  subTabUnderline: {
    position: 'absolute' as any,
    bottom: 0, left: 0, right: 0,
    height: 2, borderRadius: 1,
    backgroundColor: '#FFF',
  },

  scrollContent: { paddingHorizontal: 14, paddingTop: 16 },

  section:       { marginBottom: 20 },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    marginBottom: 10,
    marginLeft: 2,
  },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },

  tile: {
    width: TILE_SIZE,
    height: TILE_SIZE,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    paddingBottom: 8,
    paddingHorizontal: 6,
  },

  tileWrapper: {
    position: 'relative' as any,
  },

  tileEmoji: {
    fontSize: 26,
    lineHeight: 32,
  },

  tileName: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.75)',
    textAlign: 'center',
    lineHeight: 14,
    flexShrink: 1,
  },
  tileNameActive: { color: '#FFF', fontWeight: '700' },
  tileNameEditable: { textDecorationLine: 'underline' as const },

  soundNameTouch: { flex: 0 },

  tilePlay: {
    width: 24, height: 24, borderRadius: 12,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center', justifyContent: 'center',
  },
  tilePlayIcon:       { color: 'rgba(255,255,255,0.6)', fontSize: 9 },
  tilePlayIconActive: { color: '#FFF' },

  emptyText: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 14,
    marginTop: 10,
    marginBottom: 16,
  },

  deleteBtn: {
    position: 'absolute' as any,
    top: -8, right: -8,
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center', justifyContent: 'center',
    zIndex: 10,
  },
  deleteBtnText: { color: '#FFF', fontSize: 9, fontWeight: '800' },
});
