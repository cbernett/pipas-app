import React, { useRef, useState, useCallback, useEffect } from 'react';
import {
  View, ScrollView, Text, StyleSheet, Animated, LayoutChangeEvent,
} from 'react-native';
import { useApp, WorkspaceBlock } from '../context/AppContext';
import CodeBlock from './CodeBlock';
import { EXAMPLE_PROGRAM } from '../data/blocks';

const DOTS_SPACING  = 24;
const TRASH_ZONE_H  = 72;
const DRAG_THRESHOLD = 8; // px before drag activates

function isTouchEventBlock(b: WorkspaceBlock) {
  return b.category === 'Eventos' ||
    b.defId === 'evt_touch_1' || b.defId === 'evt_touch_2' || b.defId === 'evt_touch_3' ||
    b.defId === 'luz_1' || b.defId === 'luz_2' || b.defId === 'luz_3'; // backward compat
}

export default function Workspace() {
  const {
    workspaceBlocks, setWorkspaceBlocks,
    activeBlockIndex,
    usbDisconnectedWhileRunning,
    tapBlock, triggerScript,
  } = useApp();

  const displayBlocks    = workspaceBlocks.length > 0 ? workspaceBlocks : EXAMPLE_PROGRAM as WorkspaceBlock[];
  const displayBlocksRef = useRef(displayBlocks);
  useEffect(() => { displayBlocksRef.current = displayBlocks; }, [displayBlocks]);

  // ── Drag visual state ────────────────────────────────────────────────────
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [dropIndex,     setDropIndex]     = useState<number | null>(null);
  const [overTrash,     setOverTrash]     = useState(false);
  const dragAnim = useRef(new Animated.Value(0)).current;

  // ── Layout tracking ──────────────────────────────────────────────────────
  const itemLayouts     = useRef<{ y: number; height: number }[]>([]);
  const scrollOffsetRef = useRef(0);
  const containerRef    = useRef<any>(null);  // DOM element ref (web)
  const containerYRef   = useRef(0);          // fallback for native
  const containerHRef   = useRef(0);

  // ── Flag: suppress tap handler if a drag just completed ─────────────────
  const draggedRecentlyRef = useRef(false);

  // ── Helpers ──────────────────────────────────────────────────────────────
  const getContainerTop = useCallback(() => {
    if (containerRef.current?.getBoundingClientRect) {
      return containerRef.current.getBoundingClientRect().top;
    }
    return containerYRef.current;
  }, []);

  const getDropIndex = useCallback((clientY: number): number => {
    const relY = (clientY - getContainerTop()) + scrollOffsetRef.current;
    for (let i = 0; i < itemLayouts.current.length; i++) {
      const l = itemLayouts.current[i];
      if (l && relY < l.y + l.height / 2) return i;
    }
    return itemLayouts.current.length;
  }, [getContainerTop]);

  const isOverTrashZone = useCallback((clientY: number) => {
    const containerBottom = getContainerTop() + containerHRef.current;
    return clientY > containerBottom - TRASH_ZONE_H;
  }, [getContainerTop]);

  const cancelDrag = useCallback(() => {
    setDraggingIndex(null);
    setDropIndex(null);
    setOverTrash(false);
    dragAnim.setValue(0);
  }, [dragAnim]);

  // ── Pointer-event drag system (web) ──────────────────────────────────────
  useEffect(() => {
    if (typeof document === 'undefined') return; // native: skip

    let activeIdx: number | null = null;
    let startY = 0;
    let moved  = false;

    const getBlockAt = (clientY: number): number | null => {
      const relY = (clientY - getContainerTop()) + scrollOffsetRef.current;
      for (let i = 0; i < itemLayouts.current.length; i++) {
        const l = itemLayouts.current[i];
        if (l && relY >= l.y && relY < l.y + l.height) return i;
      }
      return null;
    };

    const onDown = (e: PointerEvent) => {
      const idx = getBlockAt(e.clientY);
      if (idx === null) return;
      activeIdx = idx;
      startY    = e.clientY;
      moved     = false;
    };

    const onMove = (e: PointerEvent) => {
      if (activeIdx === null) return;
      const dy = e.clientY - startY;
      if (!moved && Math.abs(dy) > DRAG_THRESHOLD) {
        moved = true;
        setDraggingIndex(activeIdx);
      }
      if (!moved) return;
      dragAnim.setValue(dy);
      setOverTrash(isOverTrashZone(e.clientY));
      setDropIndex(isOverTrashZone(e.clientY) ? null : getDropIndex(e.clientY));
    };

    const onUp = (e: PointerEvent) => {
      if (activeIdx === null) return;
      const from = activeIdx;
      activeIdx  = null;

      if (!moved) return; // tap — let TouchableOpacity handle it normally

      // It was a drag — suppress any subsequent tap event
      draggedRecentlyRef.current = true;
      setTimeout(() => { draggedRecentlyRef.current = false; }, 150);

      const blocks = displayBlocksRef.current;
      if (isOverTrashZone(e.clientY)) {
        setWorkspaceBlocks(blocks.filter((_, i) => i !== from));
      } else {
        const to = getDropIndex(e.clientY);
        if (to !== from && to !== from + 1) {
          const arr = [...blocks];
          const [m]  = arr.splice(from, 1);
          arr.splice(to > from ? to - 1 : to, 0, m);
          setWorkspaceBlocks(arr);
        }
      }
      cancelDrag();
      moved = false;
    };

    document.addEventListener('pointerdown', onDown);
    document.addEventListener('pointermove', onMove);
    document.addEventListener('pointerup',   onUp);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerup',   onUp);
    };
  }, [dragAnim, cancelDrag, getDropIndex, isOverTrashZone, setWorkspaceBlocks]);

  // ── Tap handlers ─────────────────────────────────────────────────────────
  const handleEventTap = useCallback((block: WorkspaceBlock, index: number) => {
    if (draggedRecentlyRef.current) return;
    triggerScript(displayBlocksRef.current.slice(index));
  }, [triggerScript]);

  const handleBlockTap = useCallback((block: WorkspaceBlock) => {
    if (draggedRecentlyRef.current) return;
    tapBlock(block);
  }, [tapBlock]);

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <View
      ref={containerRef}
      style={styles.container}
      onLayout={(e) => {
        containerYRef.current = e.nativeEvent.layout.y;
        containerHRef.current = e.nativeEvent.layout.height;
      }}
    >
      <View style={StyleSheet.absoluteFill} pointerEvents="none"><DotGrid /></View>

      {activeBlockIndex !== null && !usbDisconnectedWhileRunning && (
        <View style={styles.runningBar} pointerEvents="none" />
      )}

      {usbDisconnectedWhileRunning && (
        <View style={styles.usbBanner}>
          <Text style={styles.usbBannerText}>⚠️  Placa desconectada</Text>
        </View>
      )}

      {activeBlockIndex === null && !usbDisconnectedWhileRunning && (
        <View style={styles.listeningBadge} pointerEvents="none">
          <View style={styles.listeningDot} />
          <Text style={styles.listeningText}>toque na placa para iniciar</Text>
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
          const isDragging   = draggingIndex === index;
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

              {/* No responder props — pointer events handle drag, TouchableOpacity handles tap */}
              <Animated.View
                style={isDragging
                  ? { transform: [{ translateY: dragAnim }], zIndex: 100 }
                  : undefined}
              >
                <CodeBlock
                  block={block}
                  isFirst={index === 0}
                  isLast={index === displayBlocks.length - 1}
                  isDragging={isDragging}
                  isActive={activeBlockIndex === index}
                  onEventTap={isTouchEventBlock(block)
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

  listeningBadge: {
    position: 'absolute', top: 12, right: 16, zIndex: 15,
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(34,197,94,0.15)',
    borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6,
  },
  listeningDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#22C55E' },
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
  trashZoneActive: { backgroundColor: 'rgba(239,68,68,0.9)', borderTopColor: '#EF4444' },
  trashIcon:  { fontSize: 20 },
  trashLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: '600' },
});
