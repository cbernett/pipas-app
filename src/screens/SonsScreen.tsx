import React, { useState, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TouchableOpacity } from 'react-native';
import SoundList from '../components/SoundList';
import SoundRecorder, { MicIcon } from '../components/SoundRecorder';
import { useApp } from '../context/AppContext';

const { height: SCREEN_H } = Dimensions.get('window');
const FAB_SIZE = 44; // matches RunButton on main screen

export default function SonsScreen() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [landMeus,   setLandMeus]   = useState(false);
  const slideAnim                   = useRef(new Animated.Value(SCREEN_H)).current;
  const insets                      = useSafeAreaInsets();
  const { addUserSound }            = useApp();

  const openDrawer = () => {
    setDrawerOpen(true);
    Animated.spring(slideAnim, {
      toValue: 0,   // SonsScreen is already below AppHeader, so 0 = just under the top bar
      useNativeDriver: true,
      bounciness: 0,
      speed: 14,
    }).start();
  };

  const closeDrawer = () => {
    Animated.timing(slideAnim, {
      toValue: SCREEN_H,
      duration: 260,
      useNativeDriver: true,
    }).start(() => setDrawerOpen(false));
  };

  const handleSave = (name: string, uri?: string) => {
    if (uri) addUserSound(name, uri);
    setLandMeus(true);
    closeDrawer();
  };

  return (
    <View style={styles.root}>
      {/* ── Main list ── */}
      <SoundList
        key={landMeus ? 'meus' : 'biblioteca'}
        initialSubTab={landMeus ? 'meus' : 'biblioteca'}
        onSelectSound={() => {}}
      />

      {/* ── Floating mic FAB — same size as RunButton (44×44) ── */}
      <TouchableOpacity
        style={[styles.fab, { bottom: Platform.OS === 'web' ? insets.bottom + 24 : 24 }]}
        onPress={openDrawer}
        activeOpacity={0.85}
      >
        <MicIcon size={20} color="#FFF" />
      </TouchableOpacity>

      {/* ── Slide-up drawer ── */}
      {drawerOpen && (
        <Animated.View
          style={[styles.drawer, { transform: [{ translateY: slideAnim }] }]}
        >
          {/* Handle pill — matches BlockLibraryBottomSheet */}
          <View style={styles.drawerHandleArea}>
            <View style={styles.drawerHandle} />
          </View>

          <SoundRecorder
            onCancel={closeDrawer}
            onSave={handleSave}
          />
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },

  fab: {
    position: 'absolute',
    right: 20,
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: FAB_SIZE / 2,
    backgroundColor: '#5BC4D1',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#5BC4D1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 10,
  },

  drawer: {
    position: 'absolute',
    left: 0, right: 0, top: 0, bottom: 0,
    backgroundColor: '#000',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.35)',
  },
  drawerHandleArea: {
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  drawerHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.45)',
  },
});
