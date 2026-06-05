import React from 'react';
import {
  Modal, View, Text, TouchableOpacity, StyleSheet, Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp, BoardStatus } from '../context/AppContext';

export default function BoardStatusSheet() {
  const { boardSheetOpen, setBoardSheetOpen, boardStatus, setBoardStatus, isRunning, stopRun, setUsbDisconnectedWhileRunning } = useApp();
  const insets = useSafeAreaInsets();

  const handleDisconnect = () => {
    setBoardStatus('disconnected');
    if (isRunning) {
      stopRun();
      setUsbDisconnectedWhileRunning(true);
    }
    setBoardSheetOpen(false);
  };

  const handleConnect = () => {
    setBoardStatus('connected');
    setUsbDisconnectedWhileRunning(false);
    setBoardSheetOpen(false);
  };

  const handleError = () => {
    setBoardStatus('error');
    setBoardSheetOpen(false);
  };

  const statusLabel =
    boardStatus === 'connected' ? 'Conectada via USB' :
    boardStatus === 'error' ? 'Erro de comunicação com a placa' :
    'Nenhuma placa encontrada';

  const statusColor =
    boardStatus === 'connected' ? '#22C55E' :
    boardStatus === 'error' ? '#EF4444' : '#999';

  return (
    <Modal
      visible={boardSheetOpen}
      transparent
      animationType="slide"
      onRequestClose={() => setBoardSheetOpen(false)}
    >
      <Pressable style={styles.backdrop} onPress={() => setBoardSheetOpen(false)}>
        <Pressable style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
          {/* Handle */}
          <View style={styles.handle} />

          {/* Board icon */}
          <View style={[styles.boardIcon, { borderColor: statusColor }]}>
            <View style={[styles.boardInner, { backgroundColor: statusColor }]} />
          </View>

          <Text style={styles.title}>Placa Pipas</Text>
          <Text style={[styles.status, { color: statusColor }]}>{statusLabel}</Text>

          <View style={styles.divider} />

          {boardStatus === 'connected' && (
            <>
              <ActionButton label="Testar LED" onPress={() => setBoardSheetOpen(false)} color="#9268F6" />
              <ActionButton label="Testar Motor" onPress={() => setBoardSheetOpen(false)} color="#5F95F7" />
              <ActionButton label="Desconectar" onPress={handleDisconnect} color="#EF4444" outline />
            </>
          )}

          {boardStatus === 'disconnected' && (
            <>
              <ActionButton label="Conectar USB" onPress={handleConnect} color="#22C55E" />
              <ActionButton label="Tentar novamente" onPress={handleConnect} color="#5F95F7" outline />
            </>
          )}

          {boardStatus === 'error' && (
            <>
              <ActionButton label="Tentar novamente" onPress={handleConnect} color="#5F95F7" />
              <ActionButton label="Desconectar" onPress={handleDisconnect} color="#EF4444" outline />
            </>
          )}

          {/* Dev switcher */}
          <View style={styles.devRow}>
            <Text style={styles.devLabel}>Simular estado: </Text>
            {(['connected', 'disconnected', 'error'] as BoardStatus[]).map((s) => (
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

function ActionButton({ label, onPress, color, outline }: { label: string; onPress: () => void; color: string; outline?: boolean }) {
  return (
    <TouchableOpacity
      style={[
        styles.actionBtn,
        outline ? { borderWidth: 2, borderColor: color, backgroundColor: 'transparent' } : { backgroundColor: color },
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Text style={[styles.actionBtnText, outline && { color }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    alignItems: 'center',
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#DDD',
    marginBottom: 24,
  },
  boardIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  boardInner: {
    width: 28,
    height: 20,
    borderRadius: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1A1A2E',
    marginBottom: 6,
  },
  status: {
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 4,
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    alignSelf: 'stretch',
    marginVertical: 20,
  },
  actionBtn: {
    alignSelf: 'stretch',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  devRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: 8,
    gap: 6,
    opacity: 0.5,
  },
  devLabel: {
    fontSize: 11,
    color: '#666',
  },
  devChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#EEE',
    borderRadius: 6,
  },
  devChipActive: {
    backgroundColor: '#6B4FBB',
  },
  devChipText: {
    fontSize: 11,
    color: '#333',
    fontWeight: '600',
  },
});
