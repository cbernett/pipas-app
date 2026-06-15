import React from 'react';
import { View, Text, StyleSheet, Platform, Animated, useAnimatedValue } from 'react-native';
import Workspace from '../components/Workspace';
import BlockLibraryBottomSheet from '../components/BlockLibraryBottomSheet';
import { useApp } from '../context/AppContext';

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
    <View style={styles.container}>
      <View style={styles.workspaceArea}>
        <Workspace />
      </View>
      <BlockLibraryBottomSheet />
      <BoardWarningToast message={boardWarning} />
    </View>
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
