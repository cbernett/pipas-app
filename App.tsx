import React from 'react';
import { View, StyleSheet, StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AppProvider, useApp } from './src/context/AppContext';
import AppHeader from './src/components/AppHeader';
import BoardStatusSheet from './src/components/BoardStatusSheet';
import CodigoScreen from './src/screens/CodigoScreen';
import SonsScreen from './src/screens/SonsScreen';

function AppContent() {
  const { activeTab } = useApp();

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      <AppHeader />
      <View style={styles.content}>
        {activeTab === 'codigo' ? <CodigoScreen /> : <SonsScreen />}
      </View>
      <BoardStatusSheet />
    </View>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AppProvider>
          <AppContent />
        </AppProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#1A1F2E',
  },
  content: {
    flex: 1,
  },
});
