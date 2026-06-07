import React from 'react';
import { TouchableOpacity, View, StyleSheet } from 'react-native';
import { useApp } from '../context/AppContext';

export default function BoardStatusButton() {
  const { boardStatus, setBoardSheetOpen } = useApp();

  const ringColor =
    boardStatus === 'connected' ? '#22C55E' :
    boardStatus === 'error'     ? '#EF4444' :
    'rgba(255,255,255,0.35)';

  const dotColor =
    boardStatus === 'connected' ? '#22C55E' :
    boardStatus === 'error'     ? '#EF4444' : undefined;

  return (
    <TouchableOpacity style={styles.btn} onPress={() => setBoardSheetOpen(true)} activeOpacity={0.7}>
      {/* Outlined circle */}
      <View style={[styles.ring, { borderColor: ringColor }]}>
        {/* Board icon: three horizontal pins */}
        <View style={styles.pins}>
          <View style={[styles.pin, { backgroundColor: ringColor }]} />
          <View style={[styles.pin, { backgroundColor: ringColor }]} />
          <View style={[styles.pin, { backgroundColor: ringColor }]} />
        </View>
      </View>
      {/* Status dot */}
      {dotColor && (
        <View style={[styles.dot, { backgroundColor: dotColor }]} />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    width: 38, height: 38,
    alignItems: 'center', justifyContent: 'center',
  },
  ring: {
    width: 32, height: 32, borderRadius: 16,
    borderWidth: 2,
    alignItems: 'center', justifyContent: 'center',
  },
  pins: {
    gap: 3,
    alignItems: 'center',
  },
  pin: {
    width: 12, height: 2.5, borderRadius: 1.5,
  },
  dot: {
    width: 8, height: 8, borderRadius: 4,
    position: 'absolute', top: 1, right: 1,
    borderWidth: 1.5, borderColor: '#000',
  },
});
