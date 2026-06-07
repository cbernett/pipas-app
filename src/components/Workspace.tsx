import React, { useRef, useState, useCallback, useEffect } from 'react';
import { View, ScrollView, Text, StyleSheet, Animated } from 'react-native';
import { useApp, WorkspaceBlock, BlockStack } from '../context/AppContext';
import CodeBlock, { TAB_H, TAB_OFFSET } from './CodeBlock';
import { EXAMPLE_STACKS } from '../data/blocks';

const CANVAS_W   = 2200;
const CANVAS_H   = 1800;
const DOTS       = 24;
const SNAP_D     = 56;   // snap detection radius in px
const DRAG_MIN   = 8;    // min movement to activate drag

function isTouchEvent(b: WorkspaceBlock) {
  return b.category === 'Eventos' ||
    b.defId === 'evt_touch_1' || b.defId === 'evt_touch_2' || b.defId === 'evt_touch_3' ||
    b.defId === 'luz_1' || b.defId === 'luz_2' || b.defId === 'luz_3';
}

export default function Workspace() {
  const { stacks, setStacks, activeBlockId, usbDisconnectedWhileRunning, tapBlock, triggerScript } = useApp();
  const displayStacks = stacks.length > 0 ? stacks : EXAMPLE_STACKS;

  // ── Drag/snap state ─────────────────────────────────────────────────────
  const [draggingId,    setDraggingId]    = useState<string | null>(null);
  const [snapTargetId,  setSnapTargetId]  = useState<string | null>(null);
  const [snapPreviewPos, setSnapPreviewPos] = useState<{ x: number; y: number } | null>(null);
  const dragAnimX = useRef(new Animated.Value(0)).current;
  const dragAnimY = useRef(new Animated.Value(0)).current;

  // ── Refs (sync, no re-render needed) ───────────────────────────────────
  const localStacksRef  = useRef<BlockStack[]>(displayStacks);
  const draggingIdRef   = useRef<string | null>(null);
  const pendingDrag     = useRef<{
    stackId: string;
    blockIdx: number;
    startMouse: { x: number; y: number };
    startPos: { x: number; y: number };
  } | null>(null);
  const hasMovedRef     = useRef(false);
  const draggedRecently = useRef(false);
  const stackHeightsRef = useRef<Record<string, number>>({});          // total stack height
  const blockHeightsRef = useRef<Record<string, number[]>>({});        // [block heights] per stack
  const canvasRef       = useRef<any>(null);
  const scrollOffset    = useRef({ x: 0, y: 0 });

  useEffect(() => { localStacksRef.current = displayStacks; }, [displayStacks]);

  // ── Canvas offset helper ────────────────────────────────────────────────
  const canvasTopLeft = useCallback((): { x: number; y: number } => {
    if (canvasRef.current?.getBoundingClientRect) {
      const r = canvasRef.current.getBoundingClientRect();
      return { x: r.left, y: r.top };
    }
    return { x: 0, y: 0 };
  }, []);

  // Convert clientXY → canvas coords (accounting for scroll)
  const toCanvas = useCallback((cx: number, cy: number) => {
    const off = canvasTopLeft();
    return {
      x: cx - off.x + scrollOffset.current.x,
      y: cy - off.y + scrollOffset.current.y,
    };
  }, [canvasTopLeft]);

  // ── Snap detection ──────────────────────────────────────────────────────
  const findSnap = useCallback((dragStack: BlockStack, dragX: number, dragY: number): { id: string; y: number } | null => {
    // Dragged stack's TOP connector position
    const emX = dragX + TAB_OFFSET + 8;
    const emY = dragY;

    for (const s of localStacksRef.current) {
      if (s.id === dragStack.id) continue;
      // Target stack's BOTTOM connector position
      const h = stackHeightsRef.current[s.id] ?? 200;
      const recX = s.x + TAB_OFFSET + 8;
      const recY = s.y + h;
      if (Math.abs(emX - recX) < SNAP_D && Math.abs(emY - recY) < SNAP_D) {
        return { id: s.id, y: recY };
      }
    }
    return null;
  }, []);

  // ── Block index hit-test within a stack ─────────────────────────────────
  const blockIdxAt = useCallback((stackId: string, relY: number): number => {
    const heights = blockHeightsRef.current[stackId] ?? [];
    let acc = 0;
    for (let i = 0; i < heights.length; i++) {
      // Each block after the first overlaps by TAB_H due to negative marginTop
      const h = i === 0 ? (heights[i] ?? 58) : ((heights[i] ?? 58) - TAB_H);
      if (relY < acc + h) return i;
      acc += h;
    }
    return Math.max(0, heights.length - 1);
  }, []);

  // ── Stack hit test ───────────────────────────────────────────────────────
  const stackAt = useCallback((cx: number, cy: number): { stack: BlockStack; relY: number } | null => {
    const canvas = toCanvas(cx, cy);
    // Iterate reverse so topmost (last rendered) wins
    const stks = localStacksRef.current;
    for (let i = stks.length - 1; i >= 0; i--) {
      const s   = stks[i];
      const h   = stackHeightsRef.current[s.id] ?? 200;
      const relY = canvas.y - s.y;
      const relX = canvas.x - s.x;
      if (relX >= -10 && relX <= 400 && relY >= 0 && relY <= h) {
        return { stack: s, relY };
      }
    }
    return null;
  }, [toCanvas]);

  // ── Pointer event system ─────────────────────────────────────────────────
  useEffect(() => {
    if (typeof document === 'undefined') return;

    const onDown = (e: PointerEvent) => {
      const hit = stackAt(e.clientX, e.clientY);
      if (!hit) return;
      const { stack, relY } = hit;
      const blockIdx = blockIdxAt(stack.id, relY);

      pendingDrag.current = {
        stackId:    stack.id,
        blockIdx,
        startMouse: { x: e.clientX, y: e.clientY },
        startPos:   { x: stack.x,   y: stack.y + accumHeight(stack.id, blockIdx) },
      };
      hasMovedRef.current = false;
    };

    const onMove = (e: PointerEvent) => {
      if (!pendingDrag.current) return;
      const { stackId, blockIdx, startMouse, startPos } = pendingDrag.current;
      const dx = e.clientX - startMouse.x;
      const dy = e.clientY - startMouse.y;

      if (!hasMovedRef.current && Math.abs(dx) + Math.abs(dy) > DRAG_MIN) {
        hasMovedRef.current = true;

        // ── Split the stack if dragging from a non-first block ──────────
        const stks = localStacksRef.current;
        const origStack = stks.find(s => s.id === stackId);
        if (!origStack) return;

        let dragStackId = stackId;

        if (blockIdx > 0) {
          // Create sub-stack for blocks from blockIdx onwards
          const newId = `split_${Date.now()}`;
          dragStackId  = newId;
          const newStack: BlockStack = {
            id: newId,
            x:  origStack.x,
            y:  origStack.y + accumHeight(origStack.id, blockIdx),
            blocks: origStack.blocks.slice(blockIdx),
          };
          const topStack = { ...origStack, blocks: origStack.blocks.slice(0, blockIdx) };
          const next = stks
            .map((s: BlockStack) => s.id === stackId ? topStack : s)
            .concat([newStack]);
          localStacksRef.current = next;
          setStacks(next);
          pendingDrag.current = { ...pendingDrag.current, stackId: newId, blockIdx: 0,
            startPos: { x: newStack.x, y: newStack.y } };
        }

        draggingIdRef.current = dragStackId;
        setDraggingId(dragStackId);

        const ds = localStacksRef.current.find(s => s.id === dragStackId);
        if (ds) { dragAnimX.setValue(ds.x); dragAnimY.setValue(ds.y); }
      }

      if (!hasMovedRef.current) return;

      const { startPos: sp, stackId: dsId } = pendingDrag.current;
      const newX = sp.x + dx;
      const newY = sp.y + dy;
      dragAnimX.setValue(newX);
      dragAnimY.setValue(newY);

      const dragStack = localStacksRef.current.find(s => s.id === dsId);
      if (dragStack) {
        const snap = findSnap(dragStack, newX, newY);
        setSnapTargetId(snap?.id ?? null);
        setSnapPreviewPos(snap ? {
          x: localStacksRef.current.find(s => s.id === snap.id)?.x ?? newX,
          y: snap.y,
        } : null);
      }
    };

    const onUp = (e: PointerEvent) => {
      const pd = pendingDrag.current;
      pendingDrag.current = null;

      if (!pd || !hasMovedRef.current) {
        // Tap — handled by TouchableOpacity
        hasMovedRef.current = false;
        return;
      }

      draggedRecently.current = true;
      setTimeout(() => { draggedRecently.current = false; }, 150);

      const dsId = pd.stackId;
      const dx   = e.clientX - pd.startMouse.x;
      const dy   = e.clientY - pd.startMouse.y;
      const newX = pd.startPos.x + dx;
      const newY = pd.startPos.y + dy;

      const stks    = localStacksRef.current;
      const dragStk = stks.find(s => s.id === dsId);

      if (dragStk) {
        const snap = findSnap(dragStk, newX, newY);
        let next: BlockStack[];

        if (snap) {
          // Merge onto snap target
          next = stks
            .filter((s: BlockStack) => s.id !== dsId)
            .map((s: BlockStack) => s.id === snap.id
              ? { ...s, blocks: [...s.blocks, ...dragStk.blocks] }
              : s
            );
        } else {
          next = stks.map((s: BlockStack) => s.id === dsId ? { ...s, x: newX, y: newY } : s);
        }
        localStacksRef.current = next;
        setStacks(next);
      }

      draggingIdRef.current = null;
      setDraggingId(null);
      setSnapTargetId(null);
      setSnapPreviewPos(null);
      hasMovedRef.current = false;
    };

    document.addEventListener('pointerdown', onDown);
    document.addEventListener('pointermove', onMove);
    document.addEventListener('pointerup',   onUp);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerup',   onUp);
    };
  }, [stackAt, blockIdxAt, findSnap, setStacks, dragAnimX, dragAnimY]);

  // Helper: accumulated height of blocks 0..blockIdx-1 in a stack
  const accumHeight = (stackId: string, blockIdx: number): number => {
    const heights = blockHeightsRef.current[stackId] ?? [];
    let acc = 0;
    for (let i = 0; i < blockIdx; i++) {
      acc += i === 0 ? (heights[i] ?? 58) : ((heights[i] ?? 58) - TAB_H);
    }
    return acc;
  };

  // ── Tap handlers ────────────────────────────────────────────────────────
  const handleEventTap = useCallback((block: WorkspaceBlock, stackBlocks: WorkspaceBlock[], bi: number) => {
    if (draggedRecently.current) return;
    triggerScript(stackBlocks.slice(bi));
  }, [triggerScript]);

  const handleBlockTap = useCallback((block: WorkspaceBlock) => {
    if (draggedRecently.current) return;
    tapBlock(block);
  }, [tapBlock]);

  // ── Find dragged stack for snap preview ghost ────────────────────────────
  const draggingStack = draggingId ? displayStacks.find(s => s.id === draggingId) : null;

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
        horizontal
        style={{ flex: 1 }}
        contentContainerStyle={{ width: CANVAS_W }}
        scrollEnabled={!draggingId}
        scrollEventThrottle={16}
        onScroll={e => { scrollOffset.current.x = e.nativeEvent.contentOffset.x; }}
      >
        <ScrollView
          contentContainerStyle={{ height: CANVAS_H }}
          scrollEnabled={!draggingId}
          scrollEventThrottle={16}
          onScroll={e => { scrollOffset.current.y = e.nativeEvent.contentOffset.y; }}
        >
          <View ref={canvasRef} style={styles.canvas}>
            <DotGrid />

            {/* Snap preview ghost */}
            {snapPreviewPos && draggingStack && (
              <View style={[styles.snapGhost, { left: snapPreviewPos.x, top: snapPreviewPos.y }]}>
                {draggingStack.blocks.map((b, bi) => (
                  <CodeBlock key={b.id} block={b} isFirst={bi === 0} isLast={bi === draggingStack.blocks.length - 1} preview />
                ))}
              </View>
            )}

            {displayStacks.map(stack => {
              const isDragging = draggingId === stack.id;
              const isSnap     = snapTargetId === stack.id;

              return (
                <Animated.View
                  key={stack.id}
                  onLayout={e => { stackHeightsRef.current[stack.id] = e.nativeEvent.layout.height; }}
                  style={[
                    styles.stackPos,
                    isDragging
                      ? { left: dragAnimX, top: dragAnimY, zIndex: 200, opacity: 0.92 }
                      : { left: stack.x, top: stack.y, zIndex: isSnap ? 5 : 1 },
                    isSnap && styles.snapTarget,
                  ]}
                >
                  {stack.blocks.map((block, bi) => (
                    <View
                      key={block.id}
                      style={bi === 0 ? undefined : { marginTop: -TAB_H, zIndex: stack.blocks.length - bi }}
                      onLayout={e => {
                        if (!blockHeightsRef.current[stack.id]) blockHeightsRef.current[stack.id] = [];
                        blockHeightsRef.current[stack.id][bi] = e.nativeEvent.layout.height;
                      }}
                    >
                      <CodeBlock
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
                    </View>
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
  const cols = Math.ceil(CANVAS_W / DOTS);
  const rows = Math.ceil(CANVAS_H / DOTS);
  const dots: React.ReactNode[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      dots.push(
        <View key={`${r}-${c}`} style={[styles.dot, { top: r * DOTS + 12, left: c * DOTS + 12 }]} />
      );
    }
  }
  return <>{dots}</>;
}

const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: '#1A1F2E' },
  canvas: { width: CANVAS_W, height: CANVAS_H, position: 'relative' },
  dot: {
    position: 'absolute', width: 3, height: 3, borderRadius: 1.5,
    backgroundColor: 'rgba(255,255,255,0.07)',
  },

  stackPos: { position: 'absolute' },

  // Snap outline highlight on target stack
  snapTarget: {
    shadowColor: '#FFF', shadowOpacity: 0.7, shadowRadius: 12,
    borderRadius: 12,
  },

  // Ghost preview at snap point
  snapGhost: {
    position: 'absolute', zIndex: 50,
    opacity: 0.35,
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.6)',
    borderRadius: 12,
  },

  runningBar: {
    position: 'absolute', top: 0, left: 0, right: 0,
    height: 3, backgroundColor: '#22C55E', zIndex: 10,
  },
  usbBanner: { backgroundColor: '#EF4444', paddingVertical: 12, paddingHorizontal: 20, zIndex: 20 },
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
