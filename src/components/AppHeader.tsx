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
        {/* Left: logo */}
        <Image
          source={require('../../assets/pipas_loog_app_header.png')}
          style={styles.logoImage}
          resizeMode="contain"
        />

        {/* Center: tabs (absolutely centred) */}
        <View style={styles.tabsCenter} pointerEvents="box-none">
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

        {/* Right: connect button — box-none so it doesn't block centered tab clicks */}
        <View style={styles.actions} pointerEvents="box-none">
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
    paddingLeft: 0,
    paddingRight: 12,
    paddingTop: 20,
    paddingBottom: 0,
  },

  // Left — logo
  logoImage: {
    width: 100,
    height: 34,
    marginBottom: 13,
  },

  // Center — tabs absolutely centred
  tabsCenter: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
  } as any,
  tab: {
    paddingHorizontal: 14,
    paddingTop: 4,
    paddingBottom: 16,
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

  // Right — bottom-aligned actions
  actions: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    gap: 6,
    paddingBottom: 16,
  },
});
