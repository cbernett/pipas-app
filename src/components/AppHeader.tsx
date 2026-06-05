import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
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
        {/* Board status - left side */}
        <View style={styles.side}>
          <BoardStatusButton />
        </View>

        {/* Logo centered */}
        <View style={styles.logoContainer}>
          <View style={styles.logoBadge}>
            <View style={styles.logoIconDot} />
            <Text style={styles.logo}>pipas</Text>
          </View>
        </View>

        {/* Run button - right side */}
        <View style={[styles.side, styles.sideRight]}>
          <RunButton />
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
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EFEFEF',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  side: {
    flex: 1,
    alignItems: 'flex-start',
  },
  sideRight: {
    alignItems: 'flex-end',
  },
  logoContainer: {
    flex: 2,
    alignItems: 'center',
  },
  logoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: '#F0EEFF',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  logoIconDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#6B4FBB',
  },
  logo: {
    fontSize: 18,
    fontWeight: '800',
    color: '#6B4FBB',
    letterSpacing: 1.5,
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 0,
  },
  tab: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginRight: 4,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#6B4FBB',
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#999',
  },
  tabTextActive: {
    color: '#6B4FBB',
  },
});
