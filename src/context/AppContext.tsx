import React, { createContext, useContext, useState, ReactNode } from 'react';
import { BlockDef } from '../data/blocks';

export type BoardStatus = 'connected' | 'disconnected' | 'error';
export type AppScreen =
  | 'codigo_empty'
  | 'codigo_working'
  | 'library_open'
  | 'movimento_expanded'
  | 'luz_expanded'
  | 'som_expanded'
  | 'eventos_expanded'
  | 'controle_expanded'
  | 'dragging_block'
  | 'block_connected'
  | 'board_connected_sheet'
  | 'board_disconnected_sheet'
  | 'board_error_sheet'
  | 'running'
  | 'usb_disconnected_running'
  | 'sons_list'
  | 'record_sound'
  | 'sound_selected';

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
  setIsRunning: (r: boolean) => void;
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

export function AppProvider({ children }: { children: ReactNode }) {
  const [boardStatus, setBoardStatus] = useState<BoardStatus>('disconnected');
  const [isRunning, setIsRunning] = useState(false);
  const [activeTab, setActiveTab] = useState<'codigo' | 'sons'>('codigo');
  const [workspaceBlocks, setWorkspaceBlocks] = useState<WorkspaceBlock[]>([]);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [boardSheetOpen, setBoardSheetOpen] = useState(false);
  const [usbDisconnectedWhileRunning, setUsbDisconnectedWhileRunning] = useState(false);
  const [draggingBlock, setDraggingBlock] = useState<BlockDef | null>(null);

  return (
    <AppContext.Provider
      value={{
        boardStatus, setBoardStatus,
        isRunning, setIsRunning,
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
