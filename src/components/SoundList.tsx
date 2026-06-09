import React, { useState, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { playSound, stopAllSounds } from '../audio';

interface Sound {
  id: string;
  name: string;       // display name
  fileKey: string;    // key used by playSound()
  duration: string;
  uri?: string;       // blob URL for recorded sounds
}

interface Props {
  extraSounds?: Sound[];
  onRecord: () => void;
  onSelectSound: (sound: Sound) => void;
}

const DEFAULT_SOUNDS: Sound[] = [
  { id: '1', name: 'Miado',     fileKey: 'meow!', duration: '0.8s' },
  { id: '2', name: 'Bah!',      fileKey: 'bah!',  duration: '0.5s' },
  { id: '3', name: 'Aplausos',  fileKey: 'cheer', duration: '2.1s' },
  { id: '4', name: 'Erro',      fileKey: 'erro',  duration: '0.4s' },
  { id: '5', name: 'Menu',      fileKey: 'menu',  duration: '1.0s' },
];

export default function SoundList({ extraSounds = [], onRecord, onSelectSound }: Props) {
  const [sounds, setSounds]       = useState<Sound[]>(DEFAULT_SOUNDS);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const insets                    = useSafeAreaInsets();
  const audioBlobRef              = useRef<HTMLAudioElement | null>(null);

  const allSounds = [...sounds, ...extraSounds];

  const handlePlay = async (sound: Sound) => {
    if (playingId === sound.id) {
      // Stop
      if (Platform.OS === 'web' && audioBlobRef.current) {
        audioBlobRef.current.pause();
        audioBlobRef.current = null;
      } else {
        await stopAllSounds();
      }
      setPlayingId(null);
      return;
    }
    setPlayingId(sound.id);
    if (Platform.OS === 'web' && sound.uri) {
      // Play recorded blob
      const audio = new Audio(sound.uri);
      audioBlobRef.current = audio;
      audio.onended = () => { setPlayingId(null); audioBlobRef.current = null; };
      audio.play().catch(() => setPlayingId(null));
    } else {
      await playSound(sound.fileKey);
      setPlayingId(null);
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert('Apagar som', 'Tem certeza?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Apagar', style: 'destructive', onPress: () => setSounds(sounds.filter((s) => s.id !== id)) },
    ]);
  };

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <ScrollView contentContainerStyle={styles.list}>
        {allSounds.map((sound) => (
          <TouchableOpacity
            key={sound.id}
            style={styles.soundRow}
            onPress={() => onSelectSound(sound)}
            activeOpacity={0.8}
          >
            {/* Waveform preview (decorative) */}
            <View style={styles.waveform}>
              {[3, 6, 10, 7, 12, 5, 8, 11, 4, 9, 6].map((h, i) => (
                <View
                  key={i}
                  style={[
                    styles.bar,
                    {
                      height: h * 2,
                      backgroundColor: playingId === sound.id
                        ? 'rgba(255,255,255,0.9)'
                        : 'rgba(255,255,255,0.25)',
                    },
                  ]}
                />
              ))}
            </View>

            <View style={styles.soundInfo}>
              <Text style={styles.soundName}>{sound.name}</Text>
              <Text style={styles.soundDuration}>{sound.duration}</Text>
            </View>

            <TouchableOpacity
              style={[styles.iconBtn, { backgroundColor: playingId === sound.id ? '#6B4FBB' : 'rgba(255,255,255,0.12)' }]}
              onPress={() => handlePlay(sound)}
            >
              <Text style={{ color: '#FFF', fontSize: 14 }}>
                {playingId === sound.id ? '■' : '▶'}
              </Text>
            </TouchableOpacity>

            {/* Delete — small x circle at top-right corner */}
            <TouchableOpacity
              style={styles.deleteBtn}
              onPress={() => handleDelete(sound.id)}
              hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
            >
              <Text style={styles.deleteBtnText}>✕</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Global actions */}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionBtn} onPress={onRecord} activeOpacity={0.8}>
          <Text style={styles.actionBtnIcon}>🎙</Text>
          <Text style={styles.actionBtnText}>Gravar Som</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionBtn, styles.actionBtnSecondary]} activeOpacity={0.8}>
          <Text style={styles.actionBtnIcon}>📂</Text>
          <Text style={[styles.actionBtnText, styles.actionBtnSecondaryText]}>Importar Som</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1F2E',
  },
  list: {
    padding: 16,
    gap: 12,
  },
  soundRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#13172A',
    borderRadius: 14,
    padding: 14,
    paddingRight: 40,   // space so play btn doesn't sit under delete circle
    gap: 12,
  },
  waveform: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    width: 48,
  },
  bar: {
    width: 3,
    borderRadius: 2,
  },
  soundInfo: {
    flex: 1,
  },
  soundName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  soundDuration: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
    marginTop: 2,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtnText: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 10,
    fontWeight: '700',
  },
  actions: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
    backgroundColor: '#1A1F2E',
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#6B4FBB',
    borderRadius: 14,
    paddingVertical: 14,
  },
  actionBtnSecondary: {
    backgroundColor: 'rgba(107,79,187,0.25)',
  },
  actionBtnIcon: {
    fontSize: 18,
  },
  actionBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFF',
  },
  actionBtnSecondaryText: {
    color: 'rgba(255,255,255,0.8)',
  },
});
