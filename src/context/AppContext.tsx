import React, { createContext, useContext, useState, useRef, useCallback, useEffect, ReactNode } from 'react';
import { Platform } from 'react-native';
import { BlockDef, BlockStack, WorkspaceBlock, BLOCK_TEMPLATES } from '../data/blocks';
import { liveParamValues } from '../components/CodeBlock';
import { playSound } from '../audio';
import { board } from '../serial';

export type BoardStatus = 'connected' | 'disconnected' | 'error';
export type { WorkspaceBlock, BlockStack };

export interface UserSound {
  id: string;
  name: string;
  uri: string; // blob URL
}

interface AppContextType {
  boardStatus: BoardStatus;
  setBoardStatus: (s: BoardStatus) => void;
  activeBlockId: string | null;
  stopRun: () => void;
  simulateTouch: (pad: number) => void;
  userSounds: UserSound[];
  addUserSound: (name: string, uri: string) => void;
  deleteUserSound: (id: string) => void;
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
  trashHover: boolean;
  setTrashHover: (v: boolean) => void;
}

const AppContext = createContext<AppContextType | null>(null);
export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be inside AppProvider');
  return ctx;
};

/** Read the live (user-edited) number value for a param, falling back to template default. */
function liveNumber(block: WorkspaceBlock, paramIdx: number): number {
  const live = liveParamValues.get(`${block.id}_${paramIdx}`);
  if (live !== undefined) return parseFloat(live) || 0;
  const parts = BLOCK_TEMPLATES[block.defId];
  if (parts) {
    const part = parts[paramIdx];
    if (part && typeof part === 'object' && part.type === 'number') return parseFloat(part.value) || 0;
  }
  return 0;
}

function blockDuration(block: WorkspaceBlock): number {
  // ctrl_1 / ctrl_1b = espere N segundo(s)
  if (block.defId === 'ctrl_1' || block.defId === 'ctrl_1b') {
    const n = liveNumber(block, 1);  // param index 1 = the number
    return Math.min(n * 1000, 10000);
  }
  const label = block.label.toLowerCase();
  const waitMatch = label.match(/espere\s+([\d.]+)/);
  if (waitMatch) return Math.min(parseFloat(waitMatch[1]) * 1000, 10000);
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

async function executeBlock(
  block: WorkspaceBlock,
  getUserSounds: () => UserSound[],
): Promise<void> {
  const label = block.label.toLowerCase();
  const defId = block.defId;

  if (label.includes('toque som') || defId === 'som_1' ||
      label.includes('toque até parar') || defId === 'som_4') {
    // liveParamValues holds the current dropdown selection; param index 1 is the sound name
    const soundName = liveParamValues.get(`${block.id}_1`)
      ?? label.match(/toque (?:som|até parar)\s+(.+)/)?.[1]?.trim()
      ?? 'meow!';
    const userSound = getUserSounds().find(s => s.name === soundName);
    if (userSound && Platform.OS === 'web') {
      await new Promise<void>(resolve => {
        const audio = new Audio(userSound.uri);
        audio.onended = () => resolve();
        audio.onerror = () => resolve();
        audio.play().catch(() => resolve());
      });
    } else {
      await playSound(soundName).catch(() => {});
    }
  } else if (defId === 'luz_4') {                         // ligue LED
    // Firmware: pins[] = {13,5,6,12}. Board "LED pin N" = pins[N-1], so subtract 1.
    // LEDs are wired active-high (anode→pin, cathode→GND).
    // Firmware does digitalWrite(!value), so to drive pin HIGH (LED on) we send value=0.
    const ledType = (Math.round(liveNumber(block, 1)) || 1) - 1;
    await board.sendCommand(ledType, 1).catch(() => {});  // value=1 → !1=LOW → LED on
  } else if (defId === 'luz_5') {                         // desligue LED
    const ledType = (Math.round(liveNumber(block, 1)) || 1) - 1;
    await board.sendCommand(ledType, 0).catch(() => {});  // value=0 → !0=HIGH → LED off
  } else if (defId === 'luz_6') {                         // pisque LED
    const ledType = (Math.round(liveNumber(block, 1)) || 1) - 1;
    await board.sendCommand(ledType, 1).catch(() => {});  // on
    await new Promise(r => setTimeout(r, 300));
    await board.sendCommand(ledType, 0).catch(() => {});  // off
  } else if (defId === 'luz_7') {                         // ligue motor N
    const motor = Math.round(liveNumber(block, 1)) || 1;
    // motor 1 → pin index 2, motor 2 → pin index 3
    await board.sendCommand(motor + 1, 1).catch(() => {});
  } else if (defId === 'luz_8') {                         // desligue motor N
    const motor = Math.round(liveNumber(block, 1)) || 1;
    await board.sendCommand(motor + 1, 0).catch(() => {});
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
  const [trashHover, setTrashHover]       = useState(false);

  // ── User-recorded sounds ─────────────────────────────────────────────────
  const [userSounds, setUserSounds] = useState<UserSound[]>([]);
  const userSoundsRef = useRef<UserSound[]>([]);
  useEffect(() => { userSoundsRef.current = userSounds; }, [userSounds]);

  const addUserSound = useCallback((name: string, uri: string) => {
    const s: UserSound = { id: `usr_${Date.now()}`, name, uri };
    setUserSounds(prev => [...prev, s]);
  }, []);

  const deleteUserSound = useCallback((id: string) => {
    setUserSounds(prev => prev.filter(s => s.id !== id));
  }, []);

  const runAbortRef    = useRef(false);
  const isExecutingRef = useRef(false);
  // Track on/off state for LEDs and motors so 'se … então' can check them
  const deviceStateRef = useRef<Record<string, boolean>>({});
  const stacksRef      = useRef<BlockStack[]>(stacks);
  const execRef        = useRef<(blocks: WorkspaceBlock[]) => Promise<void>>(() => Promise.resolve());

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
    deviceStateRef.current = {}; // reset device state at start of each run

    // Recursive runner — handles bracket blocks (repita / sempre / se)
    const runBlocks = async (bs: WorkspaceBlock[]): Promise<void> => {
      for (const block of bs) {
        if (runAbortRef.current) break;

        // ── repita N vezes ──────────────────────────────────────────────
        if (block.defId === 'ctrl_2') {
          const n = Math.max(1, Math.round(liveNumber(block, 1))) || 10;
          for (let i = 0; i < n; i++) {
            if (runAbortRef.current) break;
            await runBlocks(block.innerBlocks ?? []);
          }
          continue;
        }

        // ── sempre (loop forever) ───────────────────────────────────────
        if (block.defId === 'ctrl_3') {
          while (!runAbortRef.current) {
            await runBlocks(block.innerBlocks ?? []);
          }
          continue;
        }

        // ── se [device] está [ligado/desligado] então ────────────────────
        if (block.defId === 'ctrl_4') {
          const device = liveParamValues.get(`${block.id}_1`) ?? 'LED 1';   // e.g. "LED 1"
          const state  = liveParamValues.get(`${block.id}_2`) ?? 'ligado';  // "ligado" | "desligado"
          const key    = device.toLowerCase().replace(' ', '_');             // "led_1", "motor_2"
          const isOn   = deviceStateRef.current[key] ?? false;
          const condMet = state === 'ligado' ? isOn : !isOn;
          if (condMet) await runBlocks(block.innerBlocks ?? []);
          continue;
        }

        // ── regular action block ────────────────────────────────────────
        setActiveBlockId(block.id);
        await executeBlock(block, () => userSoundsRef.current);
        // Track LED/motor state so 'se … então' can check it
        if (block.defId === 'luz_4') {
          const n = Math.round(liveNumber(block, 1)) || 1;
          deviceStateRef.current[`led_${n}`] = true;
        } else if (block.defId === 'luz_5' || block.defId === 'luz_6') {
          const n = Math.round(liveNumber(block, 1)) || 1;
          deviceStateRef.current[`led_${n}`] = false;
        } else if (block.defId === 'luz_7') {
          const n = Math.round(liveNumber(block, 1)) || 1;
          deviceStateRef.current[`motor_${n}`] = true;
        } else if (block.defId === 'luz_8') {
          const n = Math.round(liveNumber(block, 1)) || 1;
          deviceStateRef.current[`motor_${n}`] = false;
        }
        if (runAbortRef.current) break;
        await new Promise<void>((resolve) => {
          const dur  = blockDuration(block);
          const t    = setTimeout(resolve, dur);
          const poll = setInterval(() => {
            if (runAbortRef.current) { clearTimeout(t); clearInterval(poll); resolve(); }
          }, 50);
          setTimeout(() => clearInterval(poll), dur + 100);
        });
      }
    };

    try {
      await runBlocks(blocks);
    } catch (_) {
      // swallow unexpected errors so the lock is always released
    } finally {
      isExecutingRef.current = false;
      if (!runAbortRef.current) setActiveBlockId(null);
    }
  }, []);

  useEffect(() => { execRef.current = executeScript; }, [executeScript]);

  const handleTouchPad = useCallback((pad: number) => {
    const activStacks = stacksRef.current;
    const script = findTouchStack(activStacks, pad) ?? null;
    if (!script) return;

    if (isExecutingRef.current) {
      // "toque até parar" → play to end, ignore re-triggers
      const hasPlayUntilEnd = flattenBlocks(script).some(b => b.defId === 'som_4');
      if (hasPlayUntilEnd) return;
      // All other scripts → stop and restart
      stopRun();
      setTimeout(() => {
        runAbortRef.current = false;
        execRef.current(script).catch(() => { isExecutingRef.current = false; });
      }, 30);
      return;
    }

    runAbortRef.current = false;
    execRef.current(script).catch(() => { isExecutingRef.current = false; });
  }, [stopRun]);

  useEffect(() => board.onTouch(handleTouchPad), [handleTouchPad]);

  const tapBlock = useCallback((block: WorkspaceBlock) => {
    executeBlock(block, () => userSoundsRef.current).catch(() => {});
  }, []);

  const triggerScript = useCallback((blocks: WorkspaceBlock[]) => {
    if (isExecutingRef.current) {
      // som_4 "toque até parar" → play to end, ignore re-triggers
      const hasPlayUntilEnd = flattenBlocks(blocks).some(b => b.defId === 'som_4');
      if (hasPlayUntilEnd) return;
      // All other scripts → stop current execution and restart
      stopRun();
      setTimeout(() => {
        runAbortRef.current = false;
        execRef.current(blocks).catch(() => { isExecutingRef.current = false; });
      }, 30);
      return;
    }
    runAbortRef.current = false;
    execRef.current(blocks).catch(() => { isExecutingRef.current = false; });
  }, [stopRun]);

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
      trashHover, setTrashHover,
      userSounds, addUserSound, deleteUserSound,
    }}>
      {children}
    </AppContext.Provider>
  );
}
