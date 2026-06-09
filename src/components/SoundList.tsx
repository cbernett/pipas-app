import React, { useState, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { playSound, stopAllSounds } from '../audio';

export interface Sound {
  id: string;
  name: string;
  fileKey: string;
  duration: string;
  uri?: string;
}

interface Props {
  extraSounds?: Sound[];
  onRecord: () => void;
  onSelectSound: (sound: Sound) => void;
  onDeleteExtra?: (id: string) => void;
}

const DEFAULT_SOUNDS: Sound[] = [
  { id: '1', name: 'Miado',    fileKey: 'meow!', duration: '0.8s' },
  { id: '2', name: 'Bah!',     fileKey: 'bah!',  duration: '0.5s' },
  { id: '3', name: 'Aplausos', fileKey: 'cheer', duration: '2.1s' },
  { id: '4', name: 'Erro',     fileKey: 'erro',  duration: '0.4s' },
  { id: '5', name: 'Menu',     fileKey: 'menu',  duration: '1.0s' },
];

// Simple mic icon built from Views — no emoji, no image dependency
function MicIcon({ size = 18, color = '#000' }: { size?: number; color?: string }) {
  const s = size;
  return (
    <View style={{ alignItems: 'center' }}>
      {/* capsule head */}
      <View style={{
        width: s * 0.52, height: s * 0.7,
        borderRadius: s * 0.26, backgroundColor: color,
      }} />
      {/* arc stand */}
      <View style={{
        width: s * 0.85, height: s * 0.45,
        borderLeftWidth: s * 0.11, borderRightWidth: s * 0.11, borderBottomWidth: s * 0.11,
        borderColor: color, borderStyle: 'solid',
        borderBottomLeftRadius: s * 0.5, borderBottomRightRadius: s * 0.5,
        marginTop: -s * 0.12,
      }} />
      {/* post */}
      <View style={{ width: s * 0.11, height: s * 0.22, backgroundColor: color }} />
      {/* base */}
      <View style={{ width: s * 0.55, height: s * 0.11, backgroundColor: color, borderRadius: 2 }} />
    </View>
  );
}

export default function SoundList({ extraSounds = [], onRecord, onSelectSound, onDeleteExtra }: Props) {
  const [sounds, setSounds]       = useState<Sound[]>(DEFAULT_SOUNDS);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const insets                    = useSafeAreaInsets();
  const audioBlobRef              = useRef<HTMLAudioElement | null>(null);

  const allSounds = [...sounds, ...extraSounds];

  const handlePlay = async (sound: Sound) => {
    if (playingId === sound.id) {
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
      const audio = new Audio(sound.uri);
      audioBlobRef.current = audio;
      audio.onended = () => { setPlayingId(null); audioBlobRef.current = null; };
      audio.play().catch(() => setPlayingId(null));
    } else {
      await playSound(sound.fileKey);
      setPlayingId(null);
    }
  };

  const handleDelete = (sound: Sound) => {
    // Check if it's an extra (recorded) sound
    if (sound.id.startsWith('rec_')) {
      onDeleteExtra?.(sound.id);
    } else {
      setSounds(prev => prev.filter(s => s.id !== sound.id));
    }
  };

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <ScrollView
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      >
        {allSounds.map((sound) => (
          // outer wrapper with overflow visible so delete badge can bleed outside
          <View key={sound.id} style={styles.rowWrapper}>
            <TouchableOpacity
              style={styles.soundRow}
              onPress={() => onSelectSound(sound)}
              activeOpacity={0.8}
            >
              {/* Waveform */}
              <View style={styles.waveform}>
                {[3, 6, 10, 7, 12, 5, 8, 11, 4, 9, 6].map((h, i) => (
                  <View key={i} style={[styles.bar, {
                    height: h * 2,
                    backgroundColor: playingId === sound.id
                      ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.25)',
                  }]} />
                ))}
              </View>

              <View style={styles.soundInfo}>
                <Text style={styles.soundName}>{sound.name}</Text>
                {sound.duration ? <Text style={styles.soundDuration}>{sound.duration}</Text> : null}
              </View>

              {/* Play/stop */}
              <TouchableOpacity
                style={[styles.playBtn, playingId === sound.id && styles.playBtnActive]}
                onPress={() => handlePlay(sound)}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              >
                <Text style={[styles.playBtnText, playingId === sound.id && styles.playBtnTextActive]}>
                  {playingId === sound.id ? '■' : '▶'}
                </Text>
              </TouchableOpacity>
            </TouchableOpacity>

            {/* Delete badge — bleeds outside the row onto the corner */}
            <TouchableOpacity
              style={styles.deleteBtn}
              onPress={() => handleDelete(sound)}
              hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
            >
              <Text style={styles.deleteBtnText}>✕</Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>

      {/* Action bar */}
      <View style={[styles.actions, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <TouchableOpacity style={styles.actionBtn} onPress={onRecord} activeOpacity={0.8}>
          {/* Mic icon circle */}
          <View style={styles.micCircle}>
            <MicIcon size={18} color="#FFF" />
          </View>
          <Text style={styles.actionBtnText}>Gravar Som</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1A1F2E' },
  list: { padding: 16, paddingTop: 20, gap: 16 },

  rowWrapper: {
    position: 'relative' as any,
  },
  soundRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#13172A',
    borderRadius: 14,
    padding: 14,
    paddingRight: 14,
    gap: 12,
  },
  waveform: { flexDirection: 'row', alignItems: 'center', gap: 2, width: 48 },
  bar: { width: 3, borderRadius: 2 },
  soundInfo: { flex: 1 },
  soundName: { fontSize: 15, fontWeight: '700', color: '#FFF' },
  soundDuration: { fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 2 },

  playBtn: {
    width: 36, height: 36, borderRadius: 18,
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.4)',
    alignItems: 'center', justifyContent: 'center',
  },
  playBtnActive: { borderColor: '#FFF', backgroundColor: 'rgba(255,255,255,0.1)' },
  playBtnText: { color: 'rgba(255,255,255,0.6)', fontSize: 12 },
  playBtnTextActive: { color: '#FFF' },

  deleteBtn: {
    position: 'absolute' as any,
    top: -9,
    right: -9,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  deleteBtnText: { color: '#FFF', fontSize: 9, fontWeight: '800' },

  actions: {
    padding: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
    backgroundColor: '#1A1F2E',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.5)',
    borderRadius: 14,
    paddingVertical: 14,
  },
  micCircle: {
    width: 30, height: 30, borderRadius: 15,
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.5)',
    alignItems: 'center', justifyContent: 'center',
  },
  actionBtnText: { fontSize: 15, fontWeight: '700', color: '#FFF' },
});
