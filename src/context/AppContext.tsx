import React, { createContext, useContext, useState, useRef, useCallback, useEffect, ReactNode } from 'react';
import { BlockDef, BlockStack, WorkspaceBlock } from '../data/blocks';
import { playSound } from '../audio';
import { board } from '../serial';

export type BoardStatus = 'connected' | 'disconnected' | 'error';
export type { WorkspaceBlock, BlockStack };

interface AppContextType {
  boardStatus: BoardStatus;
  setBoardStatus: (s: BoardStatus) => void;
  activeBlockId: string | null;
  stopRun: () => void;
  simulateTouch: (pad: number) => void;
  tapBlock: (block: WorkspaceBlock) => void;
  triggerScript: (blocks: WorkspaceBlock[]) => void;
  activeTab: 'codigo' | 'sons';
  setActiveTab: (t: 'codigo' | 'sons') => void;
  stacks: BlockStack[];
  setStacks: (s: BlockStack[]) => void;
  addStack: (block: WorkspaceBlock, x?: number, y?: number) => void;
  libraryOpen: boolean;
  setLibraryOpen: (o: boolean) => void;
  expandedCategory: string | null;
  setExpandedCategory: (c: string | null) => void;
  boardSheetOpen: boolean;
  setBoardSheetOpen: (o: boolean) => void;
  usbDisconnectedWhileRunning: boolean;
  setUsbDisconnectedWhileRunning: (v: boolean) => void;
  draggingBlock: BlockDef | null;
  setDraggingBlock: (b: BlockDef | null) => void;
}

const AppContext = createContext<AppContextType | null>(null);
export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be inside AppProvider');
  return ctx;
};

function blockDuration(block: WorkspaceBlock): number {
  const label = block.label.toLowerCase();
  const waitMatch = label.match(/espere\s+([\d.]+)/);
  if (waitMatch) return Math.min(parseFloat(waitMatch[1]) * 1000, 5000);
  if (block.category === 'Eventos') return 100;
  if (block.category === 'Som')     return 350;
  return 200;
}

function flattenBlocks(blocks: WorkspaceBlock[]): WorkspaceBlock[] {
  const out: WorkspaceBlock[] = [];
  for (const b of blocks) {
    out.push(b);
    if (b.innerBlocks?.length) out.push(...flattenBlocks(b.innerBlocks));
  }
  return out;
}

async function executeBlock(block: WorkspaceBlock): Promise<void> {
  const label = block.label.toLowerCase();
  const defId = block.defId;

  if (label.includes('toque som') || defId === 'som_1') {
    const m = label.match(/toque som\s+(.+)/);
    await playSound(m?.[1]?.trim() ?? 'meow!').catch(() => {});
  } else if (defId === 'luz_4') {                         // ligue LED
    const n = parseInt(label.match(/\d+/)?.[0] ?? '1');
    await board.sendCommand(1, n).catch(() => {});
  } else if (defId === 'luz_5') {                         // desligue LED
    const n = parseInt(label.match(/\d+/)?.[0] ?? '1');
    await board.sendCommand(0, n).catch(() => {});
  } else if (defId === 'luz_6') {                         // pisque LED
    const n = parseInt(label.match(/\d+/)?.[0] ?? '1');
    await board.sendCommand(1, n).catch(() => {});
    await new Promise(r => setTimeout(r, 300));
    await board.sendCommand(0, n).catch(() => {});
  } else if (defId === 'luz_7') {                         // ligue motor
    await board.sendCommand(2, 1).catch(() => {});
  } else if (defId === 'luz_8') {                         // desligue motor
    await board.sendCommand(2, 0).catch(() => {});
  }
}

function findTouchStack(stacks: BlockStack[], pad: number): WorkspaceBlock[] | null {
  for (const stack of stacks) {
    const idx = stack.blocks.findIndex(b =>
      b.defId === `evt_touch_${pad}` ||
      b.defId === `luz_${pad}` ||
      b.label.toLowerCase().includes(`toque ${pad}`)
    );
    if (idx >= 0) return stack.blocks.slice(idx);
  }
  return null;
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [boardStatus, setBoardStatus] = useState<BoardStatus>('disconnected');
  const [activeBlockId, setActiveBlockId] = useState<string | null>(null);
  const [activeTab, setActiveTab]         = useState<'codigo' | 'sons'>('codigo');
  const [stacks, setStacks]               = useState<BlockStack[]>([]);
  const [libraryOpen, setLibraryOpen]     = useState(false);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [boardSheetOpen, setBoardSheetOpen]     = useState(false);
  const [usbDisconnectedWhileRunning, setUsbDisconnectedWhileRunning] = useState(false);
  const [draggingBlock, setDraggingBlock] = useState<BlockDef | null>(null);

  const runAbortRef    = useRef(false);
  const isExecutingRef = useRef(false);
  const stacksRef      = useRef<BlockStack[]>(stacks);
  const execRef        = useRef<(blocks: WorkspaceBlock[]) => void>(() => {});

  useEffect(() => { stacksRef.current = stacks; }, [stacks]);

  const stopRun = useCallback(() => {
    runAbortRef.current = true;
    isExecutingRef.current = false;
    setActiveBlockId(null);
    setUsbDisconnectedWhileRunning(false);
    setTimeout(() => { runAbortRef.current = false; }, 50);
  }, []);

  const executeScript = useCallback(async (blocks: WorkspaceBlock[]) => {
    if (!blocks.length) return;
    isExecutingRef.current = true;
    runAbortRef.current = false;
    const flat = flattenBlocks(blocks);

    for (const block of flat) {
      if (runAbortRef.current) break;
      setActiveBlockId(block.id);
      await executeBlock(block);
      if (runAbortRef.current) break;
      await new Promise<void>((resolve) => {
        const dur = blockDuration(block);
        const t   = setTimeout(resolve, dur);
        const poll = setInterval(() => {
          if (runAbortRef.current) { clearTimeout(t); clearInterval(poll); resolve(); }
        }, 50);
        setTimeout(() => clearInterval(poll), dur + 100);
      });
    }

    isExecutingRef.current = false;
    if (!runAbortRef.current) setActiveBlockId(null);
  }, []);

  useEffect(() => { execRef.current = executeScript; }, [executeScript]);

  const handleTouchPad = useCallback((pad: number) => {
    if (isExecutingRef.current) return;
    const activStacks = stacksRef.current;
    const script = findTouchStack(activStacks, pad) ?? null;
    if (!script) return;
    runAbortRef.current = false;
    execRef.current(script);
  }, []);

  useEffect(() => board.onTouch(handleTouchPad), [handleTouchPad]);

  const tapBlock = useCallback((block: WorkspaceBlock) => {
    executeBlock(block).catch(() => {});
  }, []);

  const triggerScript = useCallback((blocks: WorkspaceBlock[]) => {
    if (isExecutingRef.current) return;
    runAbortRef.current = false;
    execRef.current(blocks);
  }, []);

  const simulateTouch = useCallback((pad: number) => handleTouchPad(pad), [handleTouchPad]);

  const addStack = useCallback((block: WorkspaceBlock, x = 40, y = 40) => {
    const newStack: BlockStack = {
      id: `stack_${Date.now()}`,
      x, y,
      blocks: [{
        ...block,
        id: `ws_${Date.now()}_${block.id}`,
      }],
    };
    setStacks(prev => [...prev, newStack]);
    setLibraryOpen(false);
  }, []);

  return (
    <AppContext.Provider value={{
      boardStatus, setBoardStatus,
      activeBlockId, stopRun, simulateTouch, tapBlock, triggerScript,
      activeTab, setActiveTab,
      stacks, setStacks, addStack,
      libraryOpen, setLibraryOpen,
      expandedCategory, setExpandedCategory,
      boardSheetOpen, setBoardSheetOpen,
      usbDisconnectedWhileRunning, setUsbDisconnectedWhileRunning,
      draggingBlock, setDraggingBlock,
    }}>
      {children}
    </AppContext.Provider>
  );
}
