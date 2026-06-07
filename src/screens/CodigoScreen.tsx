import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import Workspace from '../components/Workspace';
import BlockLibraryBottomSheet from '../components/BlockLibraryBottomSheet';

export default function CodigoScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.workspaceArea}>
        <Workspace />
      </View>
      <BlockLibraryBottomSheet />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
    // On web, ensure the container has a definite height so children measure correctly
    ...(Platform.OS === 'web' ? { height: '100%' as any } : {}),
  },
  workspaceArea: {
    flex: 1,
    overflow: 'hidden',
  },
});
