import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { BlockDef, CATEGORY_COLORS, BlockCategory } from '../data/blocks';
import { useApp } from '../context/AppContext';

interface Props {
  category: BlockCategory;
  blocks: BlockDef[];
  isExpanded: boolean;
  onToggle: () => void;
}

export default function CategoryBand({ category, blocks, isExpanded, onToggle }: Props) {
  const { setWorkspaceBlocks, workspaceBlocks, setLibraryOpen } = useApp();
  const color = CATEGORY_COLORS[category];

  const handleBlockPress = (block: BlockDef) => {
    const newBlock = {
      id: `ws_${Date.now()}_${block.id}`,
      defId: block.id,
      label: block.label,
      category: block.category,
      color: CATEGORY_COLORS[block.category as BlockCategory],
    };
    setWorkspaceBlocks([...workspaceBlocks, newBlock]);
    setLibraryOpen(false);
  };

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
        <View style={[styles.blocksContainer, { backgroundColor: color + '22' }]}>
          {blocks.map((block) => (
            <TouchableOpacity
              key={block.id}
              style={[styles.blockRow, { borderLeftColor: color }]}
              onPress={() => handleBlockPress(block)}
              activeOpacity={0.7}
            >
              <View style={[styles.blockChip, { backgroundColor: color }]}>
                <Text style={styles.blockChipText}>{block.label}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  band: {
    height: 96,
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
    paddingVertical: 12,
    paddingHorizontal: 20,
    gap: 10,
  },
  blockRow: {
    borderLeftWidth: 4,
    paddingLeft: 12,
  },
  blockChip: {
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignSelf: 'flex-start',
  },
  blockChipText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
