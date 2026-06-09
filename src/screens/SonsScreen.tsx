import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import SoundList from '../components/SoundList';
import SoundRecorder from '../components/SoundRecorder';

export interface Sound {
  id: string;
  name: string;
  fileKey: string;
  duration: string;
  uri?: string;
}

type Tab = 'library' | 'record';

export default function SonsScreen() {
  const [tab, setTab]               = useState<Tab>('library');
  const [extraSounds, setExtraSounds] = useState<Sound[]>([]);
  const insets                        = useSafeAreaInsets();

  const handleSave = (name: string, uri?: string) => {
    const newSound: Sound = {
      id: `rec_${Date.now()}`,
      name,
      fileKey: name,
      duration: '',
      uri,
    };
    setExtraSounds(prev => [...prev, newSound]);
    setTab('library');
  };

  return (
    <View style={styles.container}>
      {/* ── Tab switcher ── */}
      <View style={[styles.tabBar, { paddingTop: Math.max(insets.top, 12) }]}>
        <TouchableOpacity
          style={[styles.tab, tab === 'library' && styles.tabActive]}
          onPress={() => setTab('library')}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabText, tab === 'library' && styles.tabTextActive]}>
            Escolha um som
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tab === 'record' && styles.tabActive]}
          onPress={() => setTab('record')}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabText, tab === 'record' && styles.tabTextActive]}>
            Grave um som
          </Text>
        </TouchableOpacity>
      </View>

      {/* ── Content ── */}
      <View style={styles.content}>
        {tab === 'library' ? (
          <SoundList
            extraSounds={extraSounds}
            onRecord={() => setTab('record')}
            onSelectSound={() => {}}
            onDeleteExtra={(id) => setExtraSounds(prev => prev.filter(s => s.id !== id))}
          />
        ) : (
          <SoundRecorder
            onCancel={() => setTab('library')}
            onSave={handleSave}
          />
        )}
      </View>
    </View>
  );
}

const PURPLE_DARK = '#1E1B4B';
const PURPLE_MID  = '#2D2775';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: PURPLE_DARK },
  tabBar: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    paddingBottom: 14,
    backgroundColor: PURPLE_MID,
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  tabActive: {
    backgroundColor: '#5BC4D1',
  },
  tabText:       { fontSize: 14, fontWeight: '700', color: 'rgba(255,255,255,0.5)' },
  tabTextActive: { color: '#FFF' },
  content: { flex: 1 },
});
