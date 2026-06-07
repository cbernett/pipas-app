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
      {/* Single row: logo | tabs | actions — all bottom-aligned */}
      <View style={styles.row}>
        <Image
          source={require('../../assets/pipas_loog_app_header.png')}
          style={styles.logoImage}
          resizeMode="contain"
        />

        {/* Tabs sit flush at the bottom of the row */}
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

        {/* Right actions — bottom-aligned with the tabs */}
        <View style={styles.actions}>
          <RunButton />
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
    paddingTop: 16,
  },
  logoImage: {
    width: 160,
    height: 52,
    marginRight: 8,
    marginBottom: 4,
  },
  tabs: {
    flex: 1,
    flexDirection: 'row',
  },
  tab: {
    paddingHorizontal: 14,
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
  actions: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 6,
    paddingBottom: 6,
  },
});
