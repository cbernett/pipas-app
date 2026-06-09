import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Animated, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface Props {
  onCancel: () => void;
  onSave: (name: string, uri?: string) => void;
}

export default function SoundRecorder({ onCancel, onSave }: Props) {
  const [isRecording, setIsRecording]     = useState(false);
  const [seconds, setSeconds]             = useState(0);
  const [hasRecording, setHasRecording]   = useState(false);
  const [error, setError]                 = useState<string | null>(null);
  const pulse      = useRef(new Animated.Value(1)).current;
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const insets     = useSafeAreaInsets();

  // Web MediaRecorder refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef        = useRef<Blob[]>([]);
  const audioBlobRef     = useRef<Blob | null>(null);

  useEffect(() => {
    if (isRecording) {
      intervalRef.current = setInterval(() => setSeconds(s => s + 1), 1000);
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, { toValue: 1.15, duration: 600, useNativeDriver: true }),
          Animated.timing(pulse, { toValue: 1,    duration: 600, useNativeDriver: true }),
        ])
      ).start();
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
      pulse.stopAnimation();
      pulse.setValue(1);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isRecording]);

  const formatTime = (s: number) =>
    `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  const handleMicPress = async () => {
    if (isRecording) {
      // Stop recording
      if (Platform.OS === 'web' && mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
      }
      setIsRecording(false);
      setHasRecording(true);
    } else {
      setError(null);
      setSeconds(0);
      setHasRecording(false);
      audioBlobRef.current = null;

      if (Platform.OS === 'web') {
        try {
          const stream = await (navigator as any).mediaDevices.getUserMedia({ audio: true });
          chunksRef.current = [];
          const mr = new (window as any).MediaRecorder(stream);
          mediaRecorderRef.current = mr;

          mr.ondataavailable = (e: any) => {
            if (e.data.size > 0) chunksRef.current.push(e.data);
          };
          mr.onstop = () => {
            const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
            audioBlobRef.current = blob;
            // Stop all tracks to release microphone
            stream.getTracks().forEach((t: any) => t.stop());
          };
          mr.start();
          setIsRecording(true);
        } catch (e: any) {
          setError('Não foi possível acessar o microfone.');
        }
      } else {
        setIsRecording(true);
      }
    }
  };

  const handleSave = () => {
    if (!hasRecording) return;
    const name = `Gravação ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
    if (Platform.OS === 'web' && audioBlobRef.current) {
      const url = URL.createObjectURL(audioBlobRef.current);
      onSave(name, url);
    } else {
      onSave(name);
    }
  };

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <Text style={styles.title}>Gravar Som</Text>

      <Text style={styles.timer}>{formatTime(seconds)}</Text>

      {/* Waveform (decorative) */}
      <View style={styles.waveformContainer}>
        {Array.from({ length: 32 }).map((_, i) => {
          const h = isRecording ? Math.random() * 40 + 8 : hasRecording ? 20 : 4;
          return (
            <View
              key={i}
              style={[
                styles.wavebar,
                {
                  height: h,
                  backgroundColor: isRecording ? '#9268F6' : hasRecording ? '#6B4FBB' : 'rgba(255,255,255,0.2)',
                },
              ]}
            />
          );
        })}
      </View>

      {/* Mic button */}
      <Animated.View style={{ transform: [{ scale: pulse }] }}>
        <TouchableOpacity
          style={[styles.micButton, isRecording && styles.micButtonRecording]}
          onPress={handleMicPress}
          activeOpacity={0.8}
        >
          <Text style={styles.micIcon}>{isRecording ? '⬛' : '🎙'}</Text>
        </TouchableOpacity>
      </Animated.View>

      {error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : (
        <Text style={styles.hint}>
          {isRecording ? 'Toque para parar' : hasRecording ? 'Toque para regravar' : 'Toque para iniciar'}
        </Text>
      )}

      <View style={styles.actions}>
        <TouchableOpacity style={styles.cancelBtn} onPress={onCancel} activeOpacity={0.8}>
          <Text style={styles.cancelText}>Cancelar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.saveBtn, !hasRecording && styles.saveBtnDisabled]}
          onPress={handleSave}
          activeOpacity={hasRecording ? 0.8 : 1}
        >
          <Text style={styles.saveText}>Salvar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1F2E',
    alignItems: 'center',
    paddingTop: 40,
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 20,
  },
  timer: {
    fontSize: 48,
    fontWeight: '200',
    color: '#FFFFFF',
    fontVariant: ['tabular-nums'] as any,
    marginBottom: 32,
  },
  waveformContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 60,
    gap: 3,
    marginBottom: 48,
    width: '100%',
    justifyContent: 'center',
  },
  wavebar: {
    width: 5,
    borderRadius: 3,
  },
  micButton: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#6B4FBB',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6B4FBB',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  micButtonRecording: {
    backgroundColor: '#EF4444',
    shadowColor: '#EF4444',
  },
  micIcon: {
    fontSize: 40,
  },
  hint: {
    marginTop: 16,
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
    fontWeight: '500',
  },
  errorText: {
    marginTop: 16,
    fontSize: 14,
    color: '#EF4444',
    fontWeight: '500',
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 'auto' as any,
    width: '100%',
  },
  cancelBtn: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.7)',
  },
  saveBtn: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    backgroundColor: '#6B4FBB',
  },
  saveBtnDisabled: {
    opacity: 0.4,
  },
  saveText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
  },
});
