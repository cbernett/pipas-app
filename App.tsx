import React from 'react';
import { View, StyleSheet, StatusBar, Text, TextInput, Platform } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AppProvider, useApp } from './src/context/AppContext';
import AppHeader from './src/components/AppHeader';
import BoardStatusSheet from './src/components/BoardStatusSheet';
import CodigoScreen from './src/screens/CodigoScreen';
import SonsScreen from './src/screens/SonsScreen';

// Prevent Android system font scale from inflating all text
if (Platform.OS === 'android') {
  const oldTextRender = (Text as any).render;
  (Text as any).defaultProps = { ...(Text as any).defaultProps, allowFontScaling: false };
  (TextInput as any).defaultProps = { ...(TextInput as any).defaultProps, allowFontScaling: false };
}

function AppContent() {
  const { activeTab } = useApp();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.root, { paddingBottom: insets.bottom }]}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" translucent={false} />
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
