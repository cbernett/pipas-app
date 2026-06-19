import React, { useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { BlockDef, CATEGORY_COLORS, CATEGORY_DARK, BlockCategory } from '../data/blocks';
import { useApp, WorkspaceBlock } from '../context/AppContext';
import CodeBlock from './CodeBlock';

interface Props {
  category: BlockCategory;
  blocks: BlockDef[];
  isExpanded: boolean;
  onToggle: () => void;
}

const DRAG_MIN = 8;

// Tracks placement count so each tapped block lands in a different spot
let nativePlaceCount = 0;

function LibraryBlockItemWeb({ block, addStack }: { block: BlockDef; addStack: (b: WorkspaceBlock, x?: number, y?: number) => void }) {
  const ref = useRef<View>(null);

  const wsBlock: WorkspaceBlock = {
    id: block.id,
    defId: block.id,
    label: block.label,
    category: block.category,
    color: CATEGORY_COLORS[block.category as BlockCategory],
  };

  useEffect(() => {
    if (!ref.current) return;
    const el = (ref.current as any) as HTMLElement;

    const onDown = (e: PointerEvent) => {
      e.stopPropagation();
      const startX = e.clientX;
      const startY = e.clientY;
      let hasMoved = false;
      let ghost: HTMLElement | null = null;

      const onMove = (ev: PointerEvent) => {
        const d = Math.abs(ev.clientX - startX) + Math.abs(ev.clientY - startY);
        if (!hasMoved && d > DRAG_MIN) {
          hasMoved = true;
          (window as any).__libDrag = { active: true, hasMoved: true, block: wsBlock };
          ghost = document.createElement('div');
          ghost.style.cssText = [
            'position:fixed',
            'z-index:9999',
            'pointer-events:none',
            'opacity:0.88',
            `background:${wsBlock.color}`,
            'color:#fff',
            'padding:10px 18px',
            'border-radius:999px',
            'font-size:14px',
            'font-weight:700',
            'white-space:nowrap',
            'box-shadow:0 4px 20px rgba(0,0,0,0.5)',
          ].join(';');
          ghost.textContent = block.label;
          document.body.appendChild(ghost);
        }
        if (ghost) {
          ghost.style.left = `${ev.clientX - 60}px`;
          ghost.style.top  = `${ev.clientY - 22}px`;
        }
      };

      const onUp = (_ev: PointerEvent) => {
        document.removeEventListener('pointermove', onMove);
        document.removeEventListener('pointerup', onUp);
        if (ghost) { document.body.removeChild(ghost); ghost = null; }

        if (!hasMoved) {
          addStack(wsBlock, 40 + Math.random() * 80, 40 + Math.random() * 80);
        }
      };

      document.addEventListener('pointermove', onMove);
      document.addEventListener('pointerup', onUp);
    };

    el.addEventListener('pointerdown', onDown);
    return () => el.removeEventListener('pointerdown', onDown);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const isBracket = ['ctrl_2', 'ctrl_3', 'ctrl_4', 'ctrl_5'].includes(block.id);

  return (
    <View ref={ref} style={[styles.blockItem, { cursor: 'grab' } as any]}>
      <CodeBlock block={wsBlock} preview showBracket={isBracket} isFirst isLast />
    </View>
  );
}

function LibraryBlockItemNative({ block, addStack }: { block: BlockDef; addStack: (b: WorkspaceBlock, x?: number, y?: number) => void }) {
  const wsBlock: WorkspaceBlock = {
    id: block.id,
    defId: block.id,
    label: block.label,
    category: block.category,
    color: CATEGORY_COLORS[block.category as BlockCategory],
  };

  const isBracket = ['ctrl_2', 'ctrl_3', 'ctrl_4', 'ctrl_5'].includes(block.id);

  return (
    <TouchableOpacity
      style={styles.blockItem}
      activeOpacity={0.7}
      onPress={() => {
        // Place each new block in a grid so they don't overlap
        const col = nativePlaceCount % 3;
        const row = Math.floor(nativePlaceCount / 3) % 4;
        nativePlaceCount++;
        addStack(wsBlock, 20 + col * 120, 60 + row * 130);
      }}
    >
      <CodeBlock block={wsBlock} preview showBracket={isBracket} isFirst isLast />
    </TouchableOpacity>
  );
}

const LibraryBlockItem = Platform.OS === 'web' ? LibraryBlockItemWeb : LibraryBlockItemNative;

export default function CategoryBand({ category, blocks, isExpanded, onToggle }: Props) {
  const { addStack } = useApp();
  const color = CATEGORY_COLORS[category];
  const dark  = CATEGORY_DARK[category];

  return (
    <View>
      <TouchableOpacity
        style={[styles.band, { backgroundColor: color }]}
        onPress={onToggle}
        activeOpacity={0.85}
      >
        <Text style={styles.categoryName}>{category.toUpperCase()}</Text>
        <Text style={styles.chevron}>{isExpanded ? '▲' : '▼'}</Text>
      </TouchableOpacity>

      {isExpanded && (
        <View style={[styles.blocksContainer, { borderLeftColor: color, backgroundColor: dark + '22' }]}>
          {blocks.map(block => (
            <LibraryBlockItem key={block.id} block={block} addStack={addStack} />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  band: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    justifyContent: 'space-between',
  },
  categoryName: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  chevron: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    fontWeight: '700',
  },
  blocksContainer: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    gap: 12,
  },
  blockItem: {
    alignSelf: 'flex-start',
  },
});
