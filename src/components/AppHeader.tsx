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
      <View style={styles.row}>

        {/* Left: icon tabs with pipe separator */}
        <View style={styles.tabs}>
          <TouchableOpacity
            style={styles.tab}
            onPress={() => setActiveTab('codigo')}
            activeOpacity={0.7}
          >
            <Image
              source={activeTab === 'codigo'
                ? require('../../assets/button-code-selected.png')
                : require('../../assets/button-code-unselected.png')}
              style={styles.tabIcon}
              resizeMode="contain"
            />
          </TouchableOpacity>

          <View style={styles.pipe} />

          <TouchableOpacity
            style={styles.tab}
            onPress={() => setActiveTab('sons')}
            activeOpacity={0.7}
          >
            <Image
              source={activeTab === 'sons'
                ? require('../../assets/button-sound-selected.png')
                : require('../../assets/button-sound-unselected.png')}
              style={styles.tabIcon}
              resizeMode="contain"
            />
          </TouchableOpacity>
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
    paddingHorizontal: 16,
    paddingTop: 25,
    paddingBottom: 15,
  },

  // Left — icon tabs
  tabs: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tab: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  tabIcon: {
    width: 20,
    height: 20,
  },
  pipe: {
    width: 1.5,
    height: 18,
    backgroundColor: 'rgba(255,255,255,0.5)',
    marginHorizontal: 8,
  },

  // Center — grows to fill space, centres icon
  centerLogo: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    width: 40,
    height: 40,
  },

  // Right — connect button
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
});
