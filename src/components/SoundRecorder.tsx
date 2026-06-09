import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface Props {
  onCancel: () => void;
  onSave: (name: string, uri?: string) => void;
}

type Stage = 'idle' | 'recording' | 'preview';

const ORANGE  = '#F97316';
const BLUE    = '#6366F1';
const TRACK_H = 160;  // waveform track height

export default function SoundRecorder({ onCancel, onSave }: Props) {
  const [stage, setStage]         = useState<Stage>('idle');
  const [seconds, setSeconds]     = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playPos, setPlayPos]     = useState(0);   // 0–1 playhead position
  const [trimStart, setTrimStart] = useState(0);   // 0–1
  const [trimEnd, setTrimEnd]     = useState(1);   // 0–1
  const [duration, setDuration]   = useState(0);
  const [error, setError]         = useState<string | null>(null);
  const [waveReady, setWaveReady] = useState(false);

  const pulse       = useRef(new Animated.Value(1)).current;
  const timerRef    = useRef<ReturnType<typeof setInterval> | null>(null);
  const mrRef       = useRef<MediaRecorder | null>(null);
  const chunksRef   = useRef<Blob[]>([]);
  const blobRef     = useRef<Blob | null>(null);
  const audioRef    = useRef<HTMLAudioElement | null>(null);
  const canvasRef   = useRef<any>(null);
  const trackRef    = useRef<View>(null);
  const trackWidthRef = useRef(300);
  const dragRef     = useRef<'start' | 'end' | null>(null);
  const insets      = useSafeAreaInsets();

  // Recording pulse
  useEffect(() => {
    if (stage === 'recording') {
      timerRef.current = setInterval(() => setSeconds(s => s + 1), 1000);
      Animated.loop(Animated.sequence([
        Animated.timing(pulse, { toValue: 1.12, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1,    duration: 700, useNativeDriver: true }),
      ])).start();
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      pulse.stopAnimation(); pulse.setValue(1);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [stage]);

  // Draw waveform on canvas from AudioBuffer
  const drawWaveform = useCallback((buffer: AudioBuffer) => {
    if (Platform.OS !== 'web') return;
    const canvas = document.getElementById('waveform-canvas') as HTMLCanvasElement;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const W = canvas.width, H = canvas.height;
    const data = buffer.getChannelData(0);
    const step = Math.ceil(data.length / W);
    const amp  = H / 2;

    ctx.clearRect(0, 0, W, H);

    // Filled waveform shape (mirror top and bottom)
    ctx.beginPath();
    ctx.moveTo(0, amp);
    for (let i = 0; i < W; i++) {
      let max = 0;
      for (let j = 0; j < step; j++) {
        const v = Math.abs(data[i * step + j] || 0);
        if (v > max) max = v;
      }
      ctx.lineTo(i, amp - max * amp * 0.95);
    }
    for (let i = W - 1; i >= 0; i--) {
      let max = 0;
      for (let j = 0; j < step; j++) {
        const v = Math.abs(data[i * step + j] || 0);
        if (v > max) max = v;
      }
      ctx.lineTo(i, amp + max * amp * 0.95);
    }
    ctx.closePath();
    ctx.fillStyle = 'rgba(167,139,250,0.75)';
    ctx.fill();
    setWaveReady(true);
  }, []);

  // Start recording
  const startRecording = async () => {
    setError(null); setSeconds(0); setWaveReady(false);
    blobRef.current = null;
    if (Platform.OS === 'web') {
      try {
        const stream = await (navigator as any).mediaDevices.getUserMedia({ audio: true });
        chunksRef.current = [];
        const mr = new (window as any).MediaRecorder(stream);
        mrRef.current = mr;
        mr.ondataavailable = (e: any) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
        mr.onstop = async () => {
          stream.getTracks().forEach((t: any) => t.stop());
          const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
          blobRef.current = blob;
          // Decode for waveform
          try {
            const arrayBuffer = await blob.arrayBuffer();
            const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const decoded = await audioCtx.decodeAudioData(arrayBuffer);
            setDuration(decoded.duration);
            setTrimStart(0); setTrimEnd(1);
            setTimeout(() => drawWaveform(decoded), 50); // wait for canvas to mount
          } catch { setWaveReady(true); }
          // Set up audio element for playback
          const url = URL.createObjectURL(blob);
          const audio = new Audio(url);
          audioRef.current = audio;
          audio.ontimeupdate = () => {
            if (!duration) return;
            const pos = audio.currentTime / audio.duration;
            setPlayPos(pos);
            if (pos >= trimEnd) {
              audio.pause(); audio.currentTime = trimStart * audio.duration;
              setIsPlaying(false); setPlayPos(trimStart);
            }
          };
          audio.onended = () => { setIsPlaying(false); setPlayPos(trimStart); };
          setStage('preview');
        };
        mr.start();
        setStage('recording');
      } catch {
        setError('Não foi possível acessar o microfone.');
      }
    } else {
      setStage('recording');
    }
  };

  const stopRecording = () => {
    if (Platform.OS === 'web' && mrRef.current) mrRef.current.stop();
    else setStage('preview');
  };

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.currentTime = trimStart * audio.duration;
      audio.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  // Drag trim handles
  const onTrackPointerDown = (e: any) => {
    if (Platform.OS !== 'web') return;
    const rect = (e.target as HTMLElement).closest('#waveform-track')?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const pos = x / rect.width;
    // Decide which handle is closer
    const dStart = Math.abs(pos - trimStart);
    const dEnd   = Math.abs(pos - trimEnd);
    dragRef.current = dStart < dEnd ? 'start' : 'end';

    const onMove = (ev: PointerEvent) => {
      const p = Math.max(0, Math.min(1, (ev.clientX - rect.left) / rect.width));
      if (dragRef.current === 'start') setTrimStart(prev => Math.min(p, trimEnd - 0.02));
      else setTrimEnd(prev => Math.max(p, trimStart + 0.02));
    };
    const onUp = () => {
      dragRef.current = null;
      document.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerup', onUp);
    };
    document.addEventListener('pointermove', onMove);
    document.addEventListener('pointerup', onUp);
  };

  const handleSave = () => {
    const blob = blobRef.current;
    if (!blob) return;
    const name = `Gravação ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
    const url = URL.createObjectURL(blob);
    onSave(name, url);
  };

  const resetToIdle = () => {
    audioRef.current?.pause();
    audioRef.current = null;
    setStage('idle');
    setSeconds(0);
    setPlayPos(0);
    setIsPlaying(false);
    setWaveReady(false);
  };

  const fmt = (s: number) =>
    `${Math.floor(s / 60).toString().padStart(2, '0')}:${Math.floor(s % 60).toString().padStart(2, '0')}`;

  return (
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, 20) }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Gravar Som</Text>
        <TouchableOpacity onPress={() => { audioRef.current?.pause(); onCancel(); }} hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}>
          <Text style={styles.closeBtn}>✕</Text>
        </TouchableOpacity>
      </View>

      {/* ── Waveform / idle area ── */}
      <View style={styles.waveArea}>
        {stage === 'preview' ? (
          // Preview: canvas + trim handles
          <View
            nativeID="waveform-track"
            style={styles.waveTrack}
            // @ts-ignore
            onPointerDown={onTrackPointerDown}
            onLayout={e => { trackWidthRef.current = e.nativeEvent.layout.width; }}
          >
            {/* Canvas */}
            {Platform.OS === 'web' && (
              // @ts-ignore
              <canvas
                id="waveform-canvas"
                width={trackWidthRef.current || 300}
                height={TRACK_H}
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
              />
            )}

            {/* Trim-out overlays (striped) */}
            <View style={[styles.trimOverlay, { left: 0, width: `${trimStart * 100}%` as any }]} />
            <View style={[styles.trimOverlay, { right: 0, width: `${(1 - trimEnd) * 100}%` as any }]} />

            {/* Playhead */}
            <View style={[styles.playhead, { left: `${playPos * 100}%` as any }]} />

            {/* Start handle */}
            <View style={[styles.trimHandle, { left: `${trimStart * 100}%` as any }]}>
              <View style={styles.trimHandleDot} />
              <View style={styles.trimHandleLine} />
              <View style={styles.trimHandleDot} />
            </View>

            {/* End handle */}
            <View style={[styles.trimHandle, { left: `${trimEnd * 100}%` as any }]}>
              <View style={styles.trimHandleDot} />
              <View style={styles.trimHandleLine} />
              <View style={styles.trimHandleDot} />
            </View>
          </View>
        ) : stage === 'recording' ? (
          // Live waveform bars
          <View style={styles.liveBars}>
            {Array.from({ length: 40 }).map((_, i) => {
              const h = Math.random() * 80 + 10;
              return <View key={i} style={[styles.liveBar, { height: h }]} />;
            })}
          </View>
        ) : (
          // Idle placeholder
          <Text style={styles.idlePlaceholder}>
            Começar a gravação clicando no botão abaixo
          </Text>
        )}
      </View>

      {/* ── Record / Play button ── */}
      {stage === 'preview' ? (
        <View style={styles.playArea}>
          <Animated.View>
            <TouchableOpacity style={styles.playBtn} onPress={togglePlay} activeOpacity={0.85}>
              <Text style={styles.playIcon}>{isPlaying ? '■' : '▶'}</Text>
            </TouchableOpacity>
          </Animated.View>
          <Text style={styles.playLabel}>{isPlaying ? 'Pausar' : 'Tocar'}</Text>
          {duration > 0 && (
            <Text style={styles.durationLabel}>
              {fmt(trimStart * duration)} – {fmt(trimEnd * duration)}
            </Text>
          )}
        </View>
      ) : (
        <View style={styles.recordArea}>
          <Animated.View style={{ transform: [{ scale: pulse }] }}>
            <TouchableOpacity
              style={[styles.recordBtn, stage === 'recording' && styles.recordBtnActive]}
              onPress={stage === 'recording' ? stopRecording : startRecording}
              activeOpacity={0.85}
            >
              {stage === 'recording' && <View style={styles.stopSquare} />}
            </TouchableOpacity>
          </Animated.View>
          <Text style={[styles.recordLabel, stage === 'recording' && { color: ORANGE }]}>
            {stage === 'recording' ? fmt(seconds) : 'Gravar'}
          </Text>
        </View>
      )}

      {error && <Text style={styles.errorText}>{error}</Text>}

      {/* ── Bottom buttons ── */}
      <View style={styles.actions}>
        {stage === 'preview' ? (
          <>
            <TouchableOpacity style={styles.rerecordBtn} onPress={resetToIdle} activeOpacity={0.8}>
              <Text style={styles.rerecordText}>↩  Re-gravar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.8}>
              <Text style={styles.saveText}>Guardar</Text>
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity style={styles.cancelBtn} onPress={() => { audioRef.current?.pause(); onCancel(); }} activeOpacity={0.8}>
            <Text style={styles.cancelText}>Cancelar</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

// Stripe pattern overlay using CSS on web
const StripedOverlay = () => null; // handled via CSS backgroundImage

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1F2E',
    paddingHorizontal: 20,
    paddingTop: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
    marginBottom: 24,
  },
  title: { fontSize: 20, fontWeight: '800', color: '#FFF' },
  closeBtn: { fontSize: 18, color: 'rgba(255,255,255,0.5)', fontWeight: '600' },

  // Waveform area
  waveArea: {
    width: '100%',
    height: TRACK_H,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    overflow: 'hidden' as any,
    marginBottom: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  waveTrack: {
    width: '100%',
    height: TRACK_H,
    position: 'relative' as any,
    cursor: 'col-resize' as any,
    overflow: 'visible' as any,
  },
  trimOverlay: {
    position: 'absolute' as any,
    top: 0,
    height: '100%',
    // Diagonal stripe pattern via backgroundImage on web
    backgroundColor: 'rgba(249,115,22,0.25)' as any,
    // @ts-ignore
    backgroundImage: 'repeating-linear-gradient(45deg, rgba(249,115,22,0.15) 0px, rgba(249,115,22,0.15) 4px, transparent 4px, transparent 12px)',
    zIndex: 2,
  },
  playhead: {
    position: 'absolute' as any,
    top: 0, bottom: 0,
    width: 2,
    backgroundColor: 'rgba(255,255,255,0.7)',
    zIndex: 4,
  },
  trimHandle: {
    position: 'absolute' as any,
    top: -10,
    marginLeft: -8,
    alignItems: 'center',
    zIndex: 5,
    cursor: 'ew-resize' as any,
  },
  trimHandleDot: {
    width: 16, height: 16, borderRadius: 8,
    backgroundColor: ORANGE,
    shadowColor: ORANGE, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.6, shadowRadius: 4,
  },
  trimHandleLine: {
    width: 3,
    height: TRACK_H,
    backgroundColor: ORANGE,
    opacity: 0.9,
  },

  // Live bars
  liveBars: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    height: TRACK_H,
    paddingHorizontal: 12,
  },
  liveBar: { width: 5, borderRadius: 3, backgroundColor: 'rgba(167,139,250,0.7)' },

  idlePlaceholder: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 15,
    textAlign: 'center',
    paddingHorizontal: 24,
  },

  // Record button area
  recordArea: { alignItems: 'center', gap: 10, marginBottom: 'auto' as any },
  recordBtn: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: ORANGE,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: ORANGE, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.5, shadowRadius: 12,
  },
  recordBtnActive: { backgroundColor: '#EF4444', shadowColor: '#EF4444' },
  stopSquare: { width: 26, height: 26, borderRadius: 4, backgroundColor: '#FFF' },
  recordLabel: { fontSize: 16, fontWeight: '700', color: 'rgba(255,255,255,0.6)' },

  // Play area
  playArea: { alignItems: 'center', gap: 8, marginBottom: 'auto' as any },
  playBtn: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: BLUE,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: BLUE, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 12,
  },
  playIcon: { color: '#FFF', fontSize: 20, marginLeft: 3 },
  playLabel: { fontSize: 15, color: 'rgba(255,255,255,0.6)', fontWeight: '600' },
  durationLabel: { fontSize: 13, color: 'rgba(255,255,255,0.35)' },

  errorText: { color: '#EF4444', fontSize: 14, textAlign: 'center', marginBottom: 12 },

  // Bottom action buttons
  actions: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 20,
  },
  cancelBtn: {
    flex: 1, borderRadius: 14, paddingVertical: 14, alignItems: 'center',
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.2)',
  },
  cancelText: { fontSize: 15, fontWeight: '700', color: 'rgba(255,255,255,0.5)' },
  rerecordBtn: {
    flex: 1, borderRadius: 14, paddingVertical: 14, alignItems: 'center',
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.3)',
  },
  rerecordText: { fontSize: 15, fontWeight: '700', color: '#FFF' },
  saveBtn: {
    flex: 1.4, borderRadius: 14, paddingVertical: 14, alignItems: 'center',
    backgroundColor: BLUE,
  },
  saveText: { fontSize: 15, fontWeight: '700', color: '#FFF' },
});
