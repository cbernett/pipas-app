import React, { createContext, useContext, useState, useRef, useCallback, useEffect, ReactNode } from 'react';
import { BlockDef, EXAMPLE_PROGRAM } from '../data/blocks';
import { playSound } from '../audio';
import { board } from '../serial';

export type BoardStatus = 'connected' | 'disconnected' | 'error';

export interface WorkspaceBlock {
  id: string;
  defId: string;
  label: string;
  category: string;
  color: string;
  /** Blocks nested inside bracket/C blocks (repita, sempre, se então) */
  innerBlocks?: WorkspaceBlock[];
}

interface AppContextType {
  boardStatus: BoardStatus;
  setBoardStatus: (s: BoardStatus) => void;
  /** index of the block currently highlighted during execution; null when idle */
  activeBlockIndex: number | null;
  stopRun: () => void;
  simulateTouch: (pad: number) => void;
  /** Tap a single block to preview its immediate effect (plays sound, etc.) */
  tapBlock: (block: WorkspaceBlock) => void;
  /** Run the script starting from a given block, arming if needed */
  triggerScript: (blocksFromHere: WorkspaceBlock[]) => void;
  activeTab: 'codigo' | 'sons';
  setActiveTab: (t: 'codigo' | 'sons') => void;
  workspaceBlocks: WorkspaceBlock[];
  setWorkspaceBlocks: (b: WorkspaceBlock[]) => void;
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
  // Only "espere" blocks use their explicit duration
  const waitMatch = label.match(/espere\s+([\d.]+)/);
  if (waitMatch) return Math.min(parseFloat(waitMatch[1]) * 1000, 5000);
  // Everything else: just long enough to see the highlight flash
  if (block.category === 'Eventos') return 100;
  if (block.category === 'Som')     return 350; // sound fires async; small pause feels natural
  return 200;
}

// Flatten blocks for sequential execution (includes innerBlocks)
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
  if (label.includes('toque som')) {
    const soundMatch = label.match(/toque som\s+(.+)/);
    const name = soundMatch?.[1]?.trim() ?? 'menu';
    await playSound(name).catch(() => {});
  }
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [boardStatus, setBoardStatus] = useState<BoardStatus>('disconnected');
  const [activeBlockIndex, setActiveBlockIndex] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'codigo' | 'sons'>('codigo');
  const [workspaceBlocks, setWorkspaceBlocks] = useState<WorkspaceBlock[]>([]);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [boardSheetOpen, setBoardSheetOpen] = useState(false);
  const [usbDisconnectedWhileRunning, setUsbDisconnectedWhileRunning] = useState(false);
  const [draggingBlock, setDraggingBlock] = useState<BlockDef | null>(null);

  const runAbortRef      = useRef(false);
  const isExecutingRef   = useRef(false); // true only while stepping through blocks
  const isRunningRef     = useRef(true);  // always armed — program always listens
  const workspaceBlocksRef = useRef<WorkspaceBlock[]>([]);
  const executeScriptRef = useRef<(blocks: WorkspaceBlock[]) => void>(() => {});

  const _setWorkspaceBlocks = useCallback((b: WorkspaceBlock[]) => {
    workspaceBlocksRef.current = b;
    setWorkspaceBlocks(b);
  }, []);

  const stopRun = useCallback(() => {
    // Abort current execution but stay armed — program keeps listening
    runAbortRef.current = true;
    isExecutingRef.current = false;
    setActiveBlockIndex(null);
    setUsbDisconnectedWhileRunning(false);
    // Re-enable execution on next touch
    setTimeout(() => { runAbortRef.current = false; }, 50);
  }, []);

  // Execute a flat list of blocks sequentially, with highlight
  const executeScript = useCallback(async (blocks: WorkspaceBlock[]) => {
    if (!blocks.length) return;
    isExecutingRef.current = true;
    const flat = flattenBlocks(blocks);

    for (let i = 0; i < flat.length; i++) {
      if (runAbortRef.current) break;
      setActiveBlockIndex(i);
      await executeBlock(flat[i]);
      if (runAbortRef.current) break;
      const dur = blockDuration(flat[i]);
      await new Promise<void>((resolve) => {
        const t = setTimeout(resolve, dur);
        const poll = setInterval(() => {
          if (runAbortRef.current) { clearTimeout(t); clearInterval(poll); resolve(); }
        }, 50);
        setTimeout(() => clearInterval(poll), dur + 100);
      });
    }
    isExecutingRef.current = false;
    if (!runAbortRef.current) setActiveBlockIndex(null);
    // Stay in listening mode (isRunning stays true) — stop only via stopRun()
  }, []);

  useEffect(() => { executeScriptRef.current = executeScript; }, [executeScript]);

  // Handle touch pad event from board or simulation
  // Works whether or not the program is "armed" — board touch always triggers
  const handleTouchPad = useCallback((pad: number) => {
    if (isExecutingRef.current) return; // already mid-execution — ignore

    // Use workspace blocks if any, otherwise fall back to the example program
    const blocks = workspaceBlocksRef.current.length > 0
      ? workspaceBlocksRef.current
      : EXAMPLE_PROGRAM as WorkspaceBlock[];
    if (!blocks.length) return;

    // Match touch event block for this pad:
    //   luz_1/luz_2/luz_3 = library touch blocks (pad 1/2/3)
    //   any label containing "toque {pad}" = example program or renamed blocks
    const startIdx = blocks.findIndex(b => {
      if (b.defId === `luz_${pad}`) return true;
      if (b.label.toLowerCase().includes(`toque ${pad}`)) return true;
      return false;
    });

    const script = startIdx >= 0 ? blocks.slice(startIdx) : blocks;

    runAbortRef.current = false;
    executeScriptRef.current(script);
  }, []);

  useEffect(() => board.onTouch(handleTouchPad), [handleTouchPad]);


  const simulateTouch = useCallback((pad: number) => handleTouchPad(pad), [handleTouchPad]);

  /** Preview a single block's effect immediately — no arm state required */
  const tapBlock = useCallback((block: WorkspaceBlock) => {
    executeBlock(block).catch(() => {});
  }, []);

  /** Run from this block downward */
  const triggerScript = useCallback((blocksFromHere: WorkspaceBlock[]) => {
    if (!blocksFromHere.length) return;
    if (isExecutingRef.current) return;
    runAbortRef.current = false;
    executeScriptRef.current(blocksFromHere);
  }, []);

  return (
    <AppContext.Provider value={{
      boardStatus, setBoardStatus,
      activeBlockIndex,
      stopRun, simulateTouch, tapBlock, triggerScript,
      activeTab, setActiveTab,
      workspaceBlocks, setWorkspaceBlocks: _setWorkspaceBlocks,
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
