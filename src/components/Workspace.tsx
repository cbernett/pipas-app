import React, { useRef, useState, useCallback } from 'react';
import {
  View, ScrollView, Text, StyleSheet, PanResponder,
  Animated, LayoutChangeEvent, Dimensions,
} from 'react-native';
import { useApp, WorkspaceBlock } from '../context/AppContext';
import CodeBlock, { TAB_H } from './CodeBlock';
import { CATEGORY_COLORS } from '../data/blocks';

const { height: SCREEN_H } = Dimensions.get('window');
const DOTS_SPACING = 24;
const TRASH_ZONE_H = 80;

const EXAMPLE_PROGRAM: WorkspaceBlock[] = [
  { id: 'ex_1', defId: 'evt_touch', label: 'quando eu receber toque 1', category: 'Eventos', color: CATEGORY_COLORS['Eventos'] },
  { id: 'ex_2', defId: 'som_1',    label: 'toque som meow!',           category: 'Som',     color: CATEGORY_COLORS['Som'] },
  { id: 'ex_3', defId: 'ctrl_1',   label: 'espere 1 segundo',          category: 'Controle', color: CATEGORY_COLORS['Controle'] },
  { id: 'ex_4', defId: 'ctrl_2',   label: 'repita 3 vezes',            category: 'Controle', color: CATEGORY_COLORS['Controle'] },
  { id: 'ex_5', defId: 'luz_4',    label: 'ligue LED 3',               category: 'Luz',     color: CATEGORY_COLORS['Luz'] },
  { id: 'ex_6', defId: 'ctrl_1b',  label: 'espere 0.2 segundo',        category: 'Controle', color: CATEGORY_COLORS['Controle'] },
];

export default function Workspace() {
  const {
    workspaceBlocks, setWorkspaceBlocks,
    isRunning, activeBlockIndex,
    usbDisconnectedWhileRunning, setLibraryOpen,
  } = useApp();

  const displayBlocks = workspaceBlocks.length > 0 ? workspaceBlocks : EXAMPLE_PROGRAM;

  // ── Drag state ──────────────────────────────────────────────────────────
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [dropIndex, setDropIndex]         = useState<number | null>(null);
  const [overTrash, setOverTrash]         = useState(false);
  const dragAnim                          = useRef(new Animated.Value(0)).current;
  const draggingIndexRef                  = useRef<number | null>(null);
  const itemLayouts                       = useRef<{ y: number; height: number }[]>([]);
  const scrollOffsetRef                   = useRef(0);
  const containerYRef                     = useRef(0);
  const containerHRef                     = useRef(0);

  const getDropIndex = useCallback((pageY: number): number => {
    const relY = pageY - containerYRef.current + scrollOffsetRef.current;
    for (let i = 0; i < itemLayouts.current.length; i++) {
      const l = itemLayouts.current[i];
      if (l && relY < l.y + l.height / 2) return i;
    }
    return itemLayouts.current.length;
  }, []);

  const isOverTrashZone = (pageY: number) =>
    pageY > containerYRef.current + containerHRef.current - TRASH_ZONE_H;

  const makePanResponder = useCallback((index: number) =>
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 5 || Math.abs(g.dx) > 5,
      onPanResponderGrant: () => {
        draggingIndexRef.current = index;
        setDraggingIndex(index);
        setOverTrash(false);
        dragAnim.setValue(0);
      },
      onPanResponderMove: (e, g) => {
        dragAnim.setValue(g.dy);
        const py = e.nativeEvent.pageY;
        setOverTrash(isOverTrashZone(py));
        if (!isOverTrashZone(py)) setDropIndex(getDropIndex(py));
      },
      onPanResponderRelease: (e, g) => {
        const from = draggingIndexRef.current!;
        if (isOverTrashZone(e.nativeEvent.pageY)) {
          // Delete the block
          const next = displayBlocks.filter((_, i) => i !== from);
          setWorkspaceBlocks(next);
        } else {
          let to = getDropIndex(e.nativeEvent.pageY);
          if (to !== from && to !== from + 1) {
            const arr = [...displayBlocks];
            const [moved] = arr.splice(from, 1);
            arr.splice(to > from ? to - 1 : to, 0, moved);
            setWorkspaceBlocks(arr);
          }
        }
        setDraggingIndex(null);
        setDropIndex(null);
        setOverTrash(false);
        dragAnim.setValue(0);
        draggingIndexRef.current = null;
      },
      onPanResponderTerminate: () => {
        setDraggingIndex(null);
        setDropIndex(null);
        setOverTrash(false);
        dragAnim.setValue(0);
      },
    }),
  [displayBlocks, getDropIndex]);

  return (
    <View
      style={styles.container}
      onLayout={(e) => {
        containerYRef.current = e.nativeEvent.layout.y;
        containerHRef.current = e.nativeEvent.layout.height;
      }}
    >
      {/* Dotted grid */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <DotGrid />
      </View>

      {/* Running bar */}
      {isRunning && !usbDisconnectedWhileRunning && (
        <View style={styles.runningBar} pointerEvents="none" />
      )}

      {/* USB banner */}
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
          const isDropTarget = dropIndex === index && draggingIndex !== null && draggingIndex !== index;
          const isDropTargetAfter = dropIndex === index + 1 && draggingIndex !== null && draggingIndex !== index;

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
              {isDropTarget && <DropLine color={displayBlocks[draggingIndex!]?.color} />}

              <Animated.View
                {...panResponder.panHandlers}
                style={[
                  isDragging && {
                    transform: [{ translateY: dragAnim }],
                    zIndex: 100,
                  },
                ]}
              >
                <CodeBlock
                  block={block}
                  isFirst={index === 0}
                  isLast={index === displayBlocks.length - 1}
                  isDragging={isDragging}
                  isActive={activeBlockIndex === index}
                />
              </Animated.View>

              {isDropTargetAfter && <DropLine color={displayBlocks[draggingIndex!]?.color} />}
            </View>
          );
        })}

        {displayBlocks.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Arraste blocos da{'\n'}biblioteca para cá</Text>
          </View>
        )}
      </ScrollView>

      {/* Trash zone — appears while dragging */}
      {draggingIndex !== null && (
        <View style={[styles.trashZone, overTrash && styles.trashZoneActive]}>
          <Text style={styles.trashIcon}>{overTrash ? '🗑️' : '↓'}</Text>
          <Text style={styles.trashLabel}>
            {overTrash ? 'Solte para remover' : 'Arraste aqui para remover'}
          </Text>
        </View>
      )}
    </View>
  );
}

function DropLine({ color }: { color?: string }) {
  return <View style={[styles.dropLine, { backgroundColor: color ?? '#FFF' }]} />;
}

function DotGrid() {
  const dots: React.ReactNode[] = [];
  for (let row = 0; row < 30; row++) {
    for (let col = 0; col < 18; col++) {
      dots.push(
        <View key={`${row}-${col}`} style={{
          position: 'absolute',
          top: row * DOTS_SPACING + 12,
          left: col * DOTS_SPACING + 12,
          width: 3, height: 3, borderRadius: 1.5,
          backgroundColor: 'rgba(255,255,255,0.07)',
        }} />
      );
    }
  }
  return <View style={StyleSheet.absoluteFill}>{dots}</View>;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1A1F2E' },

  scrollContent: {
    padding: 24,
    paddingBottom: 140,
    gap: 0,
  },

  runningBar: {
    position: 'absolute', top: 0, left: 0, right: 0,
    height: 3, backgroundColor: '#22C55E', zIndex: 10,
  },
  usbBanner: {
    backgroundColor: '#EF4444',
    paddingVertical: 12, paddingHorizontal: 20, zIndex: 20,
  },
  usbBannerText: {
    color: '#FFF', fontSize: 15, fontWeight: '700', textAlign: 'center',
  },

  dropLine: {
    height: 4, borderRadius: 2,
    marginVertical: 3,
    opacity: 0.85,
  },

  emptyState: {
    marginTop: 80, alignItems: 'center',
  },
  emptyText: {
    color: 'rgba(255,255,255,0.2)',
    fontSize: 18, fontWeight: '600', textAlign: 'center', lineHeight: 28,
  },

  // Trash zone
  trashZone: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    height: TRASH_ZONE_H,
    backgroundColor: 'rgba(60,30,30,0.85)',
    borderTopWidth: 2,
    borderTopColor: 'rgba(239,68,68,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  trashZoneActive: {
    backgroundColor: 'rgba(239,68,68,0.85)',
    borderTopColor: '#EF4444',
  },
  trashIcon: { fontSize: 22 },
  trashLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14, fontWeight: '600',
  },
});
