import React from 'react';
import { View, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '../context/AppContext';
import BoardStatusButton from './BoardStatusButton';

export default function AppHeader() {
  const { activeTab, setActiveTab } = useApp();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, 10) }]}>
      <View style={styles.row}>

        {/* Left: icon tabs */}
        <View style={styles.tabs}>
          {(['codigo', 'sons'] as const).map((tab) => {
            const isActive = activeTab === tab;
            return (
              <TouchableOpacity
                key={tab}
                style={styles.tab}
                onPress={() => setActiveTab(tab)}
                activeOpacity={0.7}
              >
                <Image
                  source={isActive
                    ? (tab === 'codigo' ? require('../../assets/button-code-selected.png') : require('../../assets/button-sound-selected.png'))
                    : (tab === 'codigo' ? require('../../assets/button-code-unselected.png') : require('../../assets/button-sound-unselected.png'))}
                  style={styles.tabIcon}
                  resizeMode="contain"
                />
                <View style={[styles.tabUnderline, isActive ? styles.tabUnderlineActive : styles.tabUnderlineInactive]} />
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Center: logo — absolutely positioned so left/right don't push it */}
        <View style={styles.centerLogo} pointerEvents="none">
          <Image
            source={require('../../assets/pipas_header_logo.png')}
            style={styles.icon}
            resizeMode="contain"
          />
        </View>

        {/* Right: connect button */}
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    minHeight: 52,
  },

  // Left — icon tabs
  tabs: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tab: {
    paddingHorizontal: 6,
    paddingTop: 4,
    paddingBottom: 2,
    alignItems: 'center',
    gap: 5,
  },
  tabIcon: {
    width: 20,
    height: 20,
  },
  tabUnderline: {
    height: 2,
    borderRadius: 1,
    width: 28,
  },
  tabUnderlineActive:   { backgroundColor: '#FFF' },
  tabUnderlineInactive: { backgroundColor: 'rgba(255,255,255,0.25)' },

  // Center — absolutely positioned
  centerLogo: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    width: 32,
    height: 32,
  },

  // Right — connect button
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
});
