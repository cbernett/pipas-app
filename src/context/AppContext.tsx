import React, { createContext, useContext, useState, useRef, useCallback, ReactNode } from 'react';
import { BlockDef } from '../data/blocks';
import { playSound } from '../audio';

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

  const stopRun = useCallback(() => {
    runAbortRef.current = true;
    setIsRunning(false);
    setActiveBlockIndex(null);
    setUsbDisconnectedWhileRunning(false);
  }, []);

  const startRun = useCallback(async (blocks: WorkspaceBlock[]) => {
    if (!blocks.length) return;
    runAbortRef.current = false;
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
    }
  }, []);

  return (
    <AppContext.Provider
      value={{
        boardStatus, setBoardStatus,
        isRunning, activeBlockIndex,
        startRun, stopRun,
        activeTab, setActiveTab,
        workspaceBlocks, setWorkspaceBlocks,
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
