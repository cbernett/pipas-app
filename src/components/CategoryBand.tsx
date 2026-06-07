import React, { useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
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

function LibraryBlockItem({ block, addStack }: { block: BlockDef; addStack: (b: WorkspaceBlock, x?: number, y?: number) => void }) {
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

      const onUp = (ev: PointerEvent) => {
        document.removeEventListener('pointermove', onMove);
        document.removeEventListener('pointerup', onUp);
        if (ghost) { document.body.removeChild(ghost); ghost = null; }

        if (hasMoved) {
          const canvas = document.getElementById('workspace-canvas');
          if (canvas) {
            const rect   = canvas.getBoundingClientRect();
            const scroll = (window as any).__workspaceScroll ?? { x: 0, y: 0 };
            const cx = ev.clientX - rect.left  + scroll.x;
            const cy = ev.clientY - rect.top   + scroll.y;
            if (cx > 0 && cy > 0 && cx < 2200 && cy < 1800) {
              addStack(wsBlock, Math.max(10, cx - 60), Math.max(10, cy - 30));
              return;
            }
          }
          // dropped outside canvas — place at default random position
          addStack(wsBlock, 40 + Math.random() * 80, 40 + Math.random() * 80);
        } else {
          // tap — add at default position
          addStack(wsBlock, 40 + Math.random() * 80, 40 + Math.random() * 80);
        }
      };

      document.addEventListener('pointermove', onMove);
      document.addEventListener('pointerup', onUp);
    };

    el.addEventListener('pointerdown', onDown);
    return () => el.removeEventListener('pointerdown', onDown);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <View ref={ref} style={styles.blockItem}>
      <CodeBlock block={wsBlock} preview isFirst isLast />
    </View>
  );
}

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
    height: 82,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    justifyContent: 'space-between',
  },
  categoryName: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
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
    borderLeftWidth: 4,
  },
  blockItem: {
    alignSelf: 'flex-start',
    cursor: 'grab',
  } as any,
});
