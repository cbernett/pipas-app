import React from 'react';
import { TouchableOpacity, View, StyleSheet } from 'react-native';
import { useApp } from '../context/AppContext';
import { CATEGORY_COLORS } from '../data/blocks';

// The same example program used in Workspace (kept in sync)
const EXAMPLE_PROGRAM = [
  { id: 'ex_1', defId: 'evt_touch', label: 'quando eu receber toque 1', category: 'Eventos', color: CATEGORY_COLORS['Eventos'] },
  { id: 'ex_2', defId: 'som_1', label: 'toque som meow!', category: 'Som', color: CATEGORY_COLORS['Som'] },
  { id: 'ex_3', defId: 'ctrl_1', label: 'espere 1 segundo', category: 'Controle', color: CATEGORY_COLORS['Controle'] },
  { id: 'ex_4', defId: 'ctrl_2', label: 'repita 3 vezes', category: 'Controle', color: CATEGORY_COLORS['Controle'] },
  { id: 'ex_5', defId: 'luz_4', label: 'ligue LED 3', category: 'Luz', color: CATEGORY_COLORS['Luz'] },
  { id: 'ex_6', defId: 'ctrl_1b', label: 'espere 0.2 segundo', category: 'Controle', color: CATEGORY_COLORS['Controle'] },
];

export default function RunButton() {
  const { isRunning, startRun, stopRun, workspaceBlocks } = useApp();

  const handlePress = () => {
    if (isRunning) {
      stopRun();
    } else {
      const blocks = workspaceBlocks.length > 0 ? workspaceBlocks : EXAMPLE_PROGRAM;
      startRun(blocks);
    }
  };

  return (
    <TouchableOpacity
      style={styles.button}
      onPress={handlePress}
      activeOpacity={0.85}
    >
      {isRunning ? (
        <View style={styles.stopContainer}>
          <View style={styles.stopBar} />
          <View style={styles.stopBar} />
        </View>
      ) : (
        <View style={styles.playTriangle} />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#6B4FBB',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6B4FBB',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
  },
  playTriangle: {
    width: 0,
    height: 0,
    borderTopWidth: 8,
    borderBottomWidth: 8,
    borderLeftWidth: 14,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderLeftColor: '#FFFFFF',
    marginLeft: 3,
  },
  stopContainer: {
    flexDirection: 'row',
    gap: 4,
  },
  stopBar: {
    width: 4,
    height: 14,
    backgroundColor: '#FFFFFF',
    borderRadius: 2,
  },
});
