import React, { useRef, useState, useCallback } from 'react';
import {
  View, ScrollView, Text, StyleSheet, TouchableOpacity,
  PanResponder, Animated, LayoutChangeEvent,
} from 'react-native';
import { useApp, WorkspaceBlock } from '../context/AppContext';
import CodeBlock from './CodeBlock';
import { CATEGORY_COLORS } from '../data/blocks';

const DOTS_SPACING = 24;

const EXAMPLE_PROGRAM: WorkspaceBlock[] = [
  { id: 'ex_1', defId: 'evt_touch', label: 'quando eu receber toque 1', category: 'Eventos', color: CATEGORY_COLORS['Eventos'] },
  { id: 'ex_2', defId: 'som_1', label: 'toque som meow!', category: 'Som', color: CATEGORY_COLORS['Som'] },
  { id: 'ex_3', defId: 'ctrl_1', label: 'espere 1 segundo', category: 'Controle', color: CATEGORY_COLORS['Controle'] },
  { id: 'ex_4', defId: 'ctrl_2', label: 'repita 3 vezes', category: 'Controle', color: CATEGORY_COLORS['Controle'] },
  { id: 'ex_5', defId: 'luz_4', label: 'ligue LED 3', category: 'Luz', color: CATEGORY_COLORS['Luz'] },
  { id: 'ex_6', defId: 'ctrl_1b', label: 'espere 0.2 segundo', category: 'Controle', color: CATEGORY_COLORS['Controle'] },
];

export default function Workspace() {
  const {
    workspaceBlocks, setWorkspaceBlocks,
    isRunning, usbDisconnectedWhileRunning, setLibraryOpen,
  } = useApp();

  const displayBlocks = workspaceBlocks.length > 0 ? workspaceBlocks : EXAMPLE_PROGRAM;

  // ── Drag state ──────────────────────────────────────────────────────────
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [dropIndex, setDropIndex] = useState<number | null>(null);
  const dragAnim = useRef(new Animated.Value(0)).current;
  const draggingIndexRef = useRef<number | null>(null);
  const itemLayouts = useRef<{ y: number; height: number }[]>([]);
  const scrollOffsetRef = useRef(0);
  const containerYRef = useRef(0);

  const getDropIndex = useCallback((pageY: number): number => {
    const relY = pageY - containerYRef.current + scrollOffsetRef.current;
    for (let i = 0; i < itemLayouts.current.length; i++) {
      const layout = itemLayouts.current[i];
      if (!layout) continue;
      const mid = layout.y + layout.height / 2;
      if (relY < mid) return i;
    }
    return itemLayouts.current.length;
  }, []);

  const makePanResponder = useCallback((index: number) =>
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 4,
      onPanResponderGrant: () => {
        draggingIndexRef.current = index;
        setDraggingIndex(index);
        dragAnim.setValue(0);
      },
      onPanResponderMove: (e, g) => {
        dragAnim.setValue(g.dy);
        setDropIndex(getDropIndex(e.nativeEvent.pageY));
      },
      onPanResponderRelease: (e, g) => {
        const from = draggingIndexRef.current!;
        let to = getDropIndex(e.nativeEvent.pageY);
        // If dragged far right (>120px), treat as delete
        if (g.dx > 120) {
          const blocks = displayBlocks.filter((_, i) => i !== from);
          setWorkspaceBlocks(blocks.length ? blocks : []);
        } else if (to !== from && to !== from + 1) {
          const arr = [...displayBlocks];
          const [moved] = arr.splice(from, 1);
          const insertAt = to > from ? to - 1 : to;
          arr.splice(Math.max(0, insertAt), 0, moved);
          setWorkspaceBlocks(arr);
        }
        setDraggingIndex(null);
        setDropIndex(null);
        dragAnim.setValue(0);
        draggingIndexRef.current = null;
      },
      onPanResponderTerminate: () => {
        setDraggingIndex(null);
        setDropIndex(null);
        dragAnim.setValue(0);
      },
    }),
  [displayBlocks, getDropIndex]);

  const handleDelete = (index: number) => {
    const blocks = displayBlocks.filter((_, i) => i !== index);
    setWorkspaceBlocks(blocks);
  };

  return (
    <View
      style={styles.container}
      onLayout={(e) => { containerYRef.current = e.nativeEvent.layout.y; }}
    >
      {/* Dotted grid */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <DotGrid />
      </View>

      {/* Running bar */}
      {isRunning && !usbDisconnectedWhileRunning && (
        <View style={styles.runningBar} pointerEvents="none" />
      )}

      {/* USB error banner */}
      {usbDisconnectedWhileRunning && (
        <View style={styles.usbBanner}>
          <Text style={styles.usbBannerText}>⚠️  Placa desconectada</Text>
        </View>
      )}

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={(e) => { scrollOffsetRef.current = e.nativeEvent.contentOffset.y; }}
      >
        {displayBlocks.map((block, index) => {
          const panResponder = makePanResponder(index);
          const isDragging = draggingIndex === index;
          const isDropTarget = dropIndex === index;
          const isDropTargetAfter = dropIndex === index + 1;

          return (
            <View
              key={block.id}
              onLayout={(e: LayoutChangeEvent) => {
                itemLayouts.current[index] = {
                  y: e.nativeEvent.layout.y,
                  height: e.nativeEvent.layout.height,
                };
              }}
            >
              {/* Drop indicator above */}
              {isDropTarget && draggingIndex !== null && draggingIndex !== index && (
                <DropIndicator color={displayBlocks[draggingIndex]?.color} />
              )}

              <Animated.View
                style={[
                  styles.blockRow,
                  isDragging && {
                    transform: [{ translateY: dragAnim }],
                    zIndex: 100,
                    opacity: 0.95,
                  },
                ]}
              >
                {/* Drag handle */}
                <View {...panResponder.panHandlers} style={styles.dragHandle}>
                  <View style={styles.dragDot} />
                  <View style={styles.dragDot} />
                  <View style={styles.dragDot} />
                  <View style={styles.dragDot} />
                  <View style={styles.dragDot} />
                  <View style={styles.dragDot} />
                </View>

                {/* Block */}
                <CodeBlock
                  block={block}
                  isFirst={index === 0}
                  isLast={index === displayBlocks.length - 1}
                  isDragging={isDragging}
                />

                {/* Delete button */}
                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() => handleDelete(index)}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                >
                  <Text style={styles.deleteBtnText}>✕</Text>
                </TouchableOpacity>
              </Animated.View>

              {/* Drop indicator below last item */}
              {isDropTargetAfter && draggingIndex !== null && draggingIndex !== index && (
                <DropIndicator color={displayBlocks[draggingIndex]?.color} />
              )}
            </View>
          );
        })}

        {/* Empty state / add hint */}
        {displayBlocks.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Arraste blocos da{'\n'}biblioteca para cá</Text>
          </View>
        )}

        <TouchableOpacity style={styles.addHint} onPress={() => setLibraryOpen(true)}>
          <View style={styles.addIcon}>
            <Text style={styles.addPlus}>+</Text>
          </View>
          <Text style={styles.addText}>Adicionar bloco</Text>
        </TouchableOpacity>

        {/* Drag-to-delete hint */}
        {draggingIndex !== null && (
          <View style={styles.deleteHint}>
            <Text style={styles.deleteHintText}>→ arraste para direita para remover</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function DropIndicator({ color }: { color?: string }) {
  return (
    <View style={[styles.dropIndicator, { backgroundColor: color ?? '#FFF' }]} />
  );
}

function DotGrid() {
  const dots = [];
  for (let row = 0; row < 30; row++) {
    for (let col = 0; col < 18; col++) {
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
    padding: 20,
    paddingBottom: 140,
  },
  blockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dragHandle: {
    width: 20,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 3,
    paddingVertical: 4,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.4,
  },
  dragDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#FFFFFF',
  },
  deleteBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
  deleteBtnText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    fontWeight: '700',
  },
  dropIndicator: {
    height: 4,
    borderRadius: 2,
    marginVertical: 2,
    marginLeft: 28,
    opacity: 0.8,
  },
  runningBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: '#22C55E',
    zIndex: 10,
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
  emptyState: {
    marginTop: 60,
    alignItems: 'center',
  },
  emptyText: {
    color: 'rgba(255,255,255,0.2)',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 28,
  },
  addHint: {
    marginTop: 28,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    opacity: 0.45,
    marginLeft: 28,
  },
  addIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.4)',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addPlus: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 18,
    fontWeight: '600',
  },
  addText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 14,
    fontWeight: '500',
  },
  deleteHint: {
    marginTop: 12,
    marginLeft: 28,
  },
  deleteHintText: {
    color: 'rgba(255,100,100,0.5)',
    fontSize: 12,
    fontWeight: '500',
  },
});
