import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { BlockDef, CATEGORY_COLORS, CATEGORY_DARK, BlockCategory, BLOCK_TEMPLATES } from '../data/blocks';
import { useApp, WorkspaceBlock } from '../context/AppContext';
import CodeBlock from './CodeBlock';

interface Props {
  category: BlockCategory;
  blocks: BlockDef[];
  isExpanded: boolean;
  onToggle: () => void;
}

export default function CategoryBand({ category, blocks, isExpanded, onToggle }: Props) {
  const { addStack } = useApp();
  const color = CATEGORY_COLORS[category];
  const dark  = CATEGORY_DARK[category];
  const useDarkText = false;

  const handleBlockPress = (block: BlockDef) => {
    addStack({
      id:       block.id,
      defId:    block.id,
      label:    block.label,
      category: block.category,
      color:    CATEGORY_COLORS[block.category as BlockCategory],
    }, 40 + Math.random() * 60, 40 + Math.random() * 60);
  };

  return (
    <View>
      <TouchableOpacity
        style={[styles.band, { backgroundColor: color }]}
        onPress={onToggle}
        activeOpacity={0.85}
      >
        <Text style={[styles.categoryName, useDarkText && { color: '#1A1A2E' }]}>
          {category.toUpperCase()}
        </Text>
        <Text style={[styles.chevron, useDarkText && { color: 'rgba(0,0,0,0.4)' }]}>
          {isExpanded ? '▲' : '▼'}
        </Text>
      </TouchableOpacity>

      {isExpanded && (
        <View style={[styles.blocksContainer, { borderLeftColor: color, backgroundColor: dark + '22' }]}>
          {blocks.map((block) => {
            const previewBlock: WorkspaceBlock = {
              id: block.id,
              defId: block.id,
              label: block.label,
              category: block.category,
              color: CATEGORY_COLORS[block.category as BlockCategory],
            };
            return (
              <TouchableOpacity
                key={block.id}
                onPress={() => handleBlockPress(block)}
                activeOpacity={0.75}
              >
                <CodeBlock block={previewBlock} preview isFirst isLast />
              </TouchableOpacity>
            );
          })}
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
});
