import React, { useState, useEffect, useRef } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Pressable, Alert, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp, BoardStatus } from '../context/AppContext';
import { board, COMMON_BAUD_RATES } from '../serial';

const MAX_LOG = 60;

export default function BoardStatusSheet() {
  const {
    boardSheetOpen, setBoardSheetOpen,
    boardStatus, setBoardStatus,
    activeBlockIndex, stopRun,
    setUsbDisconnectedWhileRunning,
    simulateTouch,
  } = useApp();
  const insets = useSafeAreaInsets();
  const [connecting, setConnecting] = useState(false);
  const [baud, setBaud]             = useState(9600);
  const [serialLog, setSerialLog]   = useState<string[]>([]);
  const logScrollRef = useRef<ScrollView>(null);

  // Always subscribed (Modal stays mounted) — log persists across open/close
  useEffect(() => {
    return board.onRawLine((line) => {
      setSerialLog(prev => {
        const next = [...prev, line];
        return next.length > MAX_LOG ? next.slice(-MAX_LOG) : next;
      });
      setTimeout(() => logScrollRef.current?.scrollToEnd({ animated: true }), 60);
    });
  }, []);

  // Keep baud rate in sync with the board singleton
  useEffect(() => { board.setBaudRate(baud); }, [baud]);

  const handleConnectUSB = async () => {
    if (!board.isSupported) {
      Alert.alert(
        'Web Serial não disponível',
        'Use o Google Chrome para conectar via USB. O Safari e Firefox não suportam Web Serial.',
      );
      return;
    }
    try {
      setConnecting(true);
      await board.connect();
      setBoardStatus('connected');
      setBoardSheetOpen(false);
    } catch (e: any) {
      if (!e?.message?.includes('No port selected')) {
        setBoardStatus('error');
      }
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    await board.disconnect();
    setBoardStatus('disconnected');
    if (activeBlockIndex !== null) {
      stopRun();
      setUsbDisconnectedWhileRunning(true);
    }
    setBoardSheetOpen(false);
  };

  const handleRetry = async () => {
    await board.disconnect();
    await handleConnectUSB();
  };

  const handleSimulate = (pad: number) => {
    setBoardSheetOpen(false);
    simulateTouch(pad);
  };

  const statusLabel =
    boardStatus === 'connected' ? 'Conectada via USB' :
    boardStatus === 'error'     ? 'Erro de comunicação com a placa' :
                                  'Nenhuma placa encontrada';

  const statusColor =
    boardStatus === 'connected' ? '#22C55E' :
    boardStatus === 'error'     ? '#EF4444' : '#999';

  return (
    <Modal
      visible={boardSheetOpen}
      transparent
      animationType="slide"
      onRequestClose={() => setBoardSheetOpen(false)}
    >
      <Pressable style={styles.backdrop} onPress={() => setBoardSheetOpen(false)}>
        <Pressable style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
          <View style={styles.handle} />

          {/* Board icon */}
          <View style={[styles.boardIcon, { borderColor: statusColor }]}>
            <View style={[styles.boardInner, { backgroundColor: statusColor }]} />
          </View>

          <Text style={styles.title}>Placa Pipas</Text>
          <Text style={[styles.status, { color: statusColor }]}>{statusLabel}</Text>

          <View style={styles.divider} />

          {/* Actions based on status */}
          {boardStatus === 'connected' && (
            <>
              <ActionButton label="Testar LED" color="#9268F6" onPress={() => board.sendCommand(1, 1)} />
              <ActionButton label="Testar Motor" color="#5F95F7" onPress={() => board.sendCommand(2, 1)} />
              <ActionButton label="Desconectar" color="#EF4444" outline onPress={handleDisconnect} />
            </>
          )}
          {boardStatus === 'disconnected' && (
            <>
              {/* Baud rate picker */}
              <View style={styles.baudRow}>
                <Text style={styles.baudLabel}>Baud rate:</Text>
                {COMMON_BAUD_RATES.map(rate => (
                  <TouchableOpacity
                    key={rate}
                    style={[styles.baudChip, baud === rate && styles.baudChipActive]}
                    onPress={() => setBaud(rate)}
                  >
                    <Text style={[styles.baudChipText, baud === rate && styles.baudChipTextActive]}>
                      {rate}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <ActionButton
                label={connecting ? 'Conectando…' : 'Conectar USB'}
                color="#22C55E"
                onPress={handleConnectUSB}
                disabled={connecting}
              />
              <ActionButton label="Tentar novamente" color="#5F95F7" outline onPress={handleRetry} />
            </>
          )}
          {boardStatus === 'error' && (
            <>
              <ActionButton label="Tentar novamente" color="#5F95F7" onPress={handleRetry} />
              <ActionButton label="Desconectar" color="#EF4444" outline onPress={handleDisconnect} />
            </>
          )}

          {/* ── Simulation section ─────────────────────────── */}
          <View style={styles.simSection}>
            <Text style={styles.simTitle}>SIMULAR TOQUE (para testes)</Text>
            <View style={styles.simRow}>
              {[1, 2, 3].map(pad => (
                <TouchableOpacity
                  key={pad}
                  style={styles.simBtn}
                  onPress={() => handleSimulate(pad)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.simBtnText}>Toque {pad}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* ── Serial monitor ─────────────────────────────── */}
          <View style={styles.monitorSection}>
            <View style={styles.monitorHeader}>
              <Text style={styles.monitorTitle}>MONITOR SERIAL</Text>
              <TouchableOpacity onPress={() => setSerialLog([])}>
                <Text style={styles.monitorClear}>limpar</Text>
              </TouchableOpacity>
            </View>
            <ScrollView
              ref={logScrollRef}
              style={styles.monitorScroll}
              contentContainerStyle={{ padding: 8 }}
            >
              {serialLog.length === 0 ? (
                <Text style={styles.monitorEmpty}>
                  {boardStatus === 'connected'
                    ? 'Aguardando dados da placa…'
                    : 'Conecte a placa para ver os dados aqui'}
                </Text>
              ) : (
                serialLog.map((line, i) => (
                  <Text key={i} style={styles.monitorLine}>
                    {`> ${line}`}
                  </Text>
                ))
              )}
            </ScrollView>
            <Text style={styles.monitorHint}>
              {boardStatus === 'connected'
                ? serialLog.filter(l => !l.startsWith('[')).length === 0
                  ? '⚠️ Nenhum dado recebido ainda. Toque o pad e verifique também o Serial Monitor do Arduino IDE.'
                  : 'Toque detectado! Verifique se o formato bate com o esperado.'
                : 'Conecte a placa para ver os dados aqui.'}
            </Text>
          </View>

          {/* Status switcher for board state */}
          <View style={styles.devRow}>
            <Text style={styles.devLabel}>Estado: </Text>
            {(['connected', 'disconnected', 'error'] as BoardStatus[]).map(s => (
              <TouchableOpacity
                key={s}
                style={[styles.devChip, boardStatus === s && styles.devChipActive]}
                onPress={() => setBoardStatus(s)}
              >
                <Text style={styles.devChipText}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function ActionButton({ label, onPress, color, outline, disabled }: {
  label: string; onPress: () => void; color: string; outline?: boolean; disabled?: boolean;
}) {
  return (
    <TouchableOpacity
      style={[
        styles.actionBtn,
        outline
          ? { borderWidth: 2, borderColor: color, backgroundColor: 'transparent' }
          : { backgroundColor: color },
        disabled && { opacity: 0.5 },
      ]}
      onPress={onPress}
      activeOpacity={0.8}
      disabled={disabled}
    >
      <Text style={[styles.actionBtnText, outline && { color }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, alignItems: 'center',
  },
  handle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: '#DDD', marginBottom: 24,
  },
  boardIcon: {
    width: 64, height: 64, borderRadius: 32, borderWidth: 3,
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  boardInner: { width: 28, height: 20, borderRadius: 4 },
  title: { fontSize: 22, fontWeight: '800', color: '#1A1A2E', marginBottom: 6 },
  status: { fontSize: 15, fontWeight: '500', marginBottom: 4 },
  divider: { height: 1, backgroundColor: '#F0F0F0', alignSelf: 'stretch', marginVertical: 20 },
  actionBtn: {
    alignSelf: 'stretch', borderRadius: 14,
    paddingVertical: 16, alignItems: 'center', marginBottom: 12,
  },
  actionBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },

  // Simulation
  simSection: { alignSelf: 'stretch', marginTop: 4, marginBottom: 16 },
  simTitle: {
    fontSize: 11, fontWeight: '700', color: '#AAA', letterSpacing: 1,
    textAlign: 'center', marginBottom: 12,
  },
  simRow: { flexDirection: 'row', gap: 10 },
  simBtn: {
    flex: 1, backgroundColor: '#F0EEFF', borderRadius: 12,
    paddingVertical: 14, alignItems: 'center',
  },
  simBtnText: { color: '#6B4FBB', fontSize: 14, fontWeight: '700' },

  // Baud rate selector
  baudRow: {
    flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap',
    gap: 6, alignSelf: 'stretch', marginBottom: 12,
  },
  baudLabel: { fontSize: 13, color: '#666', fontWeight: '600' },
  baudChip: {
    paddingHorizontal: 10, paddingVertical: 6,
    backgroundColor: '#F0F0F0', borderRadius: 8,
  },
  baudChipActive: { backgroundColor: '#6B4FBB' },
  baudChipText: { fontSize: 12, color: '#444', fontWeight: '600' },
  baudChipTextActive: { color: '#FFF' },

  // Serial monitor
  monitorSection: { alignSelf: 'stretch', marginBottom: 16 },
  monitorHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6,
  },
  monitorTitle: { fontSize: 11, fontWeight: '700', color: '#AAA', letterSpacing: 1 },
  monitorClear: { fontSize: 11, color: '#6B4FBB', fontWeight: '600' },
  monitorScroll: {
    backgroundColor: '#1A1F2E', borderRadius: 10, height: 100,
  },
  monitorEmpty: { color: 'rgba(255,255,255,0.3)', fontSize: 12, fontStyle: 'italic' },
  monitorLine: { color: '#22C55E', fontSize: 12, fontFamily: 'monospace', lineHeight: 18 },
  monitorHint: {
    fontSize: 11, color: '#999', textAlign: 'center', marginTop: 6, fontStyle: 'italic',
  },

  // Dev status switcher
  devRow: {
    flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap',
    gap: 6, opacity: 0.4,
  },
  devLabel: { fontSize: 11, color: '#666' },
  devChip: {
    paddingHorizontal: 8, paddingVertical: 4,
    backgroundColor: '#EEE', borderRadius: 6,
  },
  devChipActive: { backgroundColor: '#6B4FBB' },
  devChipText: { fontSize: 11, color: '#333', fontWeight: '600' },
});
