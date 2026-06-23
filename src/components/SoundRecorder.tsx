import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Animated, Platform,
  TextInput, ScrollView, PanResponder,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PermissionsAndroid } from 'react-native';

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

const EFFECTS: { id: string; label: string }[] = [
  { id: 'fast',  label: 'RÁPIDO' },
  { id: 'slow',  label: 'LENTO'  },
  { id: 'echo',  label: 'ECO'    },
  { id: 'robot', label: 'ROBÔ'   },
];

// ── Audio helpers (module-level) ─────────────────────────────────────────────

/** Wire effect graph from src to destination. Handles fast/slow/echo/robot and combinations. */
function applyEffectGraph(
  ctx: BaseAudioContext,
  src: AudioBufferSourceNode,
  effects: Effect[],
  dest: AudioNode,
) {
  // Playback rate (fast/slow exclusive — last one wins)
  if (effects.includes('fast')) src.playbackRate.value = 1.7;
  else if (effects.includes('slow')) src.playbackRate.value = 0.55;
  else src.playbackRate.value = 1;

  // Build chain: src → [robot ring mod] → [echo delay] → dest
  let lastNode: AudioNode = src;

  if (effects.includes('robot')) {
    const osc  = (ctx as AudioContext).createOscillator?.() ??
                 (ctx as OfflineAudioContext).createOscillator();
    osc.type = 'sine'; osc.frequency.value = 60;
    const ring = ctx.createGain(); ring.gain.value = 0;
    lastNode.connect(ring);
    osc.connect(ring.gain);
    osc.start(0);
    lastNode = ring;
  }

  if (effects.includes('echo')) {
    const delay = ctx.createDelay(2.0); delay.delayTime.value = 0.28;
    const fb    = ctx.createGain(); fb.gain.value  = 0.42;
    const wet   = ctx.createGain(); wet.gain.value = 0.55;
    lastNode.connect(dest);
    lastNode.connect(delay);
    delay.connect(wet);
    wet.connect(dest);
    wet.connect(fb);
    fb.connect(delay);
    return; // already connected to dest
  }

  lastNode.connect(dest);
}

/** Offline-render audio with effects + trim applied, returning a new AudioBuffer. */
async function renderOffline(
  buf: AudioBuffer,
  trimStart: number,
  trimEnd:   number,
  effects:   Effect[],
): Promise<AudioBuffer> {
  const sr          = buf.sampleRate;
  const startSample = Math.floor(trimStart * buf.length);
  const endSample   = Math.ceil(trimEnd   * buf.length);
  const trimLen     = Math.max(1, endSample - startSample);

  // Build trimmed source buffer (mono or stereo)
  const nCh      = buf.numberOfChannels;
  const trimBuf  = new AudioBuffer({ length: trimLen, numberOfChannels: nCh, sampleRate: sr });
  for (let ch = 0; ch < nCh; ch++) {
    trimBuf.copyToChannel(buf.getChannelData(ch).slice(startSample, endSample), ch);
  }

  // Calculate output length
  const rate      = effects.includes('fast') ? 1.7 : effects.includes('slow') ? 0.55 : 1;
  const echoTail  = effects.includes('echo') ? 2.5 : 0;
  const outLen    = Math.ceil((trimLen / rate + echoTail * sr));

  const offCtx = new OfflineAudioContext(nCh, outLen, sr);
  const src    = offCtx.createBufferSource();
  src.buffer   = trimBuf;
  applyEffectGraph(offCtx as any, src, effects, offCtx.destination);
  src.start(0);
  return offCtx.startRendering();
}

/** Encode an AudioBuffer to a WAV Blob (16-bit PCM). */
function encodeWav(buf: AudioBuffer): Blob {
  const nCh     = Math.min(buf.numberOfChannels, 2);
  const sr      = buf.sampleRate;
  const len     = buf.length;
  const bps     = 2; // 16-bit
  const blockA  = nCh * bps;
  const dataLen = len * blockA;
  const ab      = new ArrayBuffer(44 + dataLen);
  const v       = new DataView(ab);
  const s       = (o: number, str: string) => { for (let i = 0; i < str.length; i++) v.setUint8(o + i, str.charCodeAt(i)); };

  s(0,  'RIFF'); v.setUint32(4,  36 + dataLen, true);
  s(8,  'WAVE'); s(12, 'fmt ');
  v.setUint32(16, 16,         true);
  v.setUint16(20, 1,          true); // PCM
  v.setUint16(22, nCh,        true);
  v.setUint32(24, sr,         true);
  v.setUint32(28, sr * blockA,true);
  v.setUint16(32, blockA,     true);
  v.setUint16(34, 16,         true);
  s(36, 'data'); v.setUint32(40, dataLen, true);

  let off = 44;
  for (let i = 0; i < len; i++) {
    for (let ch = 0; ch < nCh; ch++) {
      const x = Math.max(-1, Math.min(1, buf.getChannelData(ch)[i]));
      v.setInt16(off, x < 0 ? x * 32768 : x * 32767, true);
      off += 2;
    }
  }
  return new Blob([ab], { type: 'audio/wav' });
}

// ────────────────────────────────────────────────────────────────────────────

export function MicIcon({ size = 26, color = '#FFF' }: { size?: number; color?: string }) {
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

// ── Android-native recording component ───────────────────────────────────────

// Lazy-loaded so a missing native module doesn't crash the app at startup
const getPipasRecording = () => require('../../modules/pipas-recording').PipasRecording;
const getPipasAudio     = () => require('../../modules/pipas-audio').PipasAudio;

function NativeSoundRecorder({ onCancel, onSave }: Props) {
  const [stage, setStage]       = useState<Stage>('idle');
  const [seconds, setSeconds]   = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [soundName, setSoundName] = useState('Gravação 1');
  const [error, setError]       = useState<string | null>(null);
  const [ampBars, setAmpBars]   = useState<number[]>(Array(30).fill(0));

  const pulse       = useRef(new Animated.Value(1)).current;
  const timerRef    = useRef<ReturnType<typeof setInterval> | null>(null);
  const ampPollRef  = useRef<ReturnType<typeof setInterval> | null>(null);
  const filePathRef = useRef<string | null>(null);
  const ampHistRef  = useRef<number[]>(Array(30).fill(0));

  // Timer + pulse + amplitude polling during recording
  useEffect(() => {
    if (stage === 'recording') {
      timerRef.current = setInterval(() => setSeconds(s => s + 1), 1000);
      Animated.loop(Animated.sequence([
        Animated.timing(pulse, { toValue: 1.1, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1,   duration: 700, useNativeDriver: true }),
      ])).start();

      // Poll amplitude every 100ms for live bar display
      ampPollRef.current = setInterval(() => {
        const amp = getPipasRecording().getMaxAmplitude(); // 0–32767
        const norm = Math.min(1, amp / 20000);
        ampHistRef.current = [...ampHistRef.current.slice(1), norm];
        setAmpBars([...ampHistRef.current]);
      }, 100);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      if (ampPollRef.current) clearInterval(ampPollRef.current);
      pulse.stopAnimation(); pulse.setValue(1);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (ampPollRef.current) clearInterval(ampPollRef.current);
    };
  }, [stage]);

  const fmt = (s: number) =>
    `${Math.floor(s / 60).toString().padStart(2,'0')}:${(s % 60).toString().padStart(2,'0')}`;

  const startRecording = async () => {
    setError(null); setSeconds(0);
    ampHistRef.current = Array(30).fill(0);
    setAmpBars(Array(30).fill(0));
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        { title: 'Microfone', message: 'Pipas precisa do microfone para gravar sons.', buttonPositive: 'Permitir' }
      );
      if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
        setError('Permita o acesso ao microfone nas configurações.');
        return;
      }
      const path = await getPipasRecording().startRecording();
      filePathRef.current = path;
      setStage('recording');
    } catch (e: any) {
      setError(e?.message ?? 'Erro ao iniciar gravação. Permita o acesso ao microfone.');
    }
  };

  const stopRecording = async () => {
    try {
      const path = await getPipasRecording().stopRecording();
      filePathRef.current = path;
      setStage('preview');
    } catch (e: any) {
      setError(e?.message ?? 'Erro ao parar gravação.');
      setStage('idle');
    }
  };

  const togglePlay = async () => {
    const path = filePathRef.current;
    if (!path) return;
    if (isPlaying) {
      await getPipasAudio().stopFile(path).catch(() => {});
      setIsPlaying(false);
    } else {
      setIsPlaying(true);
      getPipasAudio().playFile(path)
        .catch(() => {})
        .finally(() => setIsPlaying(false));
    }
  };

  const resetToIdle = async () => {
    const path = filePathRef.current;
    if (path) await getPipasAudio().stopFile(path).catch(() => {});
    setIsPlaying(false);
    setStage('idle'); setSeconds(0);
    filePathRef.current = null;
    setAmpBars(Array(30).fill(0));
    ampHistRef.current = Array(30).fill(0);
  };

  const handleSave = () => {
    const path = filePathRef.current;
    if (!path) return;
    onSave(soundName || 'Gravação', path);
  };

  const isIdle      = stage === 'idle';
  const isRecording = stage === 'recording';
  const isPreview   = stage === 'preview';

  return (
    <View style={styles.outerWrap}>
      <ScrollView style={styles.scroll} contentContainerStyle={[styles.scrollContent, { gap: 24 }]} keyboardShouldPersistTaps="handled">

        {/* Timer */}
        <View style={styles.timerRow}>
          <Text style={styles.timerText}>{fmt(seconds)}</Text>
        </View>

        {/* Amplitude bars (visible during recording) */}
        <View style={[styles.eqWrap, { height: 100, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, gap: 2 }]}>
          {ampBars.map((v, i) => {
            const h = Math.max(4, v * 80);
            return (
              <View key={i} style={{
                flex: 1, height: h, borderRadius: 2,
                backgroundColor: isRecording ? `rgba(91,196,209,${0.3 + v * 0.7})` : 'rgba(255,255,255,0.08)',
              }} />
            );
          })}
        </View>

        {/* Action buttons */}
        <View style={styles.actionRow}>
          {isPreview ? (
            <>
              <TouchableOpacity style={[styles.circleBtn, styles.circlePrimary]} onPress={togglePlay}>
                <Text style={styles.circleIcon}>{isPlaying ? '■' : '▶'}</Text>
              </TouchableOpacity>
            </>
          ) : isRecording ? (
            <Animated.View style={{ transform: [{ scale: pulse }] }}>
              <TouchableOpacity style={styles.stopBtn} onPress={stopRecording} activeOpacity={0.85}>
                <View style={styles.stopSquare} />
              </TouchableOpacity>
            </Animated.View>
          ) : (
            <TouchableOpacity style={styles.startBtn} onPress={startRecording} activeOpacity={0.85}>
              <MicIcon size={26} color="#FFF" />
            </TouchableOpacity>
          )}
        </View>

        {(isIdle || isRecording) && (
          <Text style={styles.hint}>{isIdle ? 'Toque para gravar' : 'Toque para parar'}</Text>
        )}

        {/* Name input */}
        <TextInput
          style={styles.nameInput}
          value={soundName}
          onChangeText={isPreview ? setSoundName : undefined}
          editable={isPreview}
          placeholder="Nome da gravação"
          placeholderTextColor="rgba(255,255,255,0.25)"
          selectionColor={TEAL}
        />

        {error && <Text style={styles.errorText}>{error}</Text>}
      </ScrollView>

      {/* CTA bar */}
      <View style={styles.ctaBar}>
        <TouchableOpacity
          style={[styles.saveBtn, isPreview ? styles.saveBtnActive : styles.saveBtnInactive]}
          onPress={isPreview ? handleSave : undefined}
          disabled={!isPreview}
          activeOpacity={0.85}
        >
          <Text style={[styles.saveBtnText, !isPreview && { color: 'rgba(255,255,255,0.4)' }]}>GUARDAR</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.regravarBtn, isPreview ? styles.regravarBtnActive : styles.regravarBtnInactive]}
          onPress={isPreview ? resetToIdle : undefined}
          disabled={!isPreview}
          activeOpacity={0.85}
        >
          <Text style={[styles.regravarText, !isPreview && { color: 'rgba(255,255,255,0.3)' }]}>REGRAVAR</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onCancel} activeOpacity={0.7} style={styles.cancelLink}>
          <Text style={styles.cancelLinkText}>Cancelar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ── Web recording component ───────────────────────────────────────────────────

export default function SoundRecorder({ onCancel, onSave }: Props) {
  if (Platform.OS !== 'web') {
    return <NativeSoundRecorder onCancel={onCancel} onSave={onSave} />;
  }
  const [stage, setStage]         = useState<Stage>('idle');
  const [seconds, setSeconds]     = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [trimStartDisp, setTrimStartDisp] = useState(0);
  const [trimEndDisp,   setTrimEndDisp]   = useState(1);
  const [duration,  setDuration]  = useState(0);
  const [activeEffects, setActiveEffects] = useState<Effect[]>([]);
  const [soundName, setSoundName] = useState('Gravação 1');
  const [error, setError]         = useState<string | null>(null);

  // ── Refs (never stale inside handlers) ──────────────────────────────────
  const trimStartRef   = useRef(0);
  const trimEndRef     = useRef(1);
  const playPosRef     = useRef(0);
  const isPlayingRef   = useRef(false);
  const waveDataRef    = useRef<Float32Array | null>(null);
  const audioBufRef    = useRef<AudioBuffer | null>(null);   // full decoded buffer for playback
  const blobRef        = useRef<Blob | null>(null);
  const activeEffectsRef = useRef<Effect[]>([]);             // mirror of activeEffects for handlers

  // Web Audio playback nodes (replaced on each play)
  const playActxRef    = useRef<AudioContext | null>(null);
  const playSrcRef     = useRef<AudioBufferSourceNode | null>(null);
  const playStartRef   = useRef(0);   // actx.currentTime when play started
  const playOffsetRef  = useRef(0);   // buffer seconds offset when play started

  const pulse          = useRef(new Animated.Value(1)).current;
  const timerRef       = useRef<ReturnType<typeof setInterval> | null>(null);
  const mrRef          = useRef<MediaRecorder | null>(null);
  const chunksRef      = useRef<Blob[]>([]);

  const eqCanvasRef      = useRef<HTMLCanvasElement | null>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const eqRafRef         = useRef<number | null>(null);
  const previewRafRef    = useRef<number | null>(null);
  const analyserRef      = useRef<AnalyserNode | null>(null);
  const trackWRef        = useRef(300);
  const insets           = useSafeAreaInsets();

  // ── Canvas: draw waveform + trim brackets ────────────────────────────────
  const drawPreview = useCallback(() => {
    let canvas: HTMLCanvasElement | null = previewCanvasRef.current as any;
    if (!canvas || typeof (canvas as any).getContext !== 'function') {
      canvas = document.getElementById('pipas-preview-canvas') as HTMLCanvasElement | null;
    }
    if (!canvas) return;
    const ctx = (canvas as HTMLCanvasElement).getContext('2d');
    if (!ctx) return;
    const W = canvas.width, H = canvas.height;
    const ts = trimStartRef.current, te = trimEndRef.current;

    ctx.shadowBlur = 0;
    ctx.clearRect(0, 0, W, H);

    // 1. Waveform
    const samples = waveDataRef.current;
    if (samples && samples.length > 0) {
      const step = Math.ceil(samples.length / W);
      const amp  = H / 2;
      ctx.beginPath(); ctx.moveTo(0, amp);
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
      ctx.fillStyle = TEAL; ctx.globalAlpha = 0.82; ctx.fill(); ctx.globalAlpha = 1;
    }

    // 2. Cut overlays (dark + diagonal stripes)
    const lx = Math.max(0, Math.round(ts * W));
    const rx  = Math.min(W, Math.round(te * W));
    const drawCut = (x: number, w: number) => {
      if (w <= 0) return;
      ctx.fillStyle = 'rgba(0,0,0,0.72)'; ctx.fillRect(x, 0, w, H);
      ctx.save(); ctx.beginPath(); ctx.rect(x, 0, w, H); ctx.clip();
      ctx.strokeStyle = 'rgba(255,255,255,0.1)'; ctx.lineWidth = 6;
      for (let sx = x - H; sx < x + w + H; sx += 14) {
        ctx.beginPath(); ctx.moveTo(sx, 0); ctx.lineTo(sx + H, H); ctx.stroke();
      }
      ctx.restore();
    };
    drawCut(0, lx); drawCut(rx, W - rx);

    // 3. Bracket handles
    ctx.fillStyle = '#FFF';
    const BW = BRACKET_W, CAP = BRACKET_CAP;
    ctx.fillRect(lx, 0, BW, H);
    ctx.fillRect(lx, 0, CAP + BW, BW);
    ctx.fillRect(lx, H - BW, CAP + BW, BW);
    ctx.fillRect(rx - BW, 0, BW, H);
    ctx.fillRect(rx - CAP - BW, 0, CAP + BW, BW);
    ctx.fillRect(rx - CAP - BW, H - BW, CAP + BW, BW);

    // 4. Playhead (only when playing or advanced)
    if (isPlayingRef.current || playPosRef.current > 0.001) {
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.fillRect(Math.round(playPosRef.current * W) - 1, 0, 2, H);
    }
  }, []);

  // Canvas ref — just store the element
  const setPreviewCanvas = useCallback((el: any) => { previewCanvasRef.current = el ?? null; }, []);
  const setEqCanvas      = useCallback((el: any) => { if (el) eqCanvasRef.current = el; }, []);

  useEffect(() => {
    if (stage === 'preview') setTimeout(() => drawPreview(), 80);
  }, [stage, drawPreview]);

  // ── Drag via PanResponder (guaranteed to work in React Native Web) ───────
  // PanResponder uses React Native's responder system which is always wired up.
  // We store drag state in refs to avoid stale closures & React re-renders during drag.
  const dragStateRef = useRef<{ which: 'start' | 'end'; viewLeft: number; viewWidth: number } | null>(null);

  const panResponder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder:  () => true,
    onPanResponderGrant: (e) => {
      const ne = e.nativeEvent;
      const locationX: number = (ne as any).locationX ?? 0;
      const pageX:     number = (ne as any).pageX     ?? (ne as any).clientX ?? 0;
      const width  = trackWRef.current || 300;
      const pos    = Math.max(0, Math.min(1, locationX / width));
      const which: 'start' | 'end' =
        Math.abs(pos - trimStartRef.current) <= Math.abs(pos - trimEndRef.current) ? 'start' : 'end';
      dragStateRef.current = { which, viewLeft: pageX - locationX, viewWidth: width };
    },
    onPanResponderMove: (e) => {
      if (!dragStateRef.current) return;
      const { which, viewLeft, viewWidth } = dragStateRef.current;
      const pageX: number = (e.nativeEvent as any).pageX ?? (e.nativeEvent as any).clientX ?? 0;
      const p = Math.max(0, Math.min(1, (pageX - viewLeft) / viewWidth));
      if (which === 'start') trimStartRef.current = Math.min(p, trimEndRef.current - 0.02);
      else                   trimEndRef.current   = Math.max(p, trimStartRef.current + 0.02);
      drawPreview();
    },
    onPanResponderRelease: () => {
      dragStateRef.current = null;
      setTrimStartDisp(trimStartRef.current);
      setTrimEndDisp(trimEndRef.current);
    },
    onPanResponderTerminate: () => {
      dragStateRef.current = null;
    },
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [drawPreview]); // drawPreview is stable (useCallback with no deps)

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

  // ── Real-time EQ ─────────────────────────────────────────────────────────
  const startEQ = useCallback((stream: MediaStream) => {
    if (Platform.OS !== 'web') return;
    const actx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const src  = actx.createMediaStreamSource(stream);
    const analyser = actx.createAnalyser(); analyser.fftSize = 256;
    src.connect(analyser); analyserRef.current = analyser;
    const draw = () => {
      if (!analyserRef.current) return;
      const canvas = eqCanvasRef.current; if (!canvas) { eqRafRef.current = requestAnimationFrame(draw); return; }
      const ctx = canvas.getContext('2d'); if (!ctx) { eqRafRef.current = requestAnimationFrame(draw); return; }
      const W = canvas.width, H = canvas.height;
      const data = new Uint8Array(analyser.frequencyBinCount); analyser.getByteFrequencyData(data);
      ctx.clearRect(0, 0, W, H);
      const count = 60, bw = W / count;
      for (let i = 0; i < count; i++) {
        const v = data[i] / 255; const bh = Math.max(2, v * H * 0.9);
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

  // ── Playback via AudioBufferSourceNode ───────────────────────────────────
  // This avoids createMediaElementSource which permanently re-routes HTMLAudioElement
  // and breaks it when the AudioContext is closed.
  const stopPlay = useCallback(() => {
    if (playSrcRef.current) { try { playSrcRef.current.stop(); } catch {} playSrcRef.current = null; }
    if (playActxRef.current) { playActxRef.current.close(); playActxRef.current = null; }
    if (previewRafRef.current !== null) { cancelAnimationFrame(previewRafRef.current); previewRafRef.current = null; }
    isPlayingRef.current = false; setIsPlaying(false);
  }, []);

  const startPlay = useCallback(() => {
    const buf = audioBufRef.current; if (!buf) return;
    stopPlay();

    const actx = new (window.AudioContext || (window as any).webkitAudioContext)();
    playActxRef.current = actx;

    const src = actx.createBufferSource();
    src.buffer = buf;
    playSrcRef.current = src;

    const effs = activeEffectsRef.current;
    applyEffectGraph(actx, src, effs, actx.destination);

    const startOffset = trimStartRef.current * buf.duration;
    const playLen     = (trimEndRef.current - trimStartRef.current) * buf.duration;
    playOffsetRef.current = startOffset;
    playStartRef.current  = actx.currentTime;

    src.start(0, startOffset, playLen);
    src.onended = () => {
      playPosRef.current = trimStartRef.current;
      stopPlay();
      drawPreview();
    };

    isPlayingRef.current = true; setIsPlaying(true);

    // Playhead via AudioContext clock (more accurate than ontimeupdate)
    const raf = () => {
      if (!isPlayingRef.current || !playActxRef.current) return;
      const elapsed = playActxRef.current.currentTime - playStartRef.current;
      const bufPos  = (playOffsetRef.current + elapsed * src.playbackRate.value) / buf.duration;
      playPosRef.current = Math.min(bufPos, trimEndRef.current);
      drawPreview();
      previewRafRef.current = requestAnimationFrame(raf);
    };
    previewRafRef.current = requestAnimationFrame(raf);
  }, [drawPreview, stopPlay]);

  const togglePlay = useCallback(() => {
    if (isPlaying) stopPlay();
    else startPlay();
  }, [isPlaying, startPlay, stopPlay]);

  // ── Effect selection (multiple, togglable) ───────────────────────────────
  const handleEffectSelect = useCallback((id: string) => {
    setActiveEffects(prev => {
      const eff = id as Effect;
      const next = prev.includes(eff) ? prev.filter(e => e !== eff) : [...prev, eff];
      activeEffectsRef.current = next;
      if (isPlayingRef.current) { stopPlay(); setTimeout(() => startPlay(), 50); }
      return next;
    });
  }, [startPlay, stopPlay]);

  // ── Start recording ───────────────────────────────────────────────────────
  const startRecording = async () => {
    setError(null); setSeconds(0); waveDataRef.current = null; audioBufRef.current = null;
    setActiveEffects([]); activeEffectsRef.current = [];
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
            audioBufRef.current = buf;   // full buffer for playback
            setDuration(buf.duration);
            // Downsample for waveform display
            const raw = buf.getChannelData(0);
            const pts = 2000, step = Math.ceil(raw.length / pts);
            const down = new Float32Array(pts);
            for (let i = 0; i < pts; i++) {
              let max = 0;
              for (let j = 0; j < step; j++) { const v = Math.abs(raw[i * step + j] || 0); if (v > max) max = v; }
              down[i] = max;
            }
            waveDataRef.current = down;
            actx.close();
          } catch { /* silent */ }
          trimStartRef.current = 0; trimEndRef.current = 1;
          setTrimStartDisp(0); setTrimEndDisp(1); playPosRef.current = 0;
          setStage('preview');
        };
        mr.start(); setStage('recording');
      } catch { setError('Não foi possível acessar o microfone.'); }
    } else { setStage('recording'); }
  };

  const stopRecording = () => {
    if (Platform.OS === 'web' && mrRef.current) mrRef.current.stop();
    else { stopEQ(); setStage('preview'); }
  };

  const resetToIdle = () => {
    stopPlay();
    setStage('idle'); setSeconds(0);
    trimStartRef.current = 0; trimEndRef.current = 1;
    setTrimStartDisp(0); setTrimEndDisp(1);
    playPosRef.current = 0; waveDataRef.current = null; audioBufRef.current = null;
    setActiveEffects([]); activeEffectsRef.current = [];
  };

  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    const buf = audioBufRef.current; if (!buf) return;
    setIsSaving(true);
    try {
      const rendered = await renderOffline(buf, trimStartRef.current, trimEndRef.current, activeEffectsRef.current);
      const wavBlob  = encodeWav(rendered);
      onSave(soundName || 'Gravação', URL.createObjectURL(wavBlob));
    } catch {
      // Fallback: save raw trimmed blob without effects
      const blob = blobRef.current;
      if (blob) onSave(soundName || 'Gravação', URL.createObjectURL(blob));
    } finally {
      setIsSaving(false);
    }
  };

  const fmt    = (s: number) => `${Math.floor(s / 60).toString().padStart(2,'0')}:${(s % 60).toString().padStart(2,'0')}`;
  const fmtSec = (s: number) => `${s.toFixed(1)}s`;

  const isIdle      = stage === 'idle';
  const isRecording = stage === 'recording';
  const isPreview   = stage === 'preview';

  return (
    <View style={styles.outerWrap}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Timer ── */}
        <View style={styles.timerRow}>
          <Text style={styles.timerText}>
            {isIdle ? '00:00' : fmt(seconds)}
          </Text>
          {isPreview && duration > 0 && (
            <Text style={styles.timerText}>
              {fmt(Math.round(trimEndDisp * duration))}
            </Text>
          )}
        </View>

        {/* ── Waveform / EQ canvas ── */}
        {isPreview ? (
          <View
            style={styles.waveWrap}
            onLayout={e => { trackWRef.current = e.nativeEvent.layout.width; }}
          >
            {Platform.OS === 'web' && (
              // @ts-ignore
              <canvas
                ref={setPreviewCanvas}
                id="pipas-preview-canvas"
                width={trackWRef.current || 300}
                height={TRACK_H}
                style={{ width: '100%', height: TRACK_H, display: 'block' }}
              />
            )}
            <View style={styles.waveOverlay} {...panResponder.panHandlers} />
          </View>
        ) : (
          <View
            style={[styles.eqWrap, isIdle && { backgroundColor: 'rgba(255,255,255,0.04)' }]}
            onLayout={e => { trackWRef.current = e.nativeEvent.layout.width; }}
          >
            {isRecording && Platform.OS === 'web' ? (
              // @ts-ignore
              <canvas ref={setEqCanvas} width={trackWRef.current || 300} height={TRACK_H}
                style={{ width: '100%', height: TRACK_H }} />
            ) : <View style={{ height: TRACK_H }} />}
          </View>
        )}

        {/* ── Action buttons row ── */}
        <View style={styles.actionRow}>
          {isPreview ? (
            <>
              <TouchableOpacity style={styles.circleBtn} onPress={() => { trimStartRef.current = 0; setTrimStartDisp(0); drawPreview(); }}>
                <Text style={styles.circleIconSm}>↩</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.circleBtn, styles.circlePrimary]} onPress={togglePlay}>
                <Text style={styles.circleIcon}>{isPlaying ? '■' : '▶'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.circleBtn} onPress={() => { trimEndRef.current = 1; setTrimEndDisp(1); drawPreview(); }}>
                <Text style={styles.circleIconSm}>↪</Text>
              </TouchableOpacity>
            </>
          ) : isRecording ? (
            <Animated.View style={{ transform: [{ scale: pulse }] }}>
              <TouchableOpacity style={styles.stopBtn} onPress={stopRecording} activeOpacity={0.85}>
                <View style={styles.stopSquare} />
              </TouchableOpacity>
            </Animated.View>
          ) : (
            <TouchableOpacity style={styles.startBtn} onPress={startRecording} activeOpacity={0.85}>
              <MicIcon size={26} color="#FFF" />
            </TouchableOpacity>
          )}
        </View>

        {(isIdle || isRecording) && (
          <Text style={styles.hint}>{isIdle ? 'Toque para gravar' : 'Toque para parar'}</Text>
        )}

        {/* ── Effects ── */}
        <Text style={styles.sectionLabel}>Efeitos sonoros</Text>
        <View style={styles.effectsRow}>
          {EFFECTS.map(({ id, label }) => (
            <TouchableOpacity
              key={id}
              style={[styles.effectChip, isPreview && activeEffects.includes(id as Effect) && styles.effectChipActive]}
              onPress={isPreview ? () => handleEffectSelect(id) : undefined}
              activeOpacity={isPreview ? 0.8 : 1}
            >
              <Text style={[styles.effectLabel, isPreview && activeEffects.includes(id as Effect) && styles.effectLabelActive]}>
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Name input ── */}
        <TextInput
          style={styles.nameInput}
          value={soundName}
          onChangeText={isPreview ? setSoundName : undefined}
          editable={isPreview}
          placeholder="Nome da gravação"
          placeholderTextColor="rgba(255,255,255,0.25)"
          selectionColor={TEAL}
        />

        {error && <Text style={styles.errorText}>{error}</Text>}
      </ScrollView>

      {/* ── CTA bar — absolutely pinned to bottom ── */}
      <View style={styles.ctaBar}>
        <TouchableOpacity
          style={[styles.saveBtn, isPreview ? styles.saveBtnActive : styles.saveBtnInactive]}
          onPress={isPreview ? handleSave : undefined}
          disabled={!isPreview || isSaving}
          activeOpacity={0.85}
        >
          <Text style={[styles.saveBtnText, !isPreview && { color: 'rgba(255,255,255,0.4)' }]}>
            {isSaving ? 'A GUARDAR…' : 'GUARDAR'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.regravarBtn, isPreview ? styles.regravarBtnActive : styles.regravarBtnInactive]}
          onPress={isPreview ? resetToIdle : undefined}
          disabled={!isPreview}
          activeOpacity={0.85}
        >
          <Text style={[styles.regravarText, !isPreview && { color: 'rgba(255,255,255,0.3)' }]}>REGRAVAR</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onCancel} activeOpacity={0.7} style={styles.cancelLink}>
          <Text style={styles.cancelLinkText}>Cancelar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outerWrap:    { flex: 1, backgroundColor: '#000' },
  scroll:       { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 230, gap: 20 },

  timerRow: { flexDirection: 'row', justifyContent: 'center', gap: 24 },
  timerText: { fontSize: 40, fontWeight: '200', color: '#FFF', letterSpacing: 3 },

  eqWrap:   { width: '100%', borderRadius: 12, backgroundColor: '#111', overflow: 'hidden' as any },
  waveWrap: { width: '100%', borderRadius: 12, overflow: 'hidden' as any, backgroundColor: '#111', position: 'relative' as any },
  waveOverlay: { position: 'absolute' as any, top: 0, left: 0, right: 0, bottom: 0, cursor: 'col-resize' as any },

  actionRow: { height: 80, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 14 },

  startBtn: {
    width: 72, height: 72, borderRadius: 36, backgroundColor: TEAL,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: TEAL, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.45, shadowRadius: 16,
  },
  stopBtn: {
    width: 56, height: 56, borderRadius: 28, backgroundColor: '#EF4444',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#EF4444', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 12,
  },
  stopSquare: { width: 20, height: 20, borderRadius: 3, backgroundColor: '#FFF' },

  circleBtn: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center',
  },
  circlePrimary: { backgroundColor: TEAL },
  circleIcon:    { color: '#FFF', fontSize: 18, marginLeft: 2 },
  circleIconSm:  { color: '#FFF', fontSize: 18 },

  hint: { fontSize: 13, color: 'rgba(255,255,255,0.4)', textAlign: 'center' },

  sectionLabel: { fontSize: 12, fontWeight: '700', color: 'rgba(255,255,255,0.4)', letterSpacing: 1, textTransform: 'uppercase' as any },

  effectsRow: { flexDirection: 'row', gap: 8 },
  effectChip: {
    flex: 1, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingVertical: 8, alignItems: 'center', justifyContent: 'center',
  },
  effectChipActive:  { backgroundColor: TEAL },
  effectLabel:       { fontSize: 11, fontWeight: '800', color: 'rgba(255,255,255,0.4)', letterSpacing: 0.5 },
  effectLabelActive: { color: '#FFF' },

  nameInput: {
    borderBottomWidth: 1.5,
    borderBottomColor: 'rgba(255,255,255,0.4)',
    paddingVertical: 10,
    fontSize: 16, color: '#FFF', fontWeight: '500',
    backgroundColor: 'transparent',
  },

  // ── CTA bar ──
  ctaBar: {
    position: 'absolute' as any,
    left: 0, right: 0, bottom: 0,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 32,
    gap: 0,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
    backgroundColor: '#000',
  },
  saveBtn: {
    borderRadius: 14, paddingVertical: 16, alignItems: 'center',
  },
  saveBtnActive:   { backgroundColor: TEAL },
  saveBtnInactive: { backgroundColor: 'rgba(255,255,255,0.07)', borderWidth: 0 },
  saveBtnText: { fontSize: 14, fontWeight: '600', color: '#FFF', letterSpacing: 1.5 },

  regravarBtn: { borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 10 },
  regravarBtnActive:   { borderWidth: 1.5, borderColor: '#FFF' },
  regravarBtnInactive: { borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.2)' },
  regravarText: { fontSize: 14, fontWeight: '600', color: '#FFF', letterSpacing: 1.5 },

  cancelLink:     { alignItems: 'center', paddingVertical: 10, marginTop: 4 },
  cancelLinkText: { fontSize: 14, fontWeight: '400', color: '#FFF' },

  errorText: { color: '#EF4444', fontSize: 14, textAlign: 'center' },
});
