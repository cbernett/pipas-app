import React from 'react';
import { View, Text, StyleSheet, Platform, Animated, ScrollView } from 'react-native';
import Workspace from '../components/Workspace';
import BlockLibraryBottomSheet from '../components/BlockLibraryBottomSheet';
import { useApp } from '../context/AppContext';

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { error: Error | null }> {
  state = { error: null };
  static getDerivedStateFromError(e: Error) { return { error: e }; }
  render() {
    if (this.state.error) {
      const e = this.state.error as Error;
      return (
        <ScrollView style={{ flex: 1, backgroundColor: '#1a0000', padding: 20 }}>
          <Text style={{ color: '#ff4444', fontSize: 16, fontWeight: '700', marginBottom: 8 }}>CRASH CAUGHT</Text>
          <Text style={{ color: '#fff', fontSize: 13, marginBottom: 8 }}>{e.message}</Text>
          <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>{e.stack}</Text>
        </ScrollView>
      );
    }
    return this.props.children;
  }
}

function BoardWarningToast({ message }: { message: string | null }) {
  const opacity = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (message) {
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }),
        Animated.delay(1800),
        Animated.timing(opacity, { toValue: 0, duration: 350, useNativeDriver: true }),
      ]).start();
    } else {
      opacity.setValue(0);
    }
  }, [message]);

  if (!message) return null;

  return (
    <Animated.View style={[styles.toast, { opacity }]} pointerEvents="none">
      <Text style={styles.toastText}>{message}</Text>
    </Animated.View>
  );
}

export default function CodigoScreen() {
  const { boardWarning } = useApp();

  return (
    <ErrorBoundary>
      <View style={styles.container}>
        <View style={styles.workspaceArea}>
          <Workspace />
        </View>
        <BlockLibraryBottomSheet />
        <BoardWarningToast message={boardWarning} />
      </View>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
    ...(Platform.OS === 'web' ? { height: '100%' as any } : {}),
  },
  workspaceArea: {
    flex: 1,
    overflow: 'hidden',
  },
  toast: {
    position: 'absolute',
    bottom: 80,
    alignSelf: 'center',
    backgroundColor: 'rgba(30, 25, 50, 0.92)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
    pointerEvents: 'none' as any,
  },
  toastText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
});
