import React from 'react';
import { TouchableOpacity, View, StyleSheet } from 'react-native';
import { useApp, BoardStatus } from '../context/AppContext';

export default function BoardStatusButton() {
  const { boardStatus, setBoardSheetOpen } = useApp();

  const dotColor =
    boardStatus === 'connected' ? '#22C55E' :
    boardStatus === 'error' ? '#EF4444' : 'transparent';

  const iconColor =
    boardStatus === 'connected' ? '#22C55E' :
    boardStatus === 'error' ? '#EF4444' : '#BBBBBB';

  return (
    <TouchableOpacity
      style={styles.button}
      onPress={() => setBoardSheetOpen(true)}
      activeOpacity={0.7}
    >
      <View style={[styles.circle, { borderColor: iconColor }]}>
        {/* USB icon represented as lines */}
        <View style={[styles.usbBody, { backgroundColor: iconColor }]} />
        <View style={[styles.usbPlug, { backgroundColor: iconColor }]} />
      </View>
      {boardStatus !== 'disconnected' && (
        <View style={[styles.dot, { backgroundColor: dotColor }]} />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  usbBody: {
    width: 10,
    height: 8,
    borderRadius: 1,
  },
  usbPlug: {
    width: 6,
    height: 4,
    borderRadius: 1,
    marginTop: 1,
  },
  dot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    position: 'absolute',
    top: 2,
    right: 2,
    borderWidth: 1.5,
    borderColor: '#FFF',
  },
});
