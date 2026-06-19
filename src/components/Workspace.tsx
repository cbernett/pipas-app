import React, { useRef, useState, useCallback, useEffect, useLayoutEffect } from 'react';
import { View, ScrollView, Text, StyleSheet, Animated, TouchableOpacity, useWindowDimensions, Platform, PanResponder, Dimensions } from 'react-native';
import { flushSync } from 'react-dom';

import { useApp, WorkspaceBlock, BlockStack } from '../context/AppContext';

// Native-only draggable wrapper — PanResponder with onMoveShouldSetPanResponder
// (this is the approach that worked: block steals gesture from ScrollView mid-move)
function NativeStackDragger({
  stack,
  onDragEnd,
  onDragMove,
  onTap,
  children,
}: {
  stack: BlockStack;
  onDragEnd: (id: string, x: number, y: number, touchedY: number, screenY: number) => void;
  onDragMove: (canvasX: number, canvasY: number, screenY: number) => void;
  onTap: (touchedY: number) => void;
  children: React.ReactNode;
}) {
  const pan = useRef(new Animated.ValueXY({ x: stack.x, y: stack.y })).current;

  // Ref proxies so the frozen PanResponder always calls the latest callbacks
  const stackIdRef     = useRef(stack.id);
  const onDragEndRef   = useRef(onDragEnd);
  const onDragMoveRef  = useRef(onDragMove);
  const onTapRef       = useRef(onTap);
  stackIdRef.current   = stack.id;
  onDragEndRef.current = onDragEnd;
  onDragMoveRef.current = onDragMove;
  onTapRef.current     = onTap;

  const didMove  = useRef(false);
  const touchedY = useRef(0); // locationY at grant time (relative to stack top)

  useEffect(() => {
    pan.setValue({ x: stack.x, y: stack.y });
  }, [stack.id]);

  const responder = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => false,
    onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 6 || Math.abs(g.dy) > 6,
    onPanResponderGrant: (e) => {
      didMove.current  = false;
      touchedY.current = e.nativeEvent.locationY;
      pan.extractOffset();
    },
    onPanResponderMove: (e, g) => {
      didMove.current = true;
      pan.x.setValue(g.dx);
      pan.y.setValue(g.dy);
      const canvasX = (pan.x as any)._offset + g.dx;
      const canvasY = (pan.y as any)._offset + g.dy;
      onDragMoveRef.current(canvasX, canvasY, e.nativeEvent.pageY);
    },
    onPanResponderRelease: (e) => {
      pan.flattenOffset();
      if (didMove.current) {
        onDragEndRef.current(stackIdRef.current, (pan.x as any)._value, (pan.y as any)._value, touchedY.current, e.nativeEvent.pageY);
      } else {
        onTapRef.current(touchedY.current);
      }
    },
    onPanResponderTerminate: () => { pan.flattenOffset(); },
  })).current;

  return (
    <Animated.View
      style={[styles.stackPos, { left: pan.x, top: pan.y, zIndex: 1 }]}
      {...responder.panHandlers}
    >
      {children}
    </Animated.View>
  );
}
import CodeBlock, { TAB_H, TAB_OFFSET } from './CodeBlock';


const CANVAS_W   = 1200;
const CANVAS_H   = 1000;
const SNAP_D     = 30;   // snap detection radius in px
const DRAG_MIN   = 4;    // min movement to activate drag (lower = more responsive)
const TRASH_ZONE_CLOSED = 64;   // handle bar height when library is closed
const TRASH_ZONE_OPEN   = 340;  // full drawer height when library is open

function isTouchEvent(b: WorkspaceBlock) {
  return b.category === 'Eventos' ||
    b.defId === 'evt_touch_1' || b.defId === 'evt_touch_2' || b.defId === 'evt_touch_3' ||
    b.defId === 'luz_1' || b.defId === 'luz_2' || b.defId === 'luz_3';
}

export default function Workspace() {
  const { width: winWidth } = useWindowDimensions();
  const { stacks, setStacks, addStack, activeBlockId, usbDisconnectedWhileRunning, tapBlock, triggerScript, trashHover, setTrashHover, stopRun, libraryOpen } = useApp();
  const libraryOpenRef = useRef(libraryOpen);
  useEffect(() => { libraryOpenRef.current = libraryOpen; }, [libraryOpen]);
  const displayStacks = stacks;

  // ── Drag/snap state ─────────────────────────────────────────────────────
  const [draggingId,      setDraggingId]      = useState<string | null>(null);
  const [snapTargetId,    setSnapTargetId]    = useState<string | null>(null);
  const [bracketHoverId,  setBracketHoverId]  = useState<string | null>(null);
  const bracketHoverRef   = useRef<string | null>(null);
  const [bracketInsertPreview, setBracketInsertPreview] = useState<{ bracketBlockId: string; insertAt: number; zone: 'then' | 'else' } | null>(null);
  const [snapPreviewPos, setSnapPreviewPos] = useState<{ x: number; y: number; insertAt: number; targetId: string } | null>(null);
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
    const emY = dragY;

    for (const s of localStacksRef.current) {
      if (s.id === dragStack.id) continue;
      // Accept any x within 300px of the stack's left edge — wide so hovering
      // anywhere over a stack triggers the snap, not just near the tab indent.
      if (dragX < s.x - 40 || dragX > s.x + 300) continue;

      // For each boundary, find the closest one within the stack's y range
      // and snap to whichever boundary the cursor is nearest to.
      const totalH = stackHeightsRef.current[s.id] ?? 200;
      if (emY < s.y - 20 || emY > s.y + totalH + 20) continue;

      // Find the closest boundary
      let bestDist = Infinity;
      let bestI    = -1;
      for (let i = 1; i <= s.blocks.length; i++) {
        const boundY = s.y + accumHeight(s.id, i);
        const dist   = Math.abs(emY - boundY);
        if (dist < bestDist) { bestDist = dist; bestI = i; }
      }
      if (bestI >= 0) {
        return { id: s.id, y: s.y + accumHeight(s.id, bestI), insertAt: bestI };
      }
    }
    return null;
  }, [accumHeight]);

  // ── Bracket inner slot snap ─────────────────────────────────────────────
  // dragX/dragY should be the cursor canvas position (not block top-left) so
  // the user can reliably point at the bracket interior to trigger the snap.
  const findBracketSnap = useCallback((dragStack: BlockStack, dragX: number, dragY: number):
    { stackId: string; bracketBlockId: string; innerInsertAt: number; zone: 'then' | 'else' } | null => {
    const BRACKET_DEF_IDS = ['ctrl_2', 'ctrl_3', 'ctrl_4', 'ctrl_5'];
    const BRACKET_TOP_H   = 36;
    const ARM_W           = 20;
    const BOTTOM_H        = 28;

    for (const s of localStacksRef.current) {
      if (s.id === dragStack.id) continue;
      const heights = blockHeightsRef.current[s.id] ?? [];
      let acc = 0;
      for (let bi = 0; bi < s.blocks.length; bi++) {
        const b = s.blocks[bi];
        if (BRACKET_DEF_IDS.includes(b.defId)) {
          const blockH    = heights[bi] || 120;
          const blockTop  = s.y + acc;
          const innerLeft = s.x + ARM_W;
          const innerRight= s.x + 500;

          if (dragX >= innerLeft && dragX <= innerRight &&
              dragY >= blockTop + BRACKET_TOP_H && dragY <= blockTop + blockH) {

            if (b.defId === 'ctrl_5') {
              // Split block in half — top = then zone, bottom = else zone
              const midY   = blockTop + blockH / 2;
              const zone: 'then' | 'else' = dragY < midY ? 'then' : 'else';
              const zoneBlocks = zone === 'then' ? (b.innerBlocks ?? []) : (b.elseBlocks ?? []);
              const zoneTop  = zone === 'then' ? blockTop + BRACKET_TOP_H : midY;
              const zoneBot  = zone === 'then' ? midY : blockTop + blockH - BOTTOM_H;
              const zoneH    = Math.max(1, zoneBot - zoneTop);
              const relY     = Math.max(0, dragY - zoneTop);
              const slot     = zoneH / (zoneBlocks.length + 1);
              const insertAt = Math.min(zoneBlocks.length, Math.max(0, Math.floor(relY / slot)));
              return { stackId: s.id, bracketBlockId: b.id, innerInsertAt: insertAt, zone };
            } else {
              const inner  = b.innerBlocks ?? [];
              const innerTop = blockTop + BRACKET_TOP_H;
              const innerBot = blockTop + blockH - BOTTOM_H;
              const zoneH  = Math.max(1, innerBot - innerTop);
              const relY   = Math.max(0, dragY - innerTop);
              const slot   = zoneH / (inner.length + 1);
              const insertAt = Math.min(inner.length, Math.max(0, Math.floor(relY / slot)));
              return { stackId: s.id, bracketBlockId: b.id, innerInsertAt: insertAt, zone: 'then' };
            }
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
      // Don't intercept clicks on dropdowns or text inputs — let React handle them
      const target = e.target as HTMLElement;
      if (target.closest?.('[data-testid="dropdown-bubble"]') ||
          target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

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
          dragAnimX.setValue(extractX);
          dragAnimY.setValue(extractY);
          draggingIdRef.current = newId;
          // flushSync: re-render completes synchronously before onDown returns,
          // so the Animated.View is already in drag mode when the user moves.
          flushSync(() => { setStacks(next); setDraggingId(newId); });
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
      let nextStacks: BlockStack[] | null = null;

      if (blockIdx > 0) {
        const newId = `sp_${Date.now()}`;
        dragStackId  = newId;
        const splitY = stack.y + accumHeight(stack.id, blockIdx);
        const newStack: BlockStack = {
          id: newId, x: stack.x, y: splitY,
          blocks: stack.blocks.slice(blockIdx),
        };
        const topStack = { ...stack, blocks: stack.blocks.slice(0, blockIdx) };
        nextStacks = localStacksRef.current
          .map(s => s.id === stack.id ? topStack : s)
          .concat([newStack]);
        localStacksRef.current = nextStacks;
        startPos = { x: newStack.x, y: newStack.y };
      }

      dragAnimX.setValue(startPos.x);
      dragAnimY.setValue(startPos.y);
      draggingIdRef.current = dragStackId;
      // flushSync: re-render completes synchronously before onDown returns,
      // so the Animated.View is already in drag mode when the user moves.
      flushSync(() => {
        if (nextStacks) setStacks(nextStacks);
        setDraggingId(dragStackId);
      });
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
        const bSnap = findBracketSnap(tempStack, pos.x, pos.y);
        const newBId = bSnap?.bracketBlockId ?? null;
        if (newBId !== bracketHoverRef.current) {
          bracketHoverRef.current = newBId;
          setBracketHoverId(newBId);
        }
        setBracketInsertPreview(bSnap ? { bracketBlockId: bSnap.bracketBlockId, insertAt: bSnap.innerInsertAt, zone: bSnap.zone } : null);
        const snap = !bSnap ? findSnap(tempStack, pos.x, pos.y) : null;
        setLibDragBlock(ld.block);
        setSnapTargetId(snap?.id ?? null);
        setSnapPreviewPos(snap
          ? { x: localStacksRef.current.find(s => s.id === snap.id)?.x ?? pos.x, y: snap.y, insertAt: snap.insertAt, targetId: snap.id }
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

      // Trash zone: covers library bar whether open or closed
      const trashZone = libraryOpenRef.current ? TRASH_ZONE_OPEN : TRASH_ZONE_CLOSED;
      setTrashHover(e.clientY > window.innerHeight - trashZone);

      const dragStack = localStacksRef.current.find(s => s.id === dsId);
      if (dragStack) {
        const cursorCanvas = toCanvas(e.clientX, e.clientY);
        const bSnap = findBracketSnap(dragStack, cursorCanvas.x, cursorCanvas.y);
        const newBId = bSnap?.bracketBlockId ?? null;
        if (newBId !== bracketHoverRef.current) {
          bracketHoverRef.current = newBId;
          setBracketHoverId(newBId);
        }
        setBracketInsertPreview(bSnap ? { bracketBlockId: bSnap.bracketBlockId, insertAt: bSnap.innerInsertAt, zone: bSnap.zone } : null);
        const snap = !bSnap ? findSnap(dragStack, newX, newY) : null;
        setSnapTargetId(snap?.id ?? null);
        setSnapPreviewPos(snap ? {
          x: localStacksRef.current.find(s => s.id === snap.id)?.x ?? newX,
          y: snap.y,
          insertAt: snap.insertAt,
          targetId: snap.id,
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
            ? { ...s, blocks: s.blocks.map(b => {
                if (b.id !== bracketSnap.bracketBlockId) return b;
                if (bracketSnap.zone === 'else') {
                  const elseArr = [...(b.elseBlocks ?? [])];
                  elseArr.splice(bracketSnap.innerInsertAt, 0, wsBlock);
                  return { ...b, elseBlocks: elseArr };
                }
                const inner = [...(b.innerBlocks ?? [])];
                inner.splice(bracketSnap.innerInsertAt, 0, wsBlock);
                return { ...b, innerBlocks: inner };
              }) }
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
        bracketHoverRef.current = null;
        setLibDragBlock(null); setSnapTargetId(null); setSnapPreviewPos(null); setBracketHoverId(null); setBracketInsertPreview(null);
        return;
      }

      const pd = pendingDrag.current;
      pendingDrag.current  = null;
      draggingIdRef.current = null;
      bracketHoverRef.current = null;
      setDraggingId(null);
      setSnapTargetId(null);
      setSnapPreviewPos(null);
      setBracketHoverId(null);
      setBracketInsertPreview(null);
      setTrashHover(false);

      if (!pd) return;

      // ── Trash drop: delete the stack ──────────────────────────────────────
      const trashZone = libraryOpenRef.current ? TRASH_ZONE_OPEN : TRASH_ZONE_CLOSED;
      if (hasMovedRef.current && e.clientY > window.innerHeight - trashZone) {
        hasMovedRef.current = false;
        preDragStacks.current = null;
        const next = localStacksRef.current.filter((s: BlockStack) => s.id !== pd.stackId);
        localStacksRef.current = next;
        setStacks(next);
        return;
      }

      if (!hasMovedRef.current) {
        // ── TAP: roll back split, dispatch tap handler manually ──────────
        hasMovedRef.current = false;
        if (preDragStacks.current) {
          const restored = preDragStacks.current;
          localStacksRef.current = restored;
          preDragStacks.current = null;
          flushSync(() => { setStacks(restored); setDraggingId(null); });
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
        // Use cursor canvas position for bracket detection — the user is pointing
        // at where they want the block to go, not at the dragged block's top-left.
        const cursorCanvas = toCanvas(e.clientX, e.clientY);
        const bracketSnap = findBracketSnap(dragStk, cursorCanvas.x, cursorCanvas.y);
        const snap        = !bracketSnap ? findSnap(dragStk, newX, newY) : null;
        let next: BlockStack[];

        if (bracketSnap) {
          next = stks
            .filter((s: BlockStack) => s.id !== dsId)
            .map((s: BlockStack) => s.id === bracketSnap.stackId
              ? { ...s, blocks: s.blocks.map(b => {
                  if (b.id !== bracketSnap.bracketBlockId) return b;
                  if (bracketSnap.zone === 'else') {
                    const elseArr = [...(b.elseBlocks ?? [])];
                    elseArr.splice(bracketSnap.innerInsertAt, 0, ...dragStk.blocks);
                    return { ...b, elseBlocks: elseArr };
                  }
                  const inner = [...(b.innerBlocks ?? [])];
                  inner.splice(bracketSnap.innerInsertAt, 0, ...dragStk.blocks);
                  return { ...b, innerBlocks: inner };
                }) }
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
      setStacks, dragAnimX, dragAnimY, tapBlock, triggerScript, setBracketHoverId]);

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
  const isRunning = activeBlockId !== null;

  return (
    <View style={styles.root}>
      {usbDisconnectedWhileRunning && (
        <View style={styles.usbBanner}>
          <Text style={styles.usbBannerText}>⚠️  Placa desconectada</Text>
        </View>
      )}

      {/* Play / Stop FAB */}
      <TouchableOpacity
        style={[styles.fab, isRunning && styles.fabStop, !isRunning && stacks.length === 0 && styles.fabInactive]}
        onPress={() => {
          if (isRunning) {
            stopRun();
          } else {
            // Run all stacks simultaneously
            stacks.forEach(stack => {
              if (stack.blocks.length > 0) triggerScript(stack.blocks);
            });
          }
        }}
        activeOpacity={0.8}
      >
        <Text style={styles.fabIcon}>{isRunning ? '■' : '▶'}</Text>
      </TouchableOpacity>

      <ScrollView
        horizontal
        style={{ flex: 1 }}
        contentContainerStyle={{ width: CANVAS_W }}
        scrollEnabled={Platform.OS === 'web' ? !draggingId : false}
        scrollEventThrottle={16}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        bounces={false}
        onScroll={e => {
            scrollOffset.current.x = e.nativeEvent.contentOffset.x;
            (window as any).__workspaceScroll = { ...scrollOffset.current };
          }}
      >
        <ScrollView
          contentContainerStyle={{ height: CANVAS_H }}
          scrollEnabled={Platform.OS === 'web' ? !draggingId : false}
          scrollEventThrottle={16}
          showsHorizontalScrollIndicator={false}
          bounces={false}
          showsVerticalScrollIndicator={false}
          onScroll={e => {
            scrollOffset.current.y = e.nativeEvent.contentOffset.y;
            (window as any).__workspaceScroll = { ...scrollOffset.current };
          }}
        >
          <View ref={canvasRef} nativeID="workspace-canvas" style={styles.canvas}>

            {/* Guide message — hidden once first block is placed */}
            {stacks.length === 0 && (
              <View style={[styles.guideMessage, { width: winWidth - 64 }]} pointerEvents="none">
                <Text style={styles.guideText}>
                  Para iniciar conecta a placa e arrasta blocos da biblioteca para criar o seu programa.
                </Text>
              </View>
            )}


            {displayStacks.map(stack => {
              const isDragging  = draggingId === stack.id;
              const isSnap      = snapTargetId === stack.id;
              const insertAt    = (isSnap && snapPreviewPos?.targetId === stack.id) ? snapPreviewPos.insertAt : null;
              // Height of the spacer = height of what's being dragged (or library block)
              const draggedH    = draggingStack ? (stackHeightsRef.current[draggingStack.id] ?? 44) : 44;

              const stackContent = (
                <Animated.View
                  key={stack.id}
                  onLayout={e => { stackHeightsRef.current[stack.id] = e.nativeEvent.layout.height; }}
                  style={Platform.OS !== 'web' ? undefined : [
                    styles.stackPos,
                    isDragging
                      ? { left: dragAnimX, top: dragAnimY, zIndex: 200, opacity: 0.92 }
                      : { left: stack.x, top: stack.y, zIndex: isSnap ? 5 : 1 },
                  ]}
                >
                  {stack.blocks.map((block, bi) => (
                    <React.Fragment key={block.id}>
                      {/* Insertion spacer above this block */}
                      {insertAt === bi && (
                        <View style={[styles.insertSpacer, { height: draggedH, marginTop: bi === 0 ? 0 : -TAB_H }]} pointerEvents="none" />
                      )}
                      <View
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
                          isBracketHovered={bracketHoverId === block.id}
                          bracketInsertAt={bracketInsertPreview?.bracketBlockId === block.id && bracketInsertPreview.zone === 'then' ? bracketInsertPreview.insertAt : undefined}
                          elseInsertAt={bracketInsertPreview?.bracketBlockId === block.id && bracketInsertPreview.zone === 'else' ? bracketInsertPreview.insertAt : undefined}
                          draggedH={draggedH}
                          onEventTap={isTouchEvent(block)
                            ? () => handleEventTap(block, stack.blocks, bi)
                            : undefined}
                          onBlockTap={() => handleBlockTap(block)}
                        />
                      </View>
                    </React.Fragment>
                  ))}
                  {/* Spacer at end of stack */}
                  {insertAt === stack.blocks.length && (
                    <View style={[styles.insertSpacer, { height: draggedH, marginTop: -TAB_H }]} pointerEvents="none" />
                  )}
                </Animated.View>
              );

              if (Platform.OS !== 'web') {
                return (
                  <NativeStackDragger
                    key={stack.id}
                    stack={stack}
                    onDragMove={(canvasX, canvasY, screenY) => {
                      const winH = Dimensions.get('window').height;
                      const trashZone = libraryOpenRef.current ? TRASH_ZONE_OPEN : TRASH_ZONE_CLOSED;
                      setTrashHover(screenY > winH - trashZone);
                      const tempDrag: BlockStack = { id: stack.id, x: canvasX, y: canvasY, blocks: stack.blocks };
                      const snap = findSnap(tempDrag, canvasX, canvasY);
                      setSnapTargetId(snap?.id ?? null);
                      setSnapPreviewPos(snap ? {
                        x: localStacksRef.current.find(s => s.id === snap.id)?.x ?? canvasX,
                        y: snap.y,
                        insertAt: snap.insertAt,
                        targetId: snap.id,
                      } : null);
                    }}
                    onDragEnd={(id, x, y, touchedY, screenY) => {
                      setTrashHover(false);
                      setSnapTargetId(null);
                      setSnapPreviewPos(null);
                      const stks = localStacksRef.current;
                      const dragStk = stks.find(s => s.id === id);
                      if (!dragStk) return;

                      // Trash zone: delete if released near the library drawer
                      const winH = Dimensions.get('window').height;
                      const trashZone = libraryOpenRef.current ? TRASH_ZONE_OPEN : TRASH_ZONE_CLOSED;
                      if (screenY > winH - trashZone) {
                        const next = stks.filter((s: BlockStack) => s.id !== id);
                        localStacksRef.current = next;
                        setStacks(next);
                        return;
                      }

                      // Determine which block was touched
                      const blockIdx = blockIdxAt(id, touchedY);

                      // Split if not touching the first block
                      let blocksToMove = dragStk.blocks;
                      let remainingBlocks: typeof dragStk.blocks | null = null;
                      if (blockIdx > 0 && dragStk.blocks.length > blockIdx) {
                        blocksToMove = dragStk.blocks.slice(blockIdx);
                        remainingBlocks = dragStk.blocks.slice(0, blockIdx);
                      }

                      // Position of the split portion = y + offset of block at blockIdx
                      const splitOffsetY = blockIdx > 0 ? accumHeight(id, blockIdx) : 0;
                      const moveY = y + splitOffsetY;

                      const effectiveDrag: BlockStack = { id, x, y: moveY, blocks: blocksToMove };
                      const snap = findSnap(effectiveDrag, x, moveY);

                      let next: BlockStack[];
                      if (snap) {
                        const base = remainingBlocks
                          ? stks.map((s: BlockStack) => s.id === id ? { ...s, blocks: remainingBlocks! } : s)
                          : stks.filter((s: BlockStack) => s.id !== id);
                        next = base.map((s: BlockStack) => {
                          if (s.id !== snap.id) return s;
                          const merged = [...s.blocks];
                          merged.splice(snap.insertAt, 0, ...blocksToMove);
                          return { ...s, blocks: merged };
                        });
                      } else if (remainingBlocks) {
                        // Split without snap: keep top portion in place, new stack for moved blocks
                        const splitId = `sp_${Date.now()}`;
                        next = [
                          ...stks.map((s: BlockStack) => s.id === id ? { ...s, blocks: remainingBlocks! } : s),
                          { id: splitId, x, y: moveY, blocks: blocksToMove },
                        ];
                      } else {
                        next = stks.map((s: BlockStack) => s.id === id ? { ...s, x, y } : s);
                      }
                      localStacksRef.current = next;
                      setStacks(next);
                    }}
                    onTap={(touchedY) => {
                      const blockIdx = blockIdxAt(stack.id, touchedY);
                      const tappedBlock = stack.blocks[blockIdx] ?? stack.blocks[0];
                      if (!tappedBlock) return;
                      if (isTouchEvent(tappedBlock)) {
                        handleEventTap(tappedBlock, stack.blocks, blockIdx);
                      } else {
                        handleBlockTap(tappedBlock);
                      }
                    }}
                  >
                    {stackContent}
                  </NativeStackDragger>
                );
              }
              return stackContent;
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

  // Insertion gap spacer shown inside the target stack
  insertSpacer: {
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
    borderStyle: 'dashed',
    backgroundColor: 'rgba(255,255,255,0.06)',
  } as any,

  runningBar: {
    position: 'absolute', top: 0, left: 0, right: 0,
    height: 3, backgroundColor: '#22C55E', zIndex: 10,
  },
  usbBanner: { backgroundColor: '#EF4444', paddingVertical: 12, paddingHorizontal: 20, zIndex: 20 },
  usbBannerText: { color: '#FFF', fontSize: 15, fontWeight: '700', textAlign: 'center' },
  guideMessage: {
    position: 'absolute',
    top: 24,
    left: 32,
  },
  guideText: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 21,
  },

  // ── Play / Stop FAB ──────────────────────────────────────────────────────
  // To restyle: change size, borderRadius, backgroundColor, fabStop.backgroundColor
  fab: {
    position: 'absolute', bottom: 20, right: 20, zIndex: 20,
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: '#5BC4D1',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3, shadowRadius: 4,
  },
  fabInactive: {
    opacity: 0.25,
  },
  fabStop: {
    // same background as play — icon change alone signals the state
  },
  fabIcon: {
    color: '#FFF',
    fontSize: 18,
    lineHeight: 22,
  },
});
