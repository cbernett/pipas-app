import React from 'react';
import { TouchableOpacity, Image, StyleSheet, Platform, View } from 'react-native';
import { useApp } from '../context/AppContext';

// Inject CSS keyframe once at module load (web only)
if (Platform.OS === 'web' && typeof document !== 'undefined') {
  const STYLE_ID = 'pipas-glow-style';
  if (!document.getElementById(STYLE_ID)) {
    const el = document.createElement('style');
    el.id = STYLE_ID;
    el.textContent = `
      @keyframes pipasCircleGlow {
        0%, 100% {
          box-shadow: 0 0 3px 1px rgba(91,196,209,0.5);
          opacity: 0.85;
        }
        50% {
          box-shadow: 0 0 8px 3px rgba(91,196,209,1), 0 0 18px 4px rgba(91,196,209,0.5);
          opacity: 1;
        }
      }
      .pipas-circle-glow {
        animation: pipasCircleGlow 2.8s ease-in-out infinite;
      }
    `;
    document.head.appendChild(el);
  }
}

// The dot overlay — positioned absolutely over the button image
function StatusDot({ active }: { active: boolean }) {
  const BUTTON_H = 31;
  const DOT_SIZE = 8;
  const DOT_LEFT = 16;
  const DOT_TOP = (BUTTON_H - DOT_SIZE) / 2;

  if (Platform.OS === 'web') {
    return (
      // @ts-ignore
      <div
        className={active ? 'pipas-circle-glow' : ''}
        style={{
          position: 'absolute',
          left: DOT_LEFT,
          top: DOT_TOP,
          width: DOT_SIZE,
          height: DOT_SIZE,
          borderRadius: '50%',
          backgroundColor: active ? '#5BC4D1' : '#FFFFFF',
          pointerEvents: 'none',
        }}
      />
    );
  }

  return (
    <View
      style={{
        position: 'absolute',
        left: DOT_LEFT,
        top: DOT_TOP,
        width: DOT_SIZE,
        height: DOT_SIZE,
        borderRadius: DOT_SIZE / 2,
        backgroundColor: active ? '#5BC4D1' : '#FFFFFF',
      }}
    />
  );
}

export default function BoardStatusButton() {
  const { boardStatus, setBoardSheetOpen } = useApp();
  const isConnected = boardStatus === 'connected';

  return (
    <TouchableOpacity onPress={() => setBoardSheetOpen(true)} activeOpacity={0.7}>
      <View style={styles.wrapper}>
        <Image
          source={
            isConnected
              ? require('../../assets/connect-button-on.png')
              : require('../../assets/connect-button-off.png')
          }
          style={styles.icon}
          resizeMode="contain"
        />
        <StatusDot active={isConnected} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: 121,
    height: 31,
  },
  icon: {
    width: 121,
    height: 31,
  },
});
