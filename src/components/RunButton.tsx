import React from 'react';
import { TouchableOpacity, View, StyleSheet } from 'react-native';
import { useApp } from '../context/AppContext';

export default function RunButton() {
  const { activeBlockId, stopRun } = useApp();
  if (!activeBlockId) return <View style={styles.placeholder} />;

  return (
    <TouchableOpacity style={styles.button} onPress={stopRun} activeOpacity={0.85}>
      <View style={styles.stopContainer}>
        <View style={styles.bar} />
        <View style={styles.bar} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  placeholder: { width: 44, height: 44 },
  button: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#EF4444',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#EF4444', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4, shadowRadius: 6, elevation: 4,
  },
  stopContainer: { flexDirection: 'row', gap: 4 },
  bar: { width: 4, height: 14, backgroundColor: '#FFF', borderRadius: 2 },
});
