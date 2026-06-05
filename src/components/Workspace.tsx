import React from 'react';
import { ScrollView, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useApp } from '../context/AppContext';
import CodeBlock from './CodeBlock';
import { CATEGORY_COLORS } from '../data/blocks';

// The example program shown in the workspace
const EXAMPLE_PROGRAM = [
  { id: 'ex_1', defId: 'evt_touch', label: 'quando eu receber toque 1', category: 'Eventos', color: CATEGORY_COLORS['Eventos'] },
  { id: 'ex_2', defId: 'som_1', label: 'toque som meow!', category: 'Som', color: CATEGORY_COLORS['Som'] },
  { id: 'ex_3', defId: 'ctrl_1', label: 'espere 1 segundo', category: 'Controle', color: CATEGORY_COLORS['Controle'] },
  { id: 'ex_4', defId: 'ctrl_2', label: 'repita 3 vezes', category: 'Controle', color: CATEGORY_COLORS['Controle'] },
  { id: 'ex_5', defId: 'luz_4', label: 'ligue LED 3', category: 'Luz', color: CATEGORY_COLORS['Luz'] },
  { id: 'ex_6', defId: 'ctrl_1b', label: 'espere 0.2 segundo', category: 'Controle', color: CATEGORY_COLORS['Controle'] },
];

const DOTS_SPACING = 24;

export default function Workspace() {
  const { workspaceBlocks, isRunning, usbDisconnectedWhileRunning, setLibraryOpen } = useApp();

  const displayBlocks = workspaceBlocks.length > 0 ? workspaceBlocks : EXAMPLE_PROGRAM;
  const isEmpty = workspaceBlocks.length === 0 && false; // always show example

  return (
    <View style={styles.container}>
      {/* Dotted grid background */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <DotGrid />
      </View>

      {/* Running pulse overlay */}
      {isRunning && !usbDisconnectedWhileRunning && (
        <View style={styles.runningOverlay} pointerEvents="none">
          <View style={styles.runningPulse} />
        </View>
      )}

      {/* USB disconnected banner */}
      {usbDisconnectedWhileRunning && (
        <View style={styles.usbBanner}>
          <Text style={styles.usbBannerText}>⚠️  Placa desconectada</Text>
        </View>
      )}

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {displayBlocks.map((block, index) => (
          <View key={block.id} style={[
            styles.blockWrapper,
            index > 0 && styles.blockConnected,
          ]}>
            <CodeBlock
              block={block}
              isFirst={index === 0}
              isLast={index === displayBlocks.length - 1}
              isConnected={index > 0}
              indentLevel={
                block.category === 'Luz' && index > 3 ? 1 :
                block.category === 'Controle' && block.label.includes('espere') && index > 3 ? 1 : 0
              }
            />
          </View>
        ))}

        {/* Add block hint */}
        <TouchableOpacity style={styles.addBlockHint} onPress={() => setLibraryOpen(true)}>
          <View style={styles.addBlockIcon}>
            <Text style={styles.addBlockPlus}>+</Text>
          </View>
          <Text style={styles.addBlockText}>Adicionar bloco</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

function DotGrid() {
  const dots = [];
  for (let row = 0; row < 40; row++) {
    for (let col = 0; col < 20; col++) {
      dots.push(
        <View
          key={`${row}-${col}`}
          style={{
            position: 'absolute',
            top: row * DOTS_SPACING + 12,
            left: col * DOTS_SPACING + 12,
            width: 3,
            height: 3,
            borderRadius: 1.5,
            backgroundColor: 'rgba(255,255,255,0.07)',
          }}
        />
      );
    }
  }
  return <View style={StyleSheet.absoluteFill}>{dots}</View>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1F2E',
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 120,
    gap: 2,
  },
  blockWrapper: {
    marginBottom: 0,
  },
  blockConnected: {
    marginTop: -2,
  },
  runningOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    zIndex: 10,
  },
  runningPulse: {
    height: 3,
    backgroundColor: '#22C55E',
    opacity: 0.9,
  },
  usbBanner: {
    backgroundColor: '#EF4444',
    paddingVertical: 12,
    paddingHorizontal: 20,
    zIndex: 20,
  },
  usbBannerText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
  },
  addBlockHint: {
    marginTop: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    opacity: 0.5,
  },
  addBlockIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.4)',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBlockPlus: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 18,
    fontWeight: '600',
  },
  addBlockText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 14,
    fontWeight: '500',
  },
});
