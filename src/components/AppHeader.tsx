import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '../context/AppContext';
import BoardStatusButton from './BoardStatusButton';
import RunButton from './RunButton';

export default function AppHeader() {
  const { activeTab, setActiveTab } = useApp();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.row}>
        {/* Left spacer */}
        <View style={styles.side} />

        {/* Logo — centered (replace icon.png with your logo file) */}
        <View style={styles.logoContainer}>
          <Image
            source={require('../../assets/pipas_loog_app_header.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>

        {/* Right: stop button (during execution) + board status */}
        <View style={[styles.side, styles.sideRight]}>
          <RunButton />
          <BoardStatusButton />
        </View>
      </View>

      {/* Tabs */}
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
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  side: {
    flex: 1,
    alignItems: 'flex-start',
  },
  sideRight: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 6,
  },
  logoContainer: {
    flex: 2,
    alignItems: 'center',
  },
  logoImage: {
    width: 120,
    height: 38,
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 16,
  },
  tab: {
    paddingHorizontal: 18,
    paddingVertical: 9,
    marginRight: 2,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#7C5CBF',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.4)',
  },
  tabTextActive: {
    color: '#FFF',
  },
});
