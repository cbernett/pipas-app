import React, { useState, useEffect, useRef } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Pressable, Alert, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp, BoardStatus } from '../context/AppContext';
import { board } from '../serial';

const MAX_LOG = 60;

export default function BoardStatusSheet() {
  const {
    boardSheetOpen, setBoardSheetOpen,
    boardStatus, setBoardStatus,
    activeBlockId, stopRun,
    setUsbDisconnectedWhileRunning,
  } = useApp();
  const insets = useSafeAreaInsets();
  const [connecting, setConnecting] = useState(false);
  const [serialLog, setSerialLog]   = useState<string[]>([]);
  const logScrollRef = useRef<ScrollView>(null);

  // Always subscribed — log persists across open/close
  useEffect(() => {
    return board.onRawLine((line) => {
      setSerialLog(prev => {
        const next = [...prev, line];
        return next.length > MAX_LOG ? next.slice(-MAX_LOG) : next;
      });
      setTimeout(() => logScrollRef.current?.scrollToEnd({ animated: true }), 60);
    });
  }, []);

  const handleConnect = async () => {
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
    if (activeBlockId !== null) {
      stopRun();
      setUsbDisconnectedWhileRunning(true);
    }
    setBoardSheetOpen(false);
  };

  const statusLabel =
    boardStatus === 'connected' ? 'Conectada via USB' :
    boardStatus === 'error'     ? 'Erro de comunicação com a placa' :
                                  'Nenhuma placa encontrada';

  const statusColor =
    boardStatus === 'connected' ? '#22C55E' :
    boardStatus === 'error'     ? '#EF4444' : 'rgba(255,255,255,0.4)';

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

          <Text style={styles.title}>Placa Pipas</Text>
          <Text style={[styles.status, { color: statusColor }]}>{statusLabel}</Text>

          <View style={styles.divider} />

          {/* Actions based on status */}
          {boardStatus === 'connected' && (
            <>
              <ActionButton label="Testar LED"    color="#9268F6" onPress={() => board.sendCommand(1, 1)} />
              <ActionButton label="Testar Motor"  color="#5F95F7" onPress={() => board.sendCommand(2, 1)} />
              <ActionButton label="Desconectar"   color="#EF4444" outline onPress={handleDisconnect} />
            </>
          )}
          {boardStatus === 'disconnected' && (
            <ActionButton
              label={connecting ? 'Conectando…' : 'Conectar Placa'}
              color="#22C55E"
              onPress={handleConnect}
              disabled={connecting}
            />
          )}
          {boardStatus === 'error' && (
            <ActionButton label="Desconectar" color="#EF4444" outline onPress={handleDisconnect} />
          )}

          {/* Serial monitor */}
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
    flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#1C1F2B',
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)',
    padding: 24, alignItems: 'center',
  },
  handle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.2)', marginBottom: 24,
  },
  title: { fontSize: 22, fontWeight: '800', color: '#FFFFFF', marginBottom: 6 },
  status: { fontSize: 15, fontWeight: '500', marginBottom: 4 },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignSelf: 'stretch',
    marginVertical: 20,
  },
  actionBtn: {
    alignSelf: 'stretch', borderRadius: 14,
    paddingVertical: 16, alignItems: 'center', marginBottom: 12,
  },
  actionBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },

  // Serial monitor
  monitorSection: { alignSelf: 'stretch', marginTop: 4 },
  monitorHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6,
  },
  monitorTitle: { fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.4)', letterSpacing: 1 },
  monitorClear: { fontSize: 11, color: '#9268F6', fontWeight: '600' },
  monitorScroll: {
    backgroundColor: '#0D1117', borderRadius: 10, height: 100,
  },
  monitorEmpty: { color: 'rgba(255,255,255,0.3)', fontSize: 12, fontStyle: 'italic' },
  monitorLine: { color: '#22C55E', fontSize: 12, fontFamily: 'monospace', lineHeight: 18 },
});
