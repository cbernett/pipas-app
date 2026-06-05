import React from 'react';
import { View, StyleSheet } from 'react-native';
import Workspace from '../components/Workspace';
import BlockLibraryBottomSheet from '../components/BlockLibraryBottomSheet';

export default function CodigoScreen() {
  return (
    <View style={styles.container}>
      <Workspace />
      <BlockLibraryBottomSheet />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
});
