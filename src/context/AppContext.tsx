import React, { createContext, useContext, useState, useRef, useCallback, useEffect, ReactNode } from 'react';
import { BlockDef } from '../data/blocks';
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
  /** true when program is armed (listening for events or actively running) */
  isRunning: boolean;
  /** index of the block currently highlighted during execution; null when idle/listening */
  activeBlockIndex: number | null;
  armProgram: (blocks: WorkspaceBlock[]) => void;
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
  const waitMatch = label.match(/espere\s+([\d.]+)/);
  if (waitMatch) return Math.min(parseFloat(waitMatch[1]) * 1000, 5000);
  if (block.category === 'Eventos') return 500;
  if (block.category === 'Som') return 1200;
  return 600;
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
  const [isRunning, setIsRunning] = useState(false);
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
  const isRunningRef     = useRef(false); // true while armed (listening)
  const workspaceBlocksRef = useRef<WorkspaceBlock[]>([]);
  const executeScriptRef = useRef<(blocks: WorkspaceBlock[]) => void>(() => {});

  const _setWorkspaceBlocks = useCallback((b: WorkspaceBlock[]) => {
    workspaceBlocksRef.current = b;
    setWorkspaceBlocks(b);
  }, []);

  const stopRun = useCallback(() => {
    runAbortRef.current = true;
    isRunningRef.current = false;
    isExecutingRef.current = false;
    setIsRunning(false);
    setActiveBlockIndex(null);
    setUsbDisconnectedWhileRunning(false);
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
  const handleTouchPad = useCallback((pad: number) => {
    if (isExecutingRef.current) return; // already executing — ignore
    if (!isRunningRef.current) return;  // not armed — ignore

    // Find matching event block
    const blocks = workspaceBlocksRef.current;
    const startIdx = blocks.findIndex(b =>
      b.category === 'Eventos' && b.label.toLowerCase().includes(`toque ${pad}`)
    );
    const script = startIdx >= 0 ? blocks.slice(startIdx) : blocks;
    executeScriptRef.current(script);
  }, []);

  useEffect(() => board.onTouch(handleTouchPad), [handleTouchPad]);

  /** Arm the program: enter listening mode and immediately do a preview run */
  const armProgram = useCallback((blocks: WorkspaceBlock[]) => {
    if (!blocks.length) return;
    runAbortRef.current = false;
    isRunningRef.current = true;
    setIsRunning(true);
    setActiveBlockIndex(null);
    // Immediately preview-run the full script
    executeScriptRef.current(blocks);
  }, []);

  const simulateTouch = useCallback((pad: number) => handleTouchPad(pad), [handleTouchPad]);

  /** Preview a single block's effect immediately — no arm state required */
  const tapBlock = useCallback((block: WorkspaceBlock) => {
    executeBlock(block).catch(() => {});
  }, []);

  /** Run from this block downward, arming the program first if not already armed */
  const triggerScript = useCallback((blocksFromHere: WorkspaceBlock[]) => {
    if (!blocksFromHere.length) return;
    if (isExecutingRef.current) return; // already mid-run
    runAbortRef.current = false;
    isRunningRef.current = true;
    setIsRunning(true);
    executeScriptRef.current(blocksFromHere);
  }, []);

  return (
    <AppContext.Provider value={{
      boardStatus, setBoardStatus,
      isRunning, activeBlockIndex,
      armProgram, stopRun, simulateTouch, tapBlock, triggerScript,
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
