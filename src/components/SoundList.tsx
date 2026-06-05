import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { playSound, stopAllSounds } from '../audio';

interface Sound {
  id: string;
  name: string;
  duration: string;
}

interface Props {
  onRecord: () => void;
  onSelectSound: (sound: Sound) => void;
}

const DEFAULT_SOUNDS: Sound[] = [
  { id: '1', name: 'meow!', duration: '0.8s' },
  { id: '2', name: 'bah!', duration: '0.5s' },
  { id: '3', name: 'cheer', duration: '2.1s' },
  { id: '4', name: 'erro', duration: '0.4s' },
  { id: '5', name: 'menu', duration: '1.0s' },
];

export default function SoundList({ onRecord, onSelectSound }: Props) {
  const [sounds, setSounds] = useState<Sound[]>(DEFAULT_SOUNDS);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const insets = useSafeAreaInsets();

  const handlePlay = async (sound: Sound) => {
    if (playingId === sound.id) {
      await stopAllSounds();
      setPlayingId(null);
      return;
    }
    setPlayingId(sound.id);
    await playSound(sound.name);
    setPlayingId(null);
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
        {sounds.map((sound) => (
          <TouchableOpacity
            key={sound.id}
            style={styles.soundRow}
            onPress={() => onSelectSound(sound)}
            activeOpacity={0.8}
          >
            {/* Waveform preview (decorative) */}
            <View style={styles.waveform}>
              {[3, 6, 10, 7, 12, 5, 8, 11, 4, 9, 6].map((h, i) => (
                <View key={i} style={[styles.bar, { height: h * 2, backgroundColor: playingId === sound.id ? '#6B4FBB' : '#CCC' }]} />
              ))}
            </View>

            <View style={styles.soundInfo}>
              <Text style={styles.soundName}>{sound.name}</Text>
              <Text style={styles.soundDuration}>{sound.duration}</Text>
            </View>

            <TouchableOpacity
              style={[styles.iconBtn, { backgroundColor: playingId === sound.id ? '#6B4FBB' : '#F0F0F0' }]}
              onPress={() => handlePlay(sound)}
            >
              <Text style={{ color: playingId === sound.id ? '#FFF' : '#333', fontSize: 14 }}>
                {playingId === sound.id ? '■' : '▶'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.iconBtn, { backgroundColor: '#FFF0F0' }]}
              onPress={() => handleDelete(sound.id)}
            >
              <Text style={{ color: '#EF4444', fontSize: 16 }}>✕</Text>
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
          <Text style={[styles.actionBtnText, { color: '#6B4FBB' }]}>Importar Som</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F8FC',
  },
  list: {
    padding: 16,
    gap: 12,
  },
  soundRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
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
    color: '#1A1A2E',
  },
  soundDuration: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actions: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#EFEFEF',
    backgroundColor: '#FFF',
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
    backgroundColor: '#F0EEFF',
  },
  actionBtnIcon: {
    fontSize: 18,
  },
  actionBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFF',
  },
});
