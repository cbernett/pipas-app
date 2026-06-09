import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Animated, Platform,
  TextInput, ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface Props {
  onCancel: () => void;
  onSave: (name: string, uri?: string) => void;
}

type Stage  = 'idle' | 'recording' | 'preview';
type Effect = 'fast' | 'slow' | 'echo' | 'robot' | null;

export const TEAL = '#5BC4D1';
const TRACK_H     = 100;
const BRACKET_W   = 3;
const BRACKET_CAP = 14;

const EFFECTS: { id: Effect & string; label: string }[] = [
  { id: 'fast',  label: 'RÁPIDO' },
  { id: 'slow',  label: 'LENTO'  },
  { id: 'echo',  label: 'ECO'    },
  { id: 'robot', label: 'ROBÔ'   },
];

// Outline mic icon
function MicIcon({ size = 26, color = '#FFF' }: { size?: number; color?: string }) {
  const s = size;
  return (
    <View style={{ alignItems: 'center' }}>
      <View style={{ width: s * 0.52, height: s * 0.68, borderRadius: s * 0.26, borderWidth: s * 0.1, borderColor: color }} />
      <View style={{
        width: s * 0.85, height: s * 0.44,
        borderLeftWidth: s * 0.1, borderRightWidth: s * 0.1, borderBottomWidth: s * 0.1,
        borderColor: color, borderStyle: 'solid',
        borderBottomLeftRadius: s * 0.5, borderBottomRightRadius: s * 0.5,
        marginTop: -s * 0.1,
      }} />
      <View style={{ width: s * 0.1, height: s * 0.2, backgroundColor: color }} />
      <View style={{ width: s * 0.5, height: s * 0.1, backgroundColor: color, borderRadius: 2 }} />
    </View>
  );
}

// ─── Audio effect routing ─────────────────────────────────────────────────
// Returns a cleanup function
function applyEffect(
  audio: HTMLAudioElement,
  effect: Effect,
): () => void {
  // Reset playback rate first
  audio.playbackRate = 1;

  if (effect === 'fast') {
    audio.playbackRate = 1.7;
    return () => { audio.playbackRate = 1; };
  }
  if (effect === 'slow') {
    audio.playbackRate = 0.55;
    return () => { audio.playbackRate = 1; };
  }
  if (effect === 'echo') {
    try {
      const actx    = new (window.AudioContext || (window as any).webkitAudioContext)();
      const src     = actx.createMediaElementSource(audio);
      const delay   = actx.createDelay(2.0);
      delay.delayTime.value = 0.28;
      const fb      = actx.createGain();
      fb.gain.value = 0.42;
      const wet     = actx.createGain();
      wet.gain.value = 0.55;
      // dry path
      src.connect(actx.destination);
      // wet path with feedback loop
      src.connect(delay);
      delay.connect(wet);
      wet.connect(actx.destination);
      wet.connect(fb);
      fb.connect(delay);
      return () => { actx.close(); };
    } catch { return () => {}; }
  }
  if (effect === 'robot') {
    try {
      const actx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const src  = actx.createMediaElementSource(audio);
      // Ring modulation: multiply signal by sine oscillator
      const osc      = actx.createOscillator();
      osc.type       = 'sine';
      osc.frequency.value = 60;
      const oscGain  = actx.createGain();
      oscGain.gain.value = 1;
      // Ring mod gain — audio signal modulated by osc
      const ringMod  = actx.createGain();
      ringMod.gain.value = 0; // controlled by osc
      src.connect(ringMod);
      osc.connect(oscGain);
      oscGain.connect(ringMod.gain);
      ringMod.connect(actx.destination);
      osc.start();
      return () => { osc.stop(); actx.close(); };
    } catch { return () => {}; }
  }
  return () => {};
}

// ─── Main component ───────────────────────────────────────────────────────
export default function SoundRecorder({ onCancel, onSave }: Props) {
  const [stage, setStage]         = useState<Stage>('idle');
  const [seconds, setSeconds]     = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  // trimStart/trimEnd state only for the duration label — NOT updated during drag
  const [trimStartDisp, setTrimStartDisp] = useState(0);
  const [trimEndDisp,   setTrimEndDisp]   = useState(1);
  const [duration,  setDuration]  = useState(0);
  const [activeEffect, setActiveEffect] = useState<Effect>(null);
  const [soundName, setSoundName] = useState('Gravação 1');
  const [error, setError]         = useState<string | null>(null);

  // Refs — never stale inside event handlers
  const trimStartRef  = useRef(0);
  const trimEndRef    = useRef(1);
  const playPosRef    = useRef(0);
  const isPlayingRef  = useRef(false);
  const waveDataRef   = useRef<Float32Array | null>(null);
  const effectCleanup = useRef<(() => void) | null>(null);

  const pulse         = useRef(new Animated.Value(1)).current;
  const timerRef      = useRef<ReturnType<typeof setInterval> | null>(null);
  const mrRef         = useRef<MediaRecorder | null>(null);
  const chunksRef     = useRef<Blob[]>([]);
  const blobRef       = useRef<Blob | null>(null);
  const audioRef      = useRef<HTMLAudioElement | null>(null);
  const dragRef       = useRef<'start' | 'end' | null>(null);

  const eqCanvasRef      = useRef<HTMLCanvasElement | null>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const eqRafRef         = useRef<number | null>(null);
  const previewRafRef    = useRef<number | null>(null);
  const analyserRef      = useRef<AnalyserNode | null>(null);
  const trackWRef        = useRef(300);
  const insets           = useSafeAreaInsets();

  // ── Canvas: draw preview ────────────────────────────────────────────────
  const drawPreview = useCallback(() => {
    const canvas = previewCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const W = canvas.width, H = canvas.height;
    const ts = trimStartRef.current, te = trimEndRef.current;

    ctx.clearRect(0, 0, W, H);

    // 1. Waveform
    const samples = waveDataRef.current;
    if (samples && samples.length > 0) {
      const step = Math.ceil(samples.length / W);
      const amp  = H / 2;
      ctx.beginPath();
      ctx.moveTo(0, amp);
      for (let i = 0; i < W; i++) {
        let max = 0;
        for (let j = 0; j < step; j++) { const v = Math.abs(samples[i * step + j] || 0); if (v > max) max = v; }
        ctx.lineTo(i, amp - max * amp * 0.88);
      }
      for (let i = W - 1; i >= 0; i--) {
        let max = 0;
        for (let j = 0; j < step; j++) { const v = Math.abs(samples[i * step + j] || 0); if (v > max) max = v; }
        ctx.lineTo(i, amp + max * amp * 0.88);
      }
      ctx.closePath();
      ctx.fillStyle = TEAL;
      ctx.globalAlpha = 0.8;
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    // 2. Dim outside trim
    ctx.fillStyle = 'rgba(14,10,50,0.65)';
    ctx.fillRect(0, 0, ts * W, H);
    ctx.fillRect(te * W, 0, W - te * W, H);

    // 3. Left bracket [
    const lx = Math.round(ts * W);
    const rx  = Math.round(te * W);
    ctx.shadowColor = 'rgba(255,255,255,0.4)'; ctx.shadowBlur = 6;
    ctx.fillStyle = '#FFF';
    ctx.fillRect(lx,                   0,           BRACKET_W, H);
    ctx.fillRect(lx,                   0,           BRACKET_CAP, BRACKET_W);
    ctx.fillRect(lx,                   H - BRACKET_W, BRACKET_CAP, BRACKET_W);

    // 4. Right bracket ]
    ctx.fillRect(rx - BRACKET_W,       0,           BRACKET_W, H);
    ctx.fillRect(rx - BRACKET_CAP,     0,           BRACKET_CAP, BRACKET_W);
    ctx.fillRect(rx - BRACKET_CAP,     H - BRACKET_W, BRACKET_CAP, BRACKET_W);
    ctx.shadowBlur = 0;

    // 5. Playhead
    const px = Math.round(playPosRef.current * W);
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.fillRect(px - 1, 0, 2, H);
  }, []);

  // ── Attach raw pointer events to preview canvas ─────────────────────────
  const attachPreviewEvents = useCallback((canvas: HTMLCanvasElement) => {
    canvas.style.cursor = 'col-resize';
    const onDown = (e: PointerEvent) => {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const pos  = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      dragRef.current = Math.abs(pos - trimStartRef.current) <= Math.abs(pos - trimEndRef.current)
        ? 'start' : 'end';
      canvas.setPointerCapture(e.pointerId);
    };
    const onMove = (e: PointerEvent) => {
      if (!dragRef.current) return;
      const rect = canvas.getBoundingClientRect();
      const p = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      // *** Only update refs + redraw — zero setState → zero re-renders during drag ***
      if (dragRef.current === 'start') {
        trimStartRef.current = Math.min(p, trimEndRef.current - 0.02);
      } else {
        trimEndRef.current = Math.max(p, trimStartRef.current + 0.02);
      }
      drawPreview();
    };
    const onUp = () => {
      dragRef.current = null;
      // Sync display state once drag ends
      setTrimStartDisp(trimStartRef.current);
      setTrimEndDisp(trimEndRef.current);
    };
    canvas.addEventListener('pointerdown', onDown);
    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerup',   onUp);
    (canvas as any)._cleanup = () => {
      canvas.removeEventListener('pointerdown', onDown);
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerup',   onUp);
    };
  }, [drawPreview]);

  // Callback ref for preview canvas
  const setPreviewCanvas = useCallback((el: any) => {
    if (Platform.OS !== 'web') return;
    const prev = previewCanvasRef.current;
    if (prev && (prev as any)._cleanup) (prev as any)._cleanup();
    if (!el) { previewCanvasRef.current = null; return; }
    previewCanvasRef.current = el as HTMLCanvasElement;
    attachPreviewEvents(el as HTMLCanvasElement);
    setTimeout(() => drawPreview(), 30);
  }, [attachPreviewEvents, drawPreview]);

  useEffect(() => {
    if (stage === 'preview') setTimeout(() => drawPreview(), 80);
  }, [stage, drawPreview]);

  // ── Real-time EQ ─────────────────────────────────────────────────────────
  const setEqCanvas = useCallback((el: any) => {
    if (Platform.OS === 'web' && el) eqCanvasRef.current = el as HTMLCanvasElement;
  }, []);

  const startEQ = useCallback((stream: MediaStream) => {
    if (Platform.OS !== 'web') return;
    const actx     = new (window.AudioContext || (window as any).webkitAudioContext)();
    const src      = actx.createMediaStreamSource(stream);
    const analyser = actx.createAnalyser();
    analyser.fftSize = 256;
    src.connect(analyser);
    analyserRef.current = analyser;
    const draw = () => {
      if (!analyserRef.current) return;
      const canvas = eqCanvasRef.current;
      if (!canvas) { eqRafRef.current = requestAnimationFrame(draw); return; }
      const ctx = canvas.getContext('2d'); if (!ctx) { eqRafRef.current = requestAnimationFrame(draw); return; }
      const W = canvas.width, H = canvas.height;
      const data = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteFrequencyData(data);
      ctx.clearRect(0, 0, W, H);
      const count = 60, bw = W / count;
      for (let i = 0; i < count; i++) {
        const v = data[i] / 255;
        const bh = Math.max(2, v * H * 0.9);
        ctx.fillStyle = `rgba(91,196,209,${0.4 + v * 0.6})`;
        ctx.fillRect(i * bw + 1, (H - bh) / 2, bw - 2, bh);
      }
      eqRafRef.current = requestAnimationFrame(draw);
    };
    draw();
  }, []);

  const stopEQ = useCallback(() => {
    if (eqRafRef.current !== null) { cancelAnimationFrame(eqRafRef.current); eqRafRef.current = null; }
    analyserRef.current = null;
  }, []);

  // ── Playhead animation ───────────────────────────────────────────────────
  const startPlayheadRaf = useCallback(() => {
    const tick = () => {
      const audio = audioRef.current;
      if (!audio || !isPlayingRef.current) return;
      playPosRef.current = audio.currentTime / audio.duration;
      if (playPosRef.current >= trimEndRef.current) {
        audio.pause();
        audio.currentTime = trimStartRef.current * audio.duration;
        isPlayingRef.current = false; setIsPlaying(false);
        playPosRef.current = trimStartRef.current;
      }
      drawPreview();
      previewRafRef.current = requestAnimationFrame(tick);
    };
    previewRafRef.current = requestAnimationFrame(tick);
  }, [drawPreview]);

  const stopPlayheadRaf = useCallback(() => {
    if (previewRafRef.current !== null) { cancelAnimationFrame(previewRafRef.current); previewRafRef.current = null; }
  }, []);

  // ── Timer + pulse ────────────────────────────────────────────────────────
  useEffect(() => {
    if (stage === 'recording') {
      timerRef.current = setInterval(() => setSeconds(s => s + 1), 1000);
      Animated.loop(Animated.sequence([
        Animated.timing(pulse, { toValue: 1.1, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1,   duration: 700, useNativeDriver: true }),
      ])).start();
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      pulse.stopAnimation(); pulse.setValue(1);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [stage]);

  // ── Apply/remove effect when selection changes ───────────────────────────
  const applyCurrentEffect = useCallback((eff: Effect) => {
    const audio = audioRef.current; if (!audio) return;
    if (effectCleanup.current) { effectCleanup.current(); effectCleanup.current = null; }
    if (eff) effectCleanup.current = applyEffect(audio, eff);
  }, []);

  // ── Start recording ──────────────────────────────────────────────────────
  const startRecording = async () => {
    setError(null); setSeconds(0); waveDataRef.current = null;
    if (Platform.OS === 'web') {
      try {
        const stream = await (navigator as any).mediaDevices.getUserMedia({ audio: true });
        chunksRef.current = [];
        setTimeout(() => startEQ(stream), 50);
        const mr = new (window as any).MediaRecorder(stream);
        mrRef.current = mr;
        mr.ondataavailable = (e: any) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
        mr.onstop = async () => {
          stopEQ();
          stream.getTracks().forEach((t: any) => t.stop());
          const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
          blobRef.current = blob;
          try {
            const ab   = await blob.arrayBuffer();
            const actx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const buf  = await actx.decodeAudioData(ab);
            setDuration(buf.duration);
            const raw = buf.getChannelData(0);
            const pts = 2000, step = Math.ceil(raw.length / pts);
            const down = new Float32Array(pts);
            for (let i = 0; i < pts; i++) {
              let max = 0;
              for (let j = 0; j < step; j++) { const v = Math.abs(raw[i * step + j] || 0); if (v > max) max = v; }
              down[i] = max;
            }
            waveDataRef.current = down;
          } catch { /* silent */ }
          trimStartRef.current = 0; trimEndRef.current = 1;
          setTrimStartDisp(0); setTrimEndDisp(1);
          playPosRef.current = 0;
          const url  = URL.createObjectURL(blob);
          const audio = new Audio(url);
          audioRef.current = audio;
          audio.onended = () => {
            isPlayingRef.current = false; setIsPlaying(false); stopPlayheadRaf();
            playPosRef.current = trimStartRef.current; drawPreview();
          };
          setStage('preview');
        };
        mr.start();
        setStage('recording');
      } catch { setError('Não foi possível acessar o microfone.'); }
    } else { setStage('recording'); }
  };

  const stopRecording = () => {
    if (Platform.OS === 'web' && mrRef.current) mrRef.current.stop();
    else { stopEQ(); setStage('preview'); }
  };

  // ── Playback ─────────────────────────────────────────────────────────────
  const togglePlay = () => {
    const audio = audioRef.current; if (!audio) return;
    if (isPlaying) {
      audio.pause(); isPlayingRef.current = false; setIsPlaying(false); stopPlayheadRaf();
    } else {
      // Apply effect fresh before playing
      applyCurrentEffect(activeEffect);
      audio.currentTime = trimStartRef.current * audio.duration;
      audio.play().catch(() => {});
      isPlayingRef.current = true; setIsPlaying(true); startPlayheadRaf();
    }
  };

  const handleEffectSelect = (id: Effect) => {
    const next = activeEffect === id ? null : id;
    setActiveEffect(next);
    // If already playing, apply immediately
    if (isPlaying && audioRef.current) applyCurrentEffect(next);
  };

  const resetToIdle = () => {
    stopPlayheadRaf();
    if (effectCleanup.current) { effectCleanup.current(); effectCleanup.current = null; }
    audioRef.current?.pause(); audioRef.current = null;
    isPlayingRef.current = false; setStage('idle'); setSeconds(0); setIsPlaying(false);
    trimStartRef.current = 0; trimEndRef.current = 1; setTrimStartDisp(0); setTrimEndDisp(1);
    playPosRef.current = 0; waveDataRef.current = null; setActiveEffect(null);
  };

  const handleSave = () => {
    const blob = blobRef.current; if (!blob) return;
    onSave(soundName || 'Gravação', URL.createObjectURL(blob));
  };

  const fmt = (s: number) =>
    `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;
  const fmtSec = (s: number) => `${s.toFixed(1)}s`;

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[styles.container, { paddingBottom: Math.max(insets.bottom + 16, 32) }]}
      keyboardShouldPersistTaps="handled"
    >
      {/* ════ IDLE ════ */}
      {stage === 'idle' && (
        <View style={styles.idleWrap}>
          <Text style={styles.idleTitle}>Grave um som</Text>
          <TouchableOpacity style={styles.bigMicBtn} onPress={startRecording} activeOpacity={0.85}>
            <MicIcon size={32} color="#FFF" />
          </TouchableOpacity>
        </View>
      )}

      {/* ════ RECORDING ════ */}
      {stage === 'recording' && (
        <View style={styles.recordingWrap}>
          <Text style={styles.timerText}>{fmt(seconds)}</Text>
          <View style={styles.eqWrap}
            onLayout={e => { trackWRef.current = e.nativeEvent.layout.width; }}>
            {Platform.OS === 'web' ? (
              // @ts-ignore
              <canvas ref={setEqCanvas} width={trackWRef.current || 300} height={TRACK_H}
                style={{ width: '100%', height: TRACK_H }} />
            ) : (
              <View style={{ height: TRACK_H }} />
            )}
          </View>
          <Animated.View style={{ transform: [{ scale: pulse }] }}>
            <TouchableOpacity style={styles.stopBtn} onPress={stopRecording} activeOpacity={0.85}>
              <View style={styles.stopSquare} />
            </TouchableOpacity>
          </Animated.View>
          <Text style={styles.hint}>Toque para parar</Text>
        </View>
      )}

      {/* ════ PREVIEW ════ */}
      {stage === 'preview' && (
        <View style={styles.previewWrap}>
          {duration > 0 && (
            <View style={styles.durationBadge}>
              <Text style={styles.durationText}>
                {fmtSec(trimStartDisp * duration)} – {fmtSec(trimEndDisp * duration)}
              </Text>
            </View>
          )}

          {/* Waveform canvas */}
          <View style={styles.waveWrap}
            onLayout={e => { trackWRef.current = e.nativeEvent.layout.width; }}>
            {Platform.OS === 'web' ? (
              // @ts-ignore
              <canvas ref={setPreviewCanvas} width={trackWRef.current || 300} height={TRACK_H}
                style={{ width: '100%', height: TRACK_H, display: 'block' }} />
            ) : (
              <View style={{ height: TRACK_H }} />
            )}
          </View>

          {/* 4 action buttons */}
          <View style={styles.actionRow}>
            <TouchableOpacity style={[styles.circleBtn, styles.circlePrimary]} onPress={togglePlay}>
              <Text style={styles.circleIcon}>{isPlaying ? '■' : '▶'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.circleBtn} onPress={() => {
              trimStartRef.current = 0; setTrimStartDisp(0); drawPreview();
            }}>
              <Text style={styles.circleIconSm}>↩</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.circleBtn} onPress={() => {
              trimEndRef.current = 1; setTrimEndDisp(1); drawPreview();
            }}>
              <Text style={styles.circleIconSm}>↪</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.circleBtn, styles.circlePrimary]} onPress={resetToIdle}>
              <MicIcon size={16} color="#FFF" />
            </TouchableOpacity>
          </View>

          {/* Effects */}
          <Text style={styles.sectionLabel}>Efeitos sonoros</Text>
          <View style={styles.effectsRow}>
            {EFFECTS.map(({ id, label }) => {
              const active = activeEffect === id;
              return (
                <TouchableOpacity
                  key={id}
                  style={[styles.effectChip, active && styles.effectChipActive]}
                  onPress={() => handleEffectSelect(id as Effect)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.effectLabel, active && styles.effectLabelActive]}>
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Name */}
          <Text style={styles.sectionLabel}>Nome do som</Text>
          <TextInput
            style={styles.nameInput}
            value={soundName}
            onChangeText={setSoundName}
            placeholder="Nome da gravação"
            placeholderTextColor="rgba(30,27,75,0.4)"
            selectionColor={TEAL}
          />

          <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.85}>
            <Text style={styles.saveBtnText}>Guardar</Text>
          </TouchableOpacity>
        </View>
      )}

      {error && <Text style={styles.errorText}>{error}</Text>}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll:    { flex: 1, backgroundColor: '#1E1B4B' },
  container: { flexGrow: 1, paddingHorizontal: 20, paddingTop: 20 },

  idleWrap:  { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 24, paddingVertical: 60 },
  idleTitle: { fontSize: 22, fontWeight: '800', color: '#FFF' },
  bigMicBtn: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: TEAL,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: TEAL, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.45, shadowRadius: 16,
  },

  recordingWrap: { alignItems: 'center', gap: 20, paddingVertical: 32 },
  timerText:     { fontSize: 40, fontWeight: '200', color: '#FFF', letterSpacing: 3 },
  eqWrap: {
    width: '100%', borderRadius: 12,
    backgroundColor: '#111530', overflow: 'hidden' as any,
  },
  stopBtn: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: '#EF4444',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#EF4444', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 12,
  },
  stopSquare: { width: 20, height: 20, borderRadius: 3, backgroundColor: '#FFF' },
  hint: { fontSize: 13, color: 'rgba(255,255,255,0.4)' },

  previewWrap: { gap: 18 },
  durationBadge: {
    alignSelf: 'center',
    backgroundColor: '#FFF', borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 5,
  },
  durationText: { fontSize: 14, fontWeight: '700', color: '#1E1B4B' },
  waveWrap: {
    width: '100%', borderRadius: 12,
    overflow: 'hidden' as any,
    backgroundColor: '#111530',
  },

  actionRow: { flexDirection: 'row', justifyContent: 'center', gap: 14 },
  circleBtn: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center', justifyContent: 'center',
  },
  circlePrimary: { backgroundColor: TEAL },
  circleIcon:    { color: '#FFF', fontSize: 18, marginLeft: 2 },
  circleIconSm:  { color: '#FFF', fontSize: 20 },

  sectionLabel: { fontSize: 15, fontWeight: '800', color: '#FFF', marginBottom: -4 },

  effectsRow: { flexDirection: 'row', gap: 8 },
  effectChip: {
    flex: 1, borderRadius: 10,
    backgroundColor: TEAL,
    paddingVertical: 8,
    alignItems: 'center', justifyContent: 'center',
  },
  effectChipActive:  { backgroundColor: '#FFF' },
  effectLabel:       { fontSize: 11, fontWeight: '800', color: '#FFF', letterSpacing: 0.5 },
  effectLabelActive: { color: '#1E1B4B' },

  nameInput: {
    backgroundColor: '#FFF', borderRadius: 14,
    paddingHorizontal: 16, paddingVertical: 14,
    fontSize: 16, color: '#1E1B4B', fontWeight: '500',
  },
  saveBtn: {
    backgroundColor: TEAL, borderRadius: 14, paddingVertical: 16, alignItems: 'center',
    shadowColor: TEAL, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 12,
  },
  saveBtnText: { fontSize: 16, fontWeight: '800', color: '#FFF' },
  errorText:   { color: '#EF4444', fontSize: 14, textAlign: 'center' },
});
