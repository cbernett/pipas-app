import React, { useRef, useState, useCallback, useEffect } from 'react';
import {
  View, ScrollView, Text, StyleSheet, Animated, LayoutChangeEvent,
} from 'react-native';
import { useApp, WorkspaceBlock } from '../context/AppContext';
import CodeBlock from './CodeBlock';
import { EXAMPLE_PROGRAM } from '../data/blocks';

const DOTS_SPACING = 24;
const TRASH_ZONE_H = 72;

export default function Workspace() {
  const {
    workspaceBlocks, setWorkspaceBlocks,
    isRunning, activeBlockIndex,
    usbDisconnectedWhileRunning,
    tapBlock, triggerScript,
  } = useApp();

  const displayBlocks = workspaceBlocks.length > 0 ? workspaceBlocks : EXAMPLE_PROGRAM;

  // ── Drag state ──────────────────────────────────────────────────────────
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [dropIndex,     setDropIndex]     = useState<number | null>(null);
  const [overTrash,     setOverTrash]     = useState(false);
  const dragAnim           = useRef(new Animated.Value(0)).current;
  const draggingIndexRef   = useRef<number | null>(null);
  const hasMovedRef        = useRef(false);
  const startClientYRef    = useRef(0);
  const itemLayouts        = useRef<{ y: number; height: number }[]>([]);
  const scrollOffsetRef    = useRef(0);
  const containerTopRef    = useRef(0);
  const containerBottomRef = useRef(0);
  const displayBlocksRef   = useRef(displayBlocks);
  useEffect(() => { displayBlocksRef.current = displayBlocks; }, [displayBlocks]);

  const getDropIndex = useCallback((clientY: number): number => {
    const relY = clientY - containerTopRef.current + scrollOffsetRef.current;
    for (let i = 0; i < itemLayouts.current.length; i++) {
      const l = itemLayouts.current[i];
      if (l && relY < l.y + l.height / 2) return i;
    }
    return itemLayouts.current.length;
  }, []);

  const isOverTrash = (clientY: number) =>
    clientY > containerBottomRef.current - TRASH_ZONE_H;

  const cancelDrag = useCallback(() => {
    setDraggingIndex(null);
    setDropIndex(null);
    setOverTrash(false);
    dragAnim.setValue(0);
    draggingIndexRef.current = null;
    hasMovedRef.current = false;
  }, [dragAnim]);

  // Web drag: starts on pointer-down, tracks via window mouse events
  const startDrag = useCallback((index: number, clientY: number) => {
    if (typeof window === 'undefined') return;
    draggingIndexRef.current = index;
    startClientYRef.current = clientY;
    hasMovedRef.current = false;

    const onMove = (e: MouseEvent) => {
      const dy = e.clientY - startClientYRef.current;
      if (!hasMovedRef.current && Math.abs(dy) > 6) {
        hasMovedRef.current = true;
        setDraggingIndex(index);
      }
      if (!hasMovedRef.current) return;
      dragAnim.setValue(dy);
      setOverTrash(isOverTrash(e.clientY));
      setDropIndex(isOverTrash(e.clientY) ? null : getDropIndex(e.clientY));
    };

    const onUp = (e: MouseEvent) => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      if (!hasMovedRef.current) { cancelDrag(); return; }

      const from = draggingIndexRef.current!;
      const blocks = displayBlocksRef.current;

      if (isOverTrash(e.clientY)) {
        setWorkspaceBlocks(blocks.filter((_, i) => i !== from));
      } else {
        const to = getDropIndex(e.clientY);
        if (to !== from && to !== from + 1) {
          const arr = [...blocks];
          const [moved] = arr.splice(from, 1);
          arr.splice(to > from ? to - 1 : to, 0, moved);
          setWorkspaceBlocks(arr);
        }
      }
      cancelDrag();
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [dragAnim, cancelDrag, getDropIndex]);

  // Event block tapped → run the script starting from this block
  const handleEventTap = useCallback((block: WorkspaceBlock, index: number) => {
    triggerScript(displayBlocks.slice(index));
  }, [triggerScript, displayBlocks]);

  // Any block tapped → preview its immediate effect (sound, etc.)
  const handleBlockTap = useCallback((block: WorkspaceBlock) => {
    tapBlock(block);
  }, [tapBlock]);

  return (
    <View
      style={styles.container}
      onLayout={(e) => {
        // Approximate container position — good enough for web prototype
        containerTopRef.current = e.nativeEvent.layout.y;
        containerBottomRef.current = e.nativeEvent.layout.y + e.nativeEvent.layout.height;
      }}
    >
      <View style={StyleSheet.absoluteFill} pointerEvents="none"><DotGrid /></View>

      {/* Running bar */}
      {isRunning && !usbDisconnectedWhileRunning && (
        <View style={styles.runningBar} pointerEvents="none" />
      )}

      {usbDisconnectedWhileRunning && (
        <View style={styles.usbBanner}>
          <Text style={styles.usbBannerText}>⚠️  Placa desconectada</Text>
        </View>
      )}

      {/* "Press play" hint when idle */}
      {!isRunning && (
        <View style={styles.playHint} pointerEvents="none">
          <Text style={styles.playHintText}>▶  clique em jogar para iniciar</Text>
        </View>
      )}

      {/* Listening badge */}
      {isRunning && activeBlockIndex === null && (
        <View style={styles.listeningBadge} pointerEvents="none">
          <View style={styles.listeningDot} />
          <Text style={styles.listeningText}>aguardando toque na placa…</Text>
        </View>
      )}

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        scrollEnabled={draggingIndex === null}
        scrollEventThrottle={16}
        onScroll={(e) => { scrollOffsetRef.current = e.nativeEvent.contentOffset.y; }}
      >
        {displayBlocks.map((block, index) => {
          const isDragging  = draggingIndex === index;
          const isDropBefore = dropIndex === index && draggingIndex !== null && draggingIndex !== index;
          const isDropAfter  = dropIndex === index + 1 && draggingIndex !== null && draggingIndex !== index;

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
              {isDropBefore && <DropLine color={displayBlocks[draggingIndex!]?.color} />}

              <Animated.View
                onStartShouldSetResponder={() => true}
                onResponderGrant={(e) => startDrag(index, e.nativeEvent.pageY)}
                style={isDragging ? [{ transform: [{ translateY: dragAnim }], zIndex: 100 }] : undefined}
              >
                <CodeBlock
                  block={block}
                  isFirst={index === 0}
                  isLast={index === displayBlocks.length - 1}
                  isDragging={isDragging}
                  isActive={activeBlockIndex === index}
                  onEventTap={block.category === 'Eventos'
                    ? () => handleEventTap(block, index)
                    : undefined}
                  onBlockTap={() => handleBlockTap(block)}
                />
              </Animated.View>

              {isDropAfter && <DropLine color={displayBlocks[draggingIndex!]?.color} />}
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
  scrollContent: { padding: 24, paddingBottom: 160, gap: 0 },

  runningBar: {
    position: 'absolute', top: 0, left: 0, right: 0,
    height: 3, backgroundColor: '#22C55E', zIndex: 10,
  },
  usbBanner: {
    backgroundColor: '#EF4444', paddingVertical: 12, paddingHorizontal: 20, zIndex: 20,
  },
  usbBannerText: { color: '#FFF', fontSize: 15, fontWeight: '700', textAlign: 'center' },

  // "Press play" hint
  playHint: {
    position: 'absolute', bottom: 90, left: 0, right: 0,
    alignItems: 'center', zIndex: 5,
  },
  playHintText: {
    color: 'rgba(255,255,255,0.2)', fontSize: 13, fontWeight: '600', letterSpacing: 0.5,
  },

  // Listening badge
  listeningBadge: {
    position: 'absolute', top: 12, right: 16, zIndex: 15,
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(34,197,94,0.15)',
    borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6,
  },
  listeningDot: {
    width: 8, height: 8, borderRadius: 4, backgroundColor: '#22C55E',
  },
  listeningText: { color: '#22C55E', fontSize: 12, fontWeight: '600' },

  dropLine: { height: 4, borderRadius: 2, marginVertical: 3, opacity: 0.85 },

  emptyState: { marginTop: 80, alignItems: 'center' },
  emptyText: {
    color: 'rgba(255,255,255,0.2)', fontSize: 18, fontWeight: '600',
    textAlign: 'center', lineHeight: 28,
  },

  trashZone: {
    position: 'absolute', bottom: 0, left: 0, right: 0, height: TRASH_ZONE_H,
    backgroundColor: 'rgba(60,30,30,0.9)',
    borderTopWidth: 2, borderTopColor: 'rgba(239,68,68,0.4)',
    alignItems: 'center', justifyContent: 'center',
    flexDirection: 'row', gap: 10,
  },
  trashZoneActive: {
    backgroundColor: 'rgba(239,68,68,0.9)', borderTopColor: '#EF4444',
  },
  trashIcon: { fontSize: 20 },
  trashLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: '600' },
});
