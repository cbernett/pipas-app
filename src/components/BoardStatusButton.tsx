import React from 'react';
import { TouchableOpacity, Image, StyleSheet } from 'react-native';
import { useApp } from '../context/AppContext';

export default function BoardStatusButton() {
  const { boardStatus, setBoardSheetOpen } = useApp();
  const isConnected = boardStatus === 'connected';

  return (
    <TouchableOpacity style={styles.btn} onPress={() => setBoardSheetOpen(true)} activeOpacity={0.7}>
      <Image
        source={isConnected
          ? require('../../assets/connect-button-on.png')
          : require('../../assets/connect-button-off.png')
        }
        style={styles.icon}
        resizeMode="contain"
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    width: 34,
    height: 34,
  },
});
