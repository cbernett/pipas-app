import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '../context/AppContext';
import BoardStatusButton from './BoardStatusButton';

export default function AppHeader() {
  const { activeTab, setActiveTab } = useApp();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.row}>
        {/* Left: tabs */}
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'codigo' && styles.tabActive]}
            onPress={() => setActiveTab('codigo')}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabText, activeTab === 'codigo' && styles.tabTextActive]}>
              Código
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'sons' && styles.tabActive]}
            onPress={() => setActiveTab('sons')}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabText, activeTab === 'sons' && styles.tabTextActive]}>
              Sons
            </Text>
          </TouchableOpacity>
        </View>

        {/* Center: logo */}
        <View style={styles.logoContainer}>
          <Image
            source={require('../../assets/pipas_loog_app_header.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>

        {/* Right: connect button */}
        <View style={styles.actions}>
          <BoardStatusButton />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#000000',
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingTop: 28,
    paddingBottom: 0,   // tab underlines flush with workspace border
  },

  // Left — tabs flush to bottom
  tabs: {
    flex: 1,
    flexDirection: 'row',
  },
  tab: {
    paddingHorizontal: 14,
    paddingTop: 4,
    paddingBottom: 16,  // pushes text up to align with logo & connect button
    marginRight: 2,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#FFF',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.4)',
  },
  tabTextActive: {
    color: '#FFF',
  },

  // Center — logo
  logoContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    pointerEvents: 'none',
  } as any,
  logoImage: {
    width: 160,
    height: 52,
    marginBottom: 4,
  },

  // Right — bottom-aligned actions
  actions: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    gap: 6,
    paddingBottom: 6,
  },
});
