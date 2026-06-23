import React, { useState, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { playSound, stopAllSounds } from '../audio';
import { useApp, UserSound } from '../context/AppContext';

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
  initialSubTab?: SubTab;
}

const LIBRARY_SOUNDS: Sound[] = [
  { id: '1', name: 'Miado',    fileKey: 'meow!', duration: '0.8s' },
  { id: '2', name: 'Bah!',     fileKey: 'bah!',  duration: '0.5s' },
  { id: '3', name: 'Aplausos', fileKey: 'cheer', duration: '2.1s' },
  { id: '4', name: 'Erro',     fileKey: 'erro',  duration: '0.4s' },
  { id: '5', name: 'Menu',     fileKey: 'menu',  duration: '1.0s' },
];

export default function SoundList({ onSelectSound, initialSubTab = 'biblioteca' }: Props) {
  const [subTab, setSubTab]       = useState<SubTab>(initialSubTab);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const insets                    = useSafeAreaInsets();
  const audioBlobRef              = useRef<HTMLAudioElement | null>(null);
  const { userSounds, deleteUserSound } = useApp();

  const extraSounds: Sound[] = userSounds.map(s => ({
    id: s.id, name: s.name, fileKey: s.name, duration: '', uri: s.uri,
  }));

  const visibleSounds = subTab === 'biblioteca' ? LIBRARY_SOUNDS : extraSounds;
  const canDelete     = subTab === 'meus';

  const handlePlay = async (sound: Sound) => {
    if (playingId === sound.id) {
      if (Platform.OS === 'web' && audioBlobRef.current) {
        audioBlobRef.current.pause();
        audioBlobRef.current = null;
      } else if (Platform.OS !== 'web' && sound.uri) {
        const { PipasAudio } = require('../../modules/pipas-audio');
        PipasAudio.stopFile(sound.uri).catch(() => {});
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
    } else if (Platform.OS !== 'web' && sound.uri) {
      // Recorded user sound — play from file path
      const { PipasAudio } = require('../../modules/pipas-audio');
      PipasAudio.playFile(sound.uri).catch(() => {}).finally(() => setPlayingId(null));
    } else {
      await playSound(sound.fileKey);
      setPlayingId(null);
    }
  };

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      {/* Sub-tabs */}
      <View style={styles.subTabBar}>
        <TouchableOpacity
          style={styles.subTab}
          onPress={() => setSubTab('biblioteca')}
          activeOpacity={0.7}
        >
          <Text style={[styles.subTabText, subTab === 'biblioteca' && styles.subTabActive]}>
            BIBLIOTECA
          </Text>
          {subTab === 'biblioteca' && <View style={styles.subTabUnderline} />}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.subTab}
          onPress={() => setSubTab('meus')}
          activeOpacity={0.7}
        >
          <Text style={[styles.subTabText, subTab === 'meus' && styles.subTabActive]}>
            MEUS SONS
          </Text>
          {subTab === 'meus' && <View style={styles.subTabUnderline} />}
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      >
        {visibleSounds.length === 0 && (
          <Text style={styles.emptyText}>
            Toca no botão abaixo para começar.
          </Text>
        )}

        {visibleSounds.map((sound) => (
          <View key={sound.id} style={styles.rowWrapper}>
            <TouchableOpacity
              style={styles.soundRow}
              onPress={() => onSelectSound(sound)}
              activeOpacity={0.8}
            >
              {/* Waveform bars */}
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

            {/* Delete badge — only on Meus sons */}
            {canDelete && (
              <TouchableOpacity
                style={styles.deleteBtn}
                onPress={() => deleteUserSound(sound.id)}
                hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
              >
                <Text style={styles.deleteBtnText}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}
      </ScrollView>

      <View style={{ height: Math.max(insets.bottom, 16) }} />
    </View>
  );
}

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
  subTab:      { paddingBottom: 10, alignItems: 'center' },
  subTabText:  { fontSize: 14, fontWeight: '600', color: 'rgba(255,255,255,0.4)' },
  subTabActive:{ color: '#FFF' },
  subTabUnderline: {
    position: 'absolute' as any,
    bottom: 0, left: 0, right: 0,
    height: 2, borderRadius: 1,
    backgroundColor: '#FFF',
  },

  list: { padding: 16, paddingTop: 14, gap: 12 },

  emptyText: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 21,
    marginTop: 10,
  },

  rowWrapper: { position: 'relative' as any },
  soundRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 14,
    padding: 14,
    gap: 12,
  },
  waveform:      { flexDirection: 'row', alignItems: 'center', gap: 2, width: 48 },
  bar:           { width: 3, borderRadius: 2 },
  soundInfo:     { flex: 1 },
  soundName:     { fontSize: 15, fontWeight: '700', color: '#FFF' },
  soundDuration: { fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 2 },

  playBtn: {
    width: 36, height: 36, borderRadius: 18,
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.4)',
    alignItems: 'center', justifyContent: 'center',
  },
  playBtnActive:     { borderColor: '#FFF', backgroundColor: 'rgba(255,255,255,0.1)' },
  playBtnText:       { color: 'rgba(255,255,255,0.6)', fontSize: 12 },
  playBtnTextActive: { color: '#FFF' },

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
