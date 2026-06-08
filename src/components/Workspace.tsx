import React, { useRef, useState, useCallback, useEffect, useLayoutEffect } from 'react';
import { View, ScrollView, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { useApp, WorkspaceBlock, BlockStack } from '../context/AppContext';
import CodeBlock, { TAB_H, TAB_OFFSET } from './CodeBlock';


const CANVAS_W   = 2200;
const CANVAS_H   = 1800;
const SNAP_D     = 30;   // snap detection radius in px
const DRAG_MIN   = 4;    // min movement to activate drag (lower = more responsive)

function isTouchEvent(b: WorkspaceBlock) {
  return b.category === 'Eventos' ||
    b.defId === 'evt_touch_1' || b.defId === 'evt_touch_2' || b.defId === 'evt_touch_3' ||
    b.defId === 'luz_1' || b.defId === 'luz_2' || b.defId === 'luz_3';
}

export default function Workspace() {
  const { stacks, setStacks, addStack, activeBlockId, usbDisconnectedWhileRunning, tapBlock, triggerScript } = useApp();
  const displayStacks = stacks;

  // ── Drag/snap state ─────────────────────────────────────────────────────
  const [draggingId,    setDraggingId]    = useState<string | null>(null);
  const [snapTargetId,  setSnapTargetId]  = useState<string | null>(null);
  const [snapPreviewPos, setSnapPreviewPos] = useState<{ x: number; y: number } | null>(null);
  // Library drag ghost block (for snap preview when dragging from library)
  const [libDragBlock, setLibDragBlock]   = useState<WorkspaceBlock | null>(null);
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
  // Saved before onDown mutates stacks — lets us rollback on tap
  const preDragStacks   = useRef<BlockStack[] | null>(null);
  // Which block was pressed, for manual tap dispatch after rollback
  const tappedBlock     = useRef<{
    block: WorkspaceBlock;
    isEvent: boolean;
    stackBlocks: WorkspaceBlock[];
    bi: number;
  } | null>(null);
  const stackHeightsRef = useRef<Record<string, number>>({});          // total stack height
  const blockHeightsRef = useRef<Record<string, number[]>>({});        // [block heights] per stack
  const canvasRef       = useRef<any>(null);
  const scrollOffset    = useRef({ x: 0, y: 0 });
  const addStackRef     = useRef(addStack);
  useEffect(() => { addStackRef.current = addStack; }, [addStack]);

  // useLayoutEffect fires synchronously after DOM mutations and before paint,
  // so localStacksRef is always current by the time the user can interact.
  useLayoutEffect(() => { localStacksRef.current = displayStacks; }, [displayStacks]);

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

  // ── Accumulated block height helper ────────────────────────────────────
  const accumHeight = useCallback((stackId: string, blockIdx: number): number => {
    const heights = blockHeightsRef.current[stackId] ?? [];
    let acc = 0;
    for (let i = 0; i < blockIdx; i++) {
      acc += i === 0 ? (heights[i] ?? 58) : ((heights[i] ?? 58) - TAB_H);
    }
    return acc;
  }, []);

  // ── Snap detection — checks every inter-block boundary, not just bottom ──
  const findSnap = useCallback((dragStack: BlockStack, dragX: number, dragY: number): { id: string; y: number; insertAt: number } | null => {
    const emX = dragX + TAB_OFFSET + 8;
    const emY = dragY;

    for (const s of localStacksRef.current) {
      if (s.id === dragStack.id) continue;
      const recX = s.x + TAB_OFFSET + 8;
      if (Math.abs(emX - recX) >= SNAP_D) continue;

      // Check each boundary: between block i-1 and i, and at the very bottom
      for (let i = 1; i <= s.blocks.length; i++) {
        const boundY = s.y + accumHeight(s.id, i);
        if (Math.abs(emY - boundY) < SNAP_D) {
          return { id: s.id, y: boundY, insertAt: i };
        }
      }
    }
    return null;
  }, [accumHeight]);

  // ── Bracket inner slot snap ─────────────────────────────────────────────
  const findBracketSnap = useCallback((dragStack: BlockStack, dragX: number, dragY: number):
    { stackId: string; bracketBlockId: string } | null => {
    const BRACKET_DEF_IDS = ['ctrl_2', 'ctrl_3', 'ctrl_4'];
    // bracketTop body height (paddingTop + label + paddingBottom ≈ 43px)
    const BRACKET_TOP_H   = 43;
    // bracketBottom height (TAB_H + 20 = 29px)
    const BRACKET_BOT_H   = 29;
    const ARM_W           = 20;

    for (const s of localStacksRef.current) {
      if (s.id === dragStack.id) continue;
      const heights = blockHeightsRef.current[s.id] ?? [];
      let acc = 0;
      for (let bi = 0; bi < s.blocks.length; bi++) {
        const b = s.blocks[bi];
        if (BRACKET_DEF_IDS.includes(b.defId)) {
          // Use || fallback so a 0 (unmeasured) height also gets the default
          const blockH   = heights[bi] || 115;
          const innerTop = s.y + acc + BRACKET_TOP_H;
          const innerBot = s.y + acc + blockH - BRACKET_BOT_H;
          const innerLeft  = s.x + ARM_W;
          const innerRight = s.x + 400;
          if (dragX >= innerLeft && dragX <= innerRight &&
              dragY >= innerTop  && dragY <= innerBot) {
            return { stackId: s.id, bracketBlockId: b.id };
          }
        }
        acc += bi === 0 ? (heights[bi] || 58) : ((heights[bi] || 58) - TAB_H);
      }
    }
    return null;
  }, []);

  // ── Block index hit-test within a stack ─────────────────────────────────
  const blockIdxAt = useCallback((stackId: string, relY: number): number => {
    const heights = blockHeightsRef.current[stackId] ?? [];
    let acc = 0;
    for (let i = 0; i < heights.length; i++) {
      // Use (height - TAB_H) for ALL blocks so hit zones match visual positions.
      // Block i's visual top = accumHeight(i) - TAB_H (for i>0). Using height-TAB_H
      // ensures clicking in block 1's visual area doesn't register as block 0.
      const h = (heights[i] ?? 58) - TAB_H;
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
  //
  // Key design: split + setDraggingId happen in onDown (at press time), NOT at
  // the DRAG_MIN threshold.  That way the re-render that makes the Animated.View
  // follow dragAnimX/Y is done before the user has moved 4 px — eliminating the
  // "frozen on first grab" stickiness.
  //
  // Tap rollback: if the user releases without crossing DRAG_MIN we restore the
  // pre-press stacks and manually dispatch the tap handler (TouchableOpacity may
  // not fire because the block was briefly in a different React tree key).
  useEffect(() => {
    if (typeof document === 'undefined') return;

    const BRACKET_DEF_IDS = ['ctrl_2', 'ctrl_3', 'ctrl_4'];
    const BRACKET_TOP_H   = 43; // bracketTop body height px

    const onDown = (e: PointerEvent) => {
      (window as any).__libDrag = null;
      setLibDragBlock(null);

      const hit = stackAt(e.clientX, e.clientY);
      if (!hit) return;
      const { stack, relY } = hit;
      const blockIdx    = blockIdxAt(stack.id, relY);
      const clickedBlock = stack.blocks[blockIdx];

      // Save pre-drag state so we can roll back on tap
      preDragStacks.current = localStacksRef.current;
      tappedBlock.current   = {
        block:       clickedBlock,
        isEvent:     isTouchEvent(clickedBlock),
        stackBlocks: stack.blocks,
        bi:          blockIdx,
      };
      hasMovedRef.current = false;

      // ── Inner bracket extraction ───────────────────────────────────────
      if (BRACKET_DEF_IDS.includes(clickedBlock?.defId) && clickedBlock?.innerBlocks?.length) {
        const canvas = toCanvas(e.clientX, e.clientY);
        const bracketTop = stack.y + accumHeight(stack.id, blockIdx);
        if (canvas.y >= bracketTop + BRACKET_TOP_H) {
          const extractX = stack.x + 20;
          const extractY = bracketTop + BRACKET_TOP_H;
          const innerBlocks = clickedBlock.innerBlocks!;
          const newId = `ex_${Date.now()}`;
          const newStack: BlockStack = { id: newId, x: extractX, y: extractY, blocks: innerBlocks };
          const next = localStacksRef.current
            .map(s => s.id === stack.id
              ? { ...s, blocks: s.blocks.map(b => b.id === clickedBlock.id ? { ...b, innerBlocks: [] } : b) }
              : s)
            .concat([newStack]);
          localStacksRef.current = next;
          setStacks(next);
          dragAnimX.setValue(extractX);
          dragAnimY.setValue(extractY);
          draggingIdRef.current = newId;
          setDraggingId(newId);
          pendingDrag.current = {
            stackId: newId, blockIdx: 0,
            startMouse: { x: e.clientX, y: e.clientY },
            startPos:   { x: extractX, y: extractY },
          };
          return;
        }
      }

      // ── Regular drag — split mid-stack if needed ───────────────────────
      let dragStackId = stack.id;
      let startPos    = { x: stack.x, y: stack.y + accumHeight(stack.id, blockIdx) };

      if (blockIdx > 0) {
        const newId = `sp_${Date.now()}`;
        dragStackId  = newId;
        const splitY = stack.y + accumHeight(stack.id, blockIdx);
        const newStack: BlockStack = {
          id: newId, x: stack.x, y: splitY,
          blocks: stack.blocks.slice(blockIdx),
        };
        const topStack = { ...stack, blocks: stack.blocks.slice(0, blockIdx) };
        const next = localStacksRef.current
          .map(s => s.id === stack.id ? topStack : s)
          .concat([newStack]);
        localStacksRef.current = next;
        setStacks(next);
        startPos = { x: newStack.x, y: newStack.y };
      }

      dragAnimX.setValue(startPos.x);
      dragAnimY.setValue(startPos.y);
      draggingIdRef.current = dragStackId;
      setDraggingId(dragStackId);
      pendingDrag.current = {
        stackId: dragStackId, blockIdx: 0,
        startMouse: { x: e.clientX, y: e.clientY },
        startPos,
      };
    };

    const onMove = (e: PointerEvent) => {
      // ── Library drag hover ────────────────────────────────────────────
      const ld = (window as any).__libDrag;
      if (ld?.active && ld?.hasMoved) {
        const pos = toCanvas(e.clientX, e.clientY);
        const tempStack: BlockStack = { id: '__lib__', x: pos.x, y: pos.y, blocks: [ld.block] };
        const snap = findSnap(tempStack, pos.x, pos.y);
        setLibDragBlock(ld.block);
        setSnapTargetId(snap?.id ?? null);
        setSnapPreviewPos(snap
          ? { x: localStacksRef.current.find(s => s.id === snap.id)?.x ?? pos.x, y: snap.y }
          : null);
        return;
      }

      if (!pendingDrag.current) return;
      const { startMouse, startPos, stackId: dsId } = pendingDrag.current;
      const dx = e.clientX - startMouse.x;
      const dy = e.clientY - startMouse.y;

      if (!hasMovedRef.current) {
        if (Math.abs(dx) + Math.abs(dy) <= DRAG_MIN) return;
        hasMovedRef.current = true;
      }

      const newX = startPos.x + dx;
      const newY = startPos.y + dy;
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
      // ── Library drag drop ─────────────────────────────────────────────
      const ld = (window as any).__libDrag;
      if (ld?.active && ld?.hasMoved) {
        (window as any).__libDrag = null;
        const pos       = toCanvas(e.clientX, e.clientY);
        const tempStack: BlockStack = { id: '__lib__', x: pos.x, y: pos.y, blocks: [ld.block] };
        const bracketSnap = findBracketSnap(tempStack, pos.x, pos.y);
        const snap        = !bracketSnap ? findSnap(tempStack, pos.x, pos.y) : null;
        const wsBlock: WorkspaceBlock = { ...ld.block, id: `ws_${Date.now()}_${ld.block.id}` };
        const stks = localStacksRef.current;

        if (bracketSnap) {
          const next = stks.map((s: BlockStack) => s.id === bracketSnap.stackId
            ? { ...s, blocks: s.blocks.map(b => b.id === bracketSnap.bracketBlockId
                ? { ...b, innerBlocks: [...(b.innerBlocks ?? []), wsBlock] } : b) }
            : s);
          localStacksRef.current = next; setStacks(next);
        } else if (snap) {
          const next = stks.map((s: BlockStack) => {
            if (s.id !== snap.id) return s;
            const merged = [...s.blocks]; merged.splice(snap.insertAt, 0, wsBlock);
            return { ...s, blocks: merged };
          });
          localStacksRef.current = next; setStacks(next);
        } else {
          addStackRef.current(wsBlock, Math.max(10, pos.x - 60), Math.max(10, pos.y - 30));
        }
        setLibDragBlock(null); setSnapTargetId(null); setSnapPreviewPos(null);
        return;
      }

      const pd = pendingDrag.current;
      pendingDrag.current  = null;
      draggingIdRef.current = null;
      setDraggingId(null);
      setSnapTargetId(null);
      setSnapPreviewPos(null);

      if (!pd) return;

      if (!hasMovedRef.current) {
        // ── TAP: roll back split, dispatch tap handler manually ──────────
        hasMovedRef.current = false;
        if (preDragStacks.current) {
          localStacksRef.current = preDragStacks.current;
          setStacks(preDragStacks.current);
          preDragStacks.current = null;
        }
        // Manually fire the tap handler
        const tb = tappedBlock.current;
        tappedBlock.current = null;
        if (tb) {
          if (tb.isEvent) triggerScript(tb.stackBlocks.slice(tb.bi));
          else tapBlock(tb.block);
        }
        // Suppress any TouchableOpacity onPress that fires after us
        draggedRecently.current = true;
        setTimeout(() => { draggedRecently.current = false; }, 200);
        return;
      }

      hasMovedRef.current   = false;
      preDragStacks.current = null;
      tappedBlock.current   = null;
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
        const bracketSnap = findBracketSnap(dragStk, newX, newY);
        const snap        = !bracketSnap ? findSnap(dragStk, newX, newY) : null;
        let next: BlockStack[];

        if (bracketSnap) {
          next = stks
            .filter((s: BlockStack) => s.id !== dsId)
            .map((s: BlockStack) => s.id === bracketSnap.stackId
              ? { ...s, blocks: s.blocks.map(b => b.id === bracketSnap.bracketBlockId
                  ? { ...b, innerBlocks: [...(b.innerBlocks ?? []), ...dragStk.blocks] }
                  : b) }
              : s);
        } else if (snap) {
          next = stks
            .filter((s: BlockStack) => s.id !== dsId)
            .map((s: BlockStack) => {
              if (s.id !== snap.id) return s;
              const merged = [...s.blocks]; merged.splice(snap.insertAt, 0, ...dragStk.blocks);
              return { ...s, blocks: merged };
            });
        } else {
          next = stks.map((s: BlockStack) => s.id === dsId ? { ...s, x: newX, y: newY } : s);
        }
        localStacksRef.current = next;
        setStacks(next);
      }
    };

    document.addEventListener('pointerdown', onDown);
    document.addEventListener('pointermove', onMove);
    document.addEventListener('pointerup',   onUp);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerup',   onUp);
    };
  }, [stackAt, blockIdxAt, accumHeight, toCanvas, findSnap, findBracketSnap,
      setStacks, dragAnimX, dragAnimY, tapBlock, triggerScript]);

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

      {/* Clear workspace button — resets to example */}
      {stacks.length > 0 && (
        <TouchableOpacity style={styles.clearBtn} onPress={() => setStacks([])}>
          <Text style={styles.clearBtnText}>↺</Text>
        </TouchableOpacity>
      )}

      <ScrollView
        horizontal
        style={{ flex: 1 }}
        contentContainerStyle={{ width: CANVAS_W }}
        scrollEnabled={!draggingId}
        scrollEventThrottle={16}
        onScroll={e => {
            scrollOffset.current.x = e.nativeEvent.contentOffset.x;
            (window as any).__workspaceScroll = { ...scrollOffset.current };
          }}
      >
        <ScrollView
          contentContainerStyle={{ height: CANVAS_H }}
          scrollEnabled={!draggingId}
          scrollEventThrottle={16}
          onScroll={e => {
            scrollOffset.current.y = e.nativeEvent.contentOffset.y;
            (window as any).__workspaceScroll = { ...scrollOffset.current };
          }}
        >
          <View ref={canvasRef} nativeID="workspace-canvas" style={styles.canvas}>

            {/* Guide message — hidden once first block is placed */}
            {stacks.length === 0 && (
              <View style={styles.guideMessage} pointerEvents="none">
                <Text style={styles.guideText}>
                  Para iniciar conecta a placa e arrasta blocos da biblioteca para criar o seu programa.
                </Text>
              </View>
            )}

            {/* Snap preview ghost — workspace drag or library drag */}
            {snapPreviewPos && (draggingStack ?? libDragBlock) && (
              <View style={[styles.snapGhost, { left: snapPreviewPos.x, top: snapPreviewPos.y }]}>
                {(draggingStack ? draggingStack.blocks : [libDragBlock!]).map((b, bi, arr) => (
                  <CodeBlock key={b.id} block={b} isFirst={bi === 0} isLast={bi === arr.length - 1} preview />
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
                      style={{ marginTop: bi === 0 ? 0 : -TAB_H, zIndex: stack.blocks.length - bi + 1 }}
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


const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: '#1A1F2E' },
  canvas: { width: CANVAS_W, height: CANVAS_H, position: 'relative' },

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
  guideMessage: {
    position: 'absolute',
    top: 24,
    left: 20,
    width: 280,
  },
  guideText: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 21,
  },

  clearBtn: {
    position: 'absolute', bottom: 16, right: 16, zIndex: 20,
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center', justifyContent: 'center',
  },
  clearBtnText: { color: 'rgba(255,255,255,0.5)', fontSize: 18 },
});
