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
  onEditSound?: (sound: Sound) => void;
  initialSubTab?: SubTab;
}

const LIBRARY_SOUNDS: Sound[] = [
  { id: '1',  name: 'Miado',    fileKey: 'meow!',   duration: '0.6s' },
  { id: '2',  name: 'Bah!',     fileKey: 'bah!',    duration: '0.5s' },
  { id: '3',  name: 'Aplausos', fileKey: 'cheer',   duration: '1.8s' },
  { id: '4',  name: 'Erro',     fileKey: 'erro',    duration: '0.6s' },
  { id: '5',  name: 'Menu',     fileKey: 'menu',    duration: '0.5s' },
  { id: '6',  name: 'Laser',    fileKey: 'laser',   duration: '0.4s' },
  { id: '7',  name: 'Boing',    fileKey: 'boing',   duration: '0.8s' },
  { id: '8',  name: 'Tambor',   fileKey: 'tambor',  duration: '0.5s' },
  { id: '9',  name: 'Sino',     fileKey: 'sino',    duration: '1.2s' },
  { id: '10', name: 'Foguete',  fileKey: 'foguete', duration: '0.9s' },
  { id: '11', name: 'Moeda',    fileKey: 'moeda',   duration: '0.6s' },
  { id: '12', name: 'Alarme',   fileKey: 'alarme',  duration: '1.0s' },
  { id: '13', name: 'Vitória',  fileKey: 'vitoria', duration: '1.3s' },
  { id: '14', name: 'Splash',   fileKey: 'splash',  duration: '0.6s' },
  { id: '15', name: 'Buzzer',   fileKey: 'buzzer',  duration: '0.4s' },
];

const BAR_HEIGHTS = [3, 6, 10, 7, 12, 5, 8, 11, 4, 9, 6];
const BAR_COUNT_LIST = BAR_HEIGHTS.length;

export default function SoundList({ onSelectSound, onEditSound, initialSubTab = 'biblioteca' }: Props) {
  const [subTab, setSubTab]         = useState<SubTab>(initialSubTab);
  const [playingId, setPlayingId]   = useState<string | null>(null);
  const [playProgress, setPlayProgress] = useState(0); // 0–1
  const insets                      = useSafeAreaInsets();
  const audioBlobRef                = useRef<HTMLAudioElement | null>(null);
  const playPollRef                 = useRef<ReturnType<typeof setInterval> | null>(null);
  const playStartRef                = useRef(0);
  const playingIdRef                = useRef<string | null>(null);
  const { userSounds, deleteUserSound } = useApp();

  const stopProgress = () => {
    if (playPollRef.current) { clearInterval(playPollRef.current); playPollRef.current = null; }
    setPlayProgress(0);
  };

  const startProgress = (durationSec: number, onDone?: () => void) => {
    playStartRef.current = Date.now();
    playPollRef.current = setInterval(() => {
      const pos = Math.min((Date.now() - playStartRef.current) / 1000 / durationSec, 1);
      setPlayProgress(pos);
      if (pos >= 1) {
        stopProgress();
        onDone?.();
      }
    }, 50);
  };

  const extraSounds: Sound[] = userSounds.map(s => ({
    id: s.id, name: s.name, fileKey: s.name,
    duration: s.duration != null ? `${s.duration.toFixed(1)}s` : '',
    uri: s.uri,
  }));

  const visibleSounds = subTab === 'biblioteca' ? LIBRARY_SOUNDS : extraSounds;
  const canDelete     = subTab === 'meus';

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
      stopProgress();
      return;
    }
    stopProgress();
    playingIdRef.current = sound.id;
    setPlayingId(sound.id);
    // Parse duration for progress bar (e.g. "2.1s" → 2.1, fallback 3s)
    const durSec = sound.duration ? parseFloat(sound.duration) : 3;
    const clearPlaying = () => { playingIdRef.current = null; setPlayingId(null); };
    const onError = () => { clearPlaying(); stopProgress(); };
    if (Platform.OS === 'web' && sound.uri) {
      startProgress(isNaN(durSec) ? 3 : durSec, clearPlaying);
      const audio = new Audio(sound.uri);
      audioBlobRef.current = audio;
      audio.onended = () => { audioBlobRef.current = null; clearPlaying(); stopProgress(); };
      audio.play().catch(onError);
    } else if (Platform.OS !== 'web' && sound.uri) {
      // Native: promise resolves immediately (fire-and-forget) — interval drives cleanup
      startProgress(isNaN(durSec) ? 3 : durSec, clearPlaying);
      const { PipasAudio } = require('../../modules/pipas-audio');
      PipasAudio.playFile(sound.uri).catch(onError);
    } else {
      // Library sounds: playSound awaits completion
      startProgress(isNaN(durSec) ? 3 : durSec, clearPlaying);
      playSound(sound.fileKey).then(clearPlaying).catch(onError);
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
              {/* Waveform bars with playback progress */}
              <View style={styles.waveform}>
                {BAR_HEIGHTS.map((h, i) => {
                  const isActive = playingId === sound.id;
                  const passed = isActive && (i / BAR_COUNT_LIST) <= playProgress;
                  return (
                    <View key={i} style={[styles.bar, {
                      height: h * 2,
                      backgroundColor: passed
                        ? '#5BC4D1'
                        : isActive
                          ? 'rgba(255,255,255,0.25)'
                          : 'rgba(255,255,255,0.25)',
                    }]} />
                  );
                })}
              </View>

              <TouchableOpacity
                style={styles.soundInfo}
                onPress={canDelete && onEditSound ? () => onEditSound(sound) : undefined}
                activeOpacity={canDelete && onEditSound ? 0.6 : 1}
              >
                <Text style={[styles.soundName, canDelete && onEditSound && styles.soundNameEditable]}>
                  {sound.name}
                </Text>
                {sound.duration ? <Text style={styles.soundDuration}>{sound.duration}</Text> : null}
              </TouchableOpacity>

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
  soundName:         { fontSize: 15, fontWeight: '700', color: '#FFF' },
  soundNameEditable: { textDecorationLine: 'underline' as const },
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
