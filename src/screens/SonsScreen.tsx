import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import SoundList from '../components/SoundList';
import SoundRecorder from '../components/SoundRecorder';
import { useApp } from '../context/AppContext';

type Tab = 'library' | 'record';

export default function SonsScreen() {
  const [tab, setTab]               = useState<Tab>('library');
  const [openMeus, setOpenMeus]     = useState(false);
  const insets                      = useSafeAreaInsets();
  const { addUserSound }            = useApp();

  const handleSave = (name: string, uri?: string) => {
    if (uri) addUserSound(name, uri);
    setOpenMeus(true);   // signal SoundList to land on "Meus sons"
    setTab('library');
  };

  const handleGoToLibrary = () => {
    setOpenMeus(false);
    setTab('library');
  };

  return (
    <View style={styles.container}>
      {/* ── Tab switcher ── */}
      <View style={[styles.tabBar, { paddingTop: Math.max(insets.top, 12) }]}>
        <TouchableOpacity
          style={[styles.tab, tab === 'library' && styles.tabActive]}
          onPress={handleGoToLibrary}
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
            key={openMeus ? 'meus' : 'biblioteca'}
            initialSubTab={openMeus ? 'meus' : 'biblioteca'}
            onRecord={() => setTab('record')}
            onSelectSound={() => {}}
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
