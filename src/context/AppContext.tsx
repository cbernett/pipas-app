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
}

interface AppContextType {
  boardStatus: BoardStatus;
  setBoardStatus: (s: BoardStatus) => void;
  isRunning: boolean;
  activeBlockIndex: number | null;
  startRun: (blocks: WorkspaceBlock[]) => void;
  stopRun: () => void;
  simulateTouch: (pad: number) => void;
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

// Determine how long a block takes to "execute" in ms
function blockDuration(block: WorkspaceBlock): number {
  const label = block.label.toLowerCase();
  // Parse "espere X segundo(s)"
  const waitMatch = label.match(/espere\s+([\d.]+)/);
  if (waitMatch) return Math.min(parseFloat(waitMatch[1]) * 1000, 5000);
  if (block.category === 'Eventos') return 400;
  if (block.category === 'Som') return 1200;
  return 600;
}

// Side-effect simulation per block
async function executeBlock(block: WorkspaceBlock): Promise<void> {
  const label = block.label.toLowerCase();
  if (label.includes('toque som') || label.includes('toque som')) {
    // Try to extract sound name from the defId template
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

  const runAbortRef = useRef(false);
  const workspaceBlocksRef = useRef<WorkspaceBlock[]>([]);
  const isRunningRef = useRef(false);

  // Keep refs in sync so touch handler can access latest values
  const _setWorkspaceBlocks = useCallback((b: WorkspaceBlock[]) => {
    workspaceBlocksRef.current = b;
    setWorkspaceBlocks(b);
  }, []);

  // Find and run the script triggered by a touch pad event
  const handleTouchPad = useCallback((pad: number) => {
    if (isRunningRef.current) return; // already running
    const blocks = workspaceBlocksRef.current;
    // Find the first event block that matches this touch pad
    const startIdx = blocks.findIndex(b =>
      b.category === 'Eventos' && b.label.toLowerCase().includes(`toque ${pad}`)
    );
    if (startIdx === -1) return;
    // Run from that block downward
    startRunRef.current(blocks.slice(startIdx));
  }, []);

  const startRunRef = useRef<(blocks: WorkspaceBlock[]) => void>(() => {});

  // Subscribe to real board touch events
  useEffect(() => {
    return board.onTouch(handleTouchPad);
  }, [handleTouchPad]);

  const stopRun = useCallback(() => {
    runAbortRef.current = true;
    isRunningRef.current = false;
    setIsRunning(false);
    setActiveBlockIndex(null);
    setUsbDisconnectedWhileRunning(false);
  }, []);

  const startRun = useCallback(async (blocks: WorkspaceBlock[]) => {
    if (!blocks.length) return;
    runAbortRef.current = false;
    isRunningRef.current = true;
    setIsRunning(true);
    setActiveBlockIndex(null);

    for (let i = 0; i < blocks.length; i++) {
      if (runAbortRef.current) break;
      setActiveBlockIndex(i);

      // Fire side effects (sound, etc.)
      await executeBlock(blocks[i]);
      if (runAbortRef.current) break;

      // Wait for the block's duration
      const dur = blockDuration(blocks[i]);
      await new Promise<void>((resolve) => {
        const t = setTimeout(resolve, dur);
        // Poll for abort
        const poll = setInterval(() => {
          if (runAbortRef.current) { clearTimeout(t); clearInterval(poll); resolve(); }
        }, 50);
        setTimeout(() => clearInterval(poll), dur + 100);
      });
    }

    if (!runAbortRef.current) {
      setActiveBlockIndex(null);
      setIsRunning(false);
      isRunningRef.current = false;
    }
  }, []);

  // Keep startRunRef in sync so handleTouchPad can call startRun
  useEffect(() => { startRunRef.current = startRun; }, [startRun]);

  const simulateTouch = useCallback((pad: number) => {
    handleTouchPad(pad);
  }, [handleTouchPad]);

  return (
    <AppContext.Provider
      value={{
        boardStatus, setBoardStatus,
        isRunning, activeBlockIndex,
        startRun, stopRun, simulateTouch,
        activeTab, setActiveTab,
        workspaceBlocks, setWorkspaceBlocks: _setWorkspaceBlocks,
        libraryOpen, setLibraryOpen,
        expandedCategory, setExpandedCategory,
        boardSheetOpen, setBoardSheetOpen,
        usbDisconnectedWhileRunning, setUsbDisconnectedWhileRunning,
        draggingBlock, setDraggingBlock,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}
