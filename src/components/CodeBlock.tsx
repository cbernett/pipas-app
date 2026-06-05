import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Platform,
} from 'react-native';
import { WorkspaceBlock } from '../context/AppContext';
import { BLOCK_TEMPLATES, CATEGORY_DARK, BlockParamDef } from '../data/blocks';

const TAB_W = 30;
const TAB_H = 10;
const WORKSPACE_BG = '#1A1F2E';

interface Props {
  block: WorkspaceBlock;
  isFirst?: boolean;
  isLast?: boolean;
  /** rendered inside library (no connectors, compact) */
  preview?: boolean;
  isDragging?: boolean;
}

export default function CodeBlock({ block, isFirst, isLast, preview, isDragging }: Props) {
  const isEvent = block.category === 'Eventos';
  const darkColor = CATEGORY_DARK[block.category as keyof typeof CATEGORY_DARK] ?? block.color;
  const useDarkText = block.category === 'Eventos'; // yellow bg needs dark text

  const parts = BLOCK_TEMPLATES[block.defId] ?? [block.label];

  return (
    <View style={[styles.wrapper, isDragging && styles.wrapperDragging]}>
      {/* ── Notch slot at top (non-hat, non-preview blocks) ── */}
      {!isEvent && !preview && (
        <View style={styles.notchRow}>
          <View style={[styles.notch, { backgroundColor: darkColor }]} />
        </View>
      )}

      {/* ── Hat bump for event blocks ── */}
      {isEvent && !preview && (
        <View style={styles.hatRow}>
          <View style={[styles.hat, { backgroundColor: block.color }]}>
            <Text style={styles.hatIcon}>⚑</Text>
          </View>
        </View>
      )}

      {/* ── Main block body ── */}
      <View style={[
        styles.body,
        { backgroundColor: block.color },
        isEvent && styles.bodyEvent,
        isDragging && styles.bodyDragging,
      ]}>
        <BlockLabel parts={parts} useDarkText={useDarkText} color={block.color} />
      </View>

      {/* ── Tab connector at bottom ── */}
      {!isLast && !preview && (
        <View style={styles.tabRow}>
          <View style={[styles.tab, { backgroundColor: block.color }]} />
        </View>
      )}
    </View>
  );
}

// ─── Label renderer with editable parameter bubbles ────────────────────────

interface LabelProps {
  parts: Array<string | BlockParamDef>;
  useDarkText: boolean;
  color: string;
}

function BlockLabel({ parts, useDarkText, color }: LabelProps) {
  const textColor = useDarkText ? '#1A1A2E' : '#FFFFFF';

  return (
    <View style={styles.labelRow}>
      {parts.map((part, i) => {
        if (typeof part === 'string') {
          return (
            <Text key={i} style={[styles.labelText, { color: textColor }]}>
              {part}
            </Text>
          );
        }
        if (part.type === 'number') {
          return <NumberBubble key={i} value={part.value} />;
        }
        return <DropdownBubble key={i} value={part.value} options={part.options} />;
      })}
    </View>
  );
}

function NumberBubble({ value }: { value: string }) {
  const [val, setVal] = useState(value);
  return (
    <View style={styles.numberBubble}>
      <TextInput
        style={styles.numberInput}
        value={val}
        onChangeText={setVal}
        keyboardType="numeric"
        selectTextOnFocus
      />
    </View>
  );
}

function DropdownBubble({ value, options }: { value: string; options?: string[] }) {
  const [val, setVal] = useState(value);
  const opts = options ?? [value];
  const nextIndex = (opts.indexOf(val) + 1) % opts.length;

  return (
    <TouchableOpacity
      style={styles.dropdownBubble}
      onPress={() => setVal(opts[nextIndex])}
      activeOpacity={0.8}
    >
      <Text style={styles.dropdownText}>{val}</Text>
      <Text style={styles.dropdownChevron}>▾</Text>
    </TouchableOpacity>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  wrapper: {
    alignSelf: 'flex-start',
    minWidth: 180,
  },
  wrapperDragging: {
    opacity: 0.85,
  },

  // Notch slot (female connector)
  notchRow: {
    height: TAB_H,
    alignItems: 'center',
    justifyContent: 'flex-start',
    zIndex: 2,
  },
  notch: {
    width: TAB_W,
    height: TAB_H,
    borderBottomLeftRadius: 6,
    borderBottomRightRadius: 6,
  },

  // Hat (event blocks)
  hatRow: {
    alignItems: 'flex-start',
    paddingLeft: 16,
  },
  hat: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    borderBottomRightRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  hatIcon: {
    fontSize: 13,
  },

  // Main body
  body: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    minHeight: 52,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  bodyEvent: {
    borderTopRightRadius: 12,
    borderBottomLeftRadius: 6,
    borderBottomRightRadius: 6,
  },
  bodyDragging: {
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 12,
  },

  // Tab (male connector)
  tabRow: {
    height: TAB_H,
    alignItems: 'center',
    justifyContent: 'flex-end',
    zIndex: 2,
  },
  tab: {
    width: TAB_W,
    height: TAB_H,
    borderBottomLeftRadius: 6,
    borderBottomRightRadius: 6,
  },

  // Label
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  labelText: {
    fontSize: 15,
    fontWeight: '700',
  },

  // Number bubble
  numberBubble: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 2,
    minWidth: 36,
  },
  numberInput: {
    color: '#1A1A2E',
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
    paddingVertical: Platform.OS === 'ios' ? 4 : 2,
    paddingHorizontal: 6,
    minWidth: 36,
  },

  // Dropdown bubble
  dropdownBubble: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dropdownText: {
    color: '#1A1A2E',
    fontSize: 14,
    fontWeight: '700',
  },
  dropdownChevron: {
    color: '#888',
    fontSize: 11,
  },
});
