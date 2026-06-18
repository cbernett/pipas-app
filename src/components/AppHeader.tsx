import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '../context/AppContext';
import BoardStatusButton from './BoardStatusButton';

export default function AppHeader() {
  const { activeTab, setActiveTab } = useApp();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <View style={[styles.row, { paddingTop: Math.max(insets.top, 10) + 10 }]}>

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

        {/* Center: icon — flex:1 + alignItems center keeps it truly centred */}
        <View style={styles.centerLogo} pointerEvents="none">
          <Image
            source={require('../../assets/pipas_icon.png')}
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

    paddingBottom: 10,
  },

  // Left — icon tabs
  tabs: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tab: {
    paddingHorizontal: 6,
    paddingBottom: 4,
    alignItems: 'center',
  },
  tabIcon: {
    width: 18,
    height: 18,
  },
  tabUnderline: {
    height: 2,
    borderRadius: 1,
    marginTop: 8,
    width: 28,
  },
  tabUnderlineActive:   { backgroundColor: '#FFF' },
  tabUnderlineInactive: { backgroundColor: 'rgba(255,255,255,0.25)' },

  // Center — absolutely positioned so left/right content can't push it off-center.
  // top/bottom: 0 ensures it fills the row height so justifyContent: 'center' works.
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
