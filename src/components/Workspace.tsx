import React, { useRef, useState, useCallback, useEffect } from 'react';
import { View, ScrollView, Text, StyleSheet, Animated } from 'react-native';
import { useApp, WorkspaceBlock, BlockStack } from '../context/AppContext';
import CodeBlock, { TAB_W, TAB_H } from './CodeBlock';
import { EXAMPLE_STACKS, CATEGORY_COLORS } from '../data/blocks';

const DOTS    = 24;
const CANVAS_W = 2000;
const CANVAS_H = 1600;
const SNAP_D   = 50; // px — snap detection radius
const TAB_OFFSET = 16; // left offset of bottom tab on each block

function isTouchEvent(b: WorkspaceBlock) {
  return b.category === 'Eventos' ||
    b.defId === 'evt_touch_1' || b.defId === 'evt_touch_2' || b.defId === 'evt_touch_3' ||
    b.defId === 'luz_1' || b.defId === 'luz_2' || b.defId === 'luz_3';
}

export default function Workspace() {
  const {
    stacks, setStacks,
    activeBlockId,
    usbDisconnectedWhileRunning,
    tapBlock, triggerScript,
  } = useApp();

  const displayStacks = stacks.length > 0 ? stacks : EXAMPLE_STACKS;

  // ── Drag state ──────────────────────────────────────────────────────────
  const [draggingId, setDraggingId]     = useState<string | null>(null);
  const [snapTargetId, setSnapTargetId] = useState<string | null>(null);
  const dragAnimX = useRef(new Animated.Value(0)).current;
  const dragAnimY = useRef(new Animated.Value(0)).current;

  // Refs for drag logic (avoid stale closures in event listeners)
  const stacksRef        = useRef(displayStacks);
  const draggingIdRef    = useRef<string | null>(null);
  const startMouseRef    = useRef({ x: 0, y: 0 });
  const startStackRef    = useRef({ x: 0, y: 0 });
  const hasMovedRef      = useRef(false);
  const draggedRecentRef = useRef(false);
  const stackHeights     = useRef<Record<string, number>>({});
  const canvasRef        = useRef<any>(null);
  const scrollRef        = useRef<ScrollView>(null);
  const scrollOffsetRef  = useRef({ x: 0, y: 0 });

  useEffect(() => { stacksRef.current = displayStacks; }, [displayStacks]);

  // ── Snap helpers ────────────────────────────────────────────────────────
  const getSnapReceptor = (stack: BlockStack) => ({
    x: stack.x + TAB_OFFSET,
    y: stack.y + (stackHeights.current[stack.id] ?? 200),
  });

  const findSnapTarget = useCallback((dragStack: BlockStack, newX: number, newY: number) => {
    const emitterY = newY; // top of dragged stack
    const emitterX = newX + TAB_OFFSET;

    for (const s of stacksRef.current) {
      if (s.id === dragStack.id) continue;
      const rec = getSnapReceptor(s);
      const dx = Math.abs(emitterX - rec.x);
      const dy = Math.abs(emitterY - rec.y);
      if (dx < SNAP_D && dy < SNAP_D) return s.id;
    }
    return null;
  }, []);

  // ── Pointer drag system ─────────────────────────────────────────────────
  useEffect(() => {
    if (typeof document === 'undefined') return;

    let activeStackId: string | null = null;
    let moved = false;

    const getCanvasOffset = () => {
      if (canvasRef.current?.getBoundingClientRect) {
        const r = canvasRef.current.getBoundingClientRect();
        return { x: r.left, y: r.top };
      }
      return { x: 0, y: 0 };
    };

    const getStackAt = (clientX: number, clientY: number): BlockStack | null => {
      const off = getCanvasOffset();
      const cx  = clientX - off.x + scrollOffsetRef.current.x;
      const cy  = clientY - off.y + scrollOffsetRef.current.y;

      // Check from top (last rendered = topmost) to bottom
      for (let i = stacksRef.current.length - 1; i >= 0; i--) {
        const s = stacksRef.current[i];
        const h = stackHeights.current[s.id] ?? 200;
        if (cx >= s.x && cx <= s.x + 300 && cy >= s.y && cy <= s.y + h) return s;
      }
      return null;
    };

    const onDown = (e: PointerEvent) => {
      const stack = getStackAt(e.clientX, e.clientY);
      if (!stack) return;
      activeStackId = stack.id;
      draggingIdRef.current = stack.id;
      startMouseRef.current = { x: e.clientX, y: e.clientY };
      startStackRef.current = { x: stack.x, y: stack.y };
      moved = false;
      dragAnimX.setValue(stack.x);
      dragAnimY.setValue(stack.y);
    };

    const onMove = (e: PointerEvent) => {
      if (!activeStackId) return;
      const dx = e.clientX - startMouseRef.current.x;
      const dy = e.clientY - startMouseRef.current.y;

      if (!moved && Math.abs(dx) + Math.abs(dy) > 8) {
        moved = true;
        setDraggingId(activeStackId);
      }
      if (!moved) return;

      const newX = startStackRef.current.x + dx;
      const newY = startStackRef.current.y + dy;
      dragAnimX.setValue(newX);
      dragAnimY.setValue(newY);

      const dragStack = stacksRef.current.find(s => s.id === activeStackId);
      if (dragStack) {
        const snap = findSnapTarget(dragStack, newX, newY);
        setSnapTargetId(snap);
      }
    };

    const onUp = (e: PointerEvent) => {
      const sid = activeStackId;
      activeStackId = null;
      if (!sid) return;

      if (!moved) return; // tap — let TouchableOpacity handle it

      draggedRecentRef.current = true;
      setTimeout(() => { draggedRecentRef.current = false; }, 150);

      const dx = e.clientX - startMouseRef.current.x;
      const dy = e.clientY - startMouseRef.current.y;
      const newX = startStackRef.current.x + dx;
      const newY = startStackRef.current.y + dy;

      const current = stacksRef.current;
      const dragStack = current.find((s: BlockStack) => s.id === sid);
      if (dragStack) {
        const snapId = findSnapTarget(dragStack, newX, newY);
        if (snapId) {
          setStacks(
            current
              .filter((s: BlockStack) => s.id !== sid)
              .map((s: BlockStack) => s.id === snapId
                ? { ...s, blocks: [...s.blocks, ...dragStack.blocks] }
                : s
              )
          );
        } else {
          setStacks(current.map((s: BlockStack) => s.id === sid ? { ...s, x: newX, y: newY } : s));
        }
      }

      setDraggingId(null);
      setSnapTargetId(null);
      draggingIdRef.current = null;
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
  }, [dragAnimX, dragAnimY, setStacks, findSnapTarget]);

  // ── Tap handlers ────────────────────────────────────────────────────────
  const handleEventTap = useCallback((block: WorkspaceBlock, stackBlocks: WorkspaceBlock[], blockIdx: number) => {
    if (draggedRecentRef.current) return;
    triggerScript(stackBlocks.slice(blockIdx));
  }, [triggerScript]);

  const handleBlockTap = useCallback((block: WorkspaceBlock) => {
    if (draggedRecentRef.current) return;
    tapBlock(block);
  }, [tapBlock]);

  return (
    <View style={styles.root}>
      {activeBlockId !== null && !usbDisconnectedWhileRunning && (
        <View style={styles.runningBar} pointerEvents="none" />
      )}
      {usbDisconnectedWhileRunning && (
        <View style={styles.usbBanner}>
          <Text style={styles.usbBannerText}>⚠️  Placa desconectada</Text>
        </View>
      )}
      {activeBlockId === null && !usbDisconnectedWhileRunning && (
        <View style={styles.listeningBadge} pointerEvents="none">
          <View style={styles.listeningDot} />
          <Text style={styles.listeningText}>toque na placa para iniciar</Text>
        </View>
      )}

      <ScrollView
        ref={scrollRef}
        horizontal
        style={{ flex: 1 }}
        contentContainerStyle={{ width: CANVAS_W }}
        scrollEventThrottle={16}
        scrollEnabled={draggingId === null}
        onScroll={e => { scrollOffsetRef.current.x = e.nativeEvent.contentOffset.x; }}
      >
        <ScrollView
          contentContainerStyle={{ height: CANVAS_H }}
          scrollEventThrottle={16}
          scrollEnabled={draggingId === null}
          onScroll={e => { scrollOffsetRef.current.y = e.nativeEvent.contentOffset.y; }}
        >
          <View ref={canvasRef} style={styles.canvas}>
            <DotGrid />

            {displayStacks.map(stack => {
              const isDragging = draggingId === stack.id;
              const isSnap     = snapTargetId === stack.id;

              return (
                <Animated.View
                  key={stack.id}
                  onLayout={e => { stackHeights.current[stack.id] = e.nativeEvent.layout.height; }}
                  style={[
                    styles.stackPos,
                    isDragging
                      ? { left: dragAnimX, top: dragAnimY, zIndex: 100 }
                      : { left: stack.x, top: stack.y },
                    isSnap && styles.snapHighlight,
                  ]}
                >
                  {stack.blocks.map((block, bi) => (
                    <CodeBlock
                      key={block.id}
                      block={block}
                      isFirst={bi === 0}
                      isLast={bi === stack.blocks.length - 1}
                      isDragging={isDragging}
                      isActive={activeBlockId === block.id}
                      onEventTap={isTouchEvent(block)
                        ? () => handleEventTap(block, stack.blocks, bi)
                        : undefined}
                      onBlockTap={() => handleBlockTap(block)}
                    />
                  ))}
                </Animated.View>
              );
            })}
          </View>
        </ScrollView>
      </ScrollView>
    </View>
  );
}

function DotGrid() {
  const cols = Math.ceil(CANVAS_W / 24);
  const rows = Math.ceil(CANVAS_H / 24);
  const dots: React.ReactNode[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      dots.push(<View key={`${r}-${c}`} style={[styles.dot, { top: r * 24 + 12, left: c * 24 + 12 }]} />);
    }
  }
  return <>{dots}</>;
}

const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: '#1A1F2E' },
  canvas: { width: CANVAS_W, height: CANVAS_H, position: 'relative' },

  stackPos: { position: 'absolute' },
  snapHighlight: {
    shadowColor: '#FFF', shadowOpacity: 0.8, shadowRadius: 10,
    borderRadius: 10,
  },

  dot: {
    position: 'absolute', width: 3, height: 3, borderRadius: 1.5,
    backgroundColor: 'rgba(255,255,255,0.07)',
  },

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
  listeningDot:  { width: 8, height: 8, borderRadius: 4, backgroundColor: '#22C55E' },
  listeningText: { color: '#22C55E', fontSize: 12, fontWeight: '600' },
});
