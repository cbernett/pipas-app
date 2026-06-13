import React, { useEffect } from 'react';
import { TouchableOpacity, Image, StyleSheet, Platform, View } from 'react-native';
import { useApp } from '../context/AppContext';

// Inject CSS keyframe once at module load (web only)
if (Platform.OS === 'web' && typeof document !== 'undefined') {
  const STYLE_ID = 'pipas-glow-style';
  if (!document.getElementById(STYLE_ID)) {
    const el = document.createElement('style');
    el.id = STYLE_ID;
    el.textContent = `
      @keyframes pipasGlow {
        0%, 100% {
          filter: drop-shadow(0 0 3px rgba(91,196,209,0.5));
          opacity: 0.85;
        }
        50% {
          filter: drop-shadow(0 0 10px rgba(91,196,209,1))
                  drop-shadow(0 0 22px rgba(91,196,209,0.55));
          opacity: 1;
        }
      }
      .pipas-btn-glow {
        animation: pipasGlow 1.4s ease-in-out infinite;
      }
    `;
    document.head.appendChild(el);
  }
}

// Web-only wrapper that applies the CSS animation directly to a <div>
function GlowWrapper({ active, children }: { active: boolean; children: React.ReactNode }) {
  if (Platform.OS === 'web') {
    // @ts-ignore — JSX <div> is fine in React Native Web
    return (
      <div className={active ? 'pipas-btn-glow' : ''} style={{ display: 'inline-flex' }}>
        {children}
      </div>
    );
  }
  return <View>{children}</View>;
}

export default function BoardStatusButton() {
  const { boardStatus, setBoardSheetOpen } = useApp();
  const isConnected = boardStatus === 'connected';

  return (
    <TouchableOpacity onPress={() => setBoardSheetOpen(true)} activeOpacity={0.7}>
      <GlowWrapper active={isConnected}>
        <Image
          source={
            isConnected
              ? require('../../assets/connect-button-on.png')
              : require('../../assets/connect-button-off.png')
          }
          style={styles.icon}
          resizeMode="contain"
        />
      </GlowWrapper>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  icon: {
    width: 104,
    height: 29,
  },
});
