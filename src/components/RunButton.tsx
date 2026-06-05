import React from 'react';
import { TouchableOpacity, View, StyleSheet } from 'react-native';
import { useApp } from '../context/AppContext';

export default function RunButton() {
  const { isRunning, setIsRunning, setUsbDisconnectedWhileRunning, usbDisconnectedWhileRunning } = useApp();

  const handlePress = () => {
    if (isRunning) {
      setIsRunning(false);
      setUsbDisconnectedWhileRunning(false);
    } else {
      setIsRunning(true);
    }
  };

  return (
    <TouchableOpacity
      style={styles.button}
      onPress={handlePress}
      activeOpacity={0.85}
    >
      {isRunning ? (
        // Stop icon: two vertical bars
        <View style={styles.stopContainer}>
          <View style={styles.stopBar} />
          <View style={styles.stopBar} />
        </View>
      ) : (
        // Play icon: triangle
        <View style={styles.playTriangle} />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#6B4FBB',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6B4FBB',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
  },
  playTriangle: {
    width: 0,
    height: 0,
    borderTopWidth: 8,
    borderBottomWidth: 8,
    borderLeftWidth: 14,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderLeftColor: '#FFFFFF',
    marginLeft: 3,
  },
  stopContainer: {
    flexDirection: 'row',
    gap: 4,
  },
  stopBar: {
    width: 4,
    height: 14,
    backgroundColor: '#FFFFFF',
    borderRadius: 2,
  },
});
