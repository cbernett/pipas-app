import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Platform,
} from 'react-native';
import { WorkspaceBlock } from '../context/AppContext';
import { BLOCK_TEMPLATES, CATEGORY_DARK, BlockParamDef } from '../data/blocks';

// Puzzle connector dimensions — tab is left-aligned, not centered
export const TAB_W = 28;
export const TAB_H = 9;
export const TAB_LEFT = 18;

interface Props {
  block: WorkspaceBlock;
  isFirst?: boolean;
  isLast?: boolean;
  preview?: boolean;
  isDragging?: boolean;
  isActive?: boolean;
}

export default function CodeBlock({ block, isFirst, isLast, preview, isDragging, isActive }: Props) {
  const isEvent = block.category === 'Eventos';
  const darkColor = CATEGORY_DARK[block.category as keyof typeof CATEGORY_DARK] ?? block.color;
  const useDarkText = block.category === 'Eventos';

  const parts = BLOCK_TEMPLATES[block.defId] ?? [block.label];

  return (
    <View style={[styles.wrapper, isDragging && styles.wrapperDragging]}>

      {/* ── Event hat cap ───────────────────────────────────────────── */}
      {isEvent && !preview && (
        <View style={styles.hatCapRow}>
          <View style={[styles.hatCap, { backgroundColor: block.color }]}>
            <Text style={styles.hatCapIcon}>⚑</Text>
          </View>
        </View>
      )}

      {/* ── Notch slot (top of non-event blocks) ────────────────────── */}
      {!isEvent && !isFirst && !preview && (
        <View style={styles.notchRow}>
          <View style={[styles.notchSlot, { backgroundColor: darkColor }]} />
        </View>
      )}

      {/* ── Main body ───────────────────────────────────────────────── */}
      <View style={[
        styles.body,
        { backgroundColor: block.color },
        isEvent && styles.bodyHat,
        isDragging && styles.bodyDragging,
        isActive && styles.bodyActive,
      ]}>
        <BlockLabel parts={parts} useDarkText={useDarkText} />
      </View>

      {/* ── Tab connector (bottom of all non-last blocks) ───────────── */}
      {!isLast && !preview && (
        <View style={styles.tabRow}>
          <View style={[styles.tab, { backgroundColor: block.color }]} />
        </View>
      )}
    </View>
  );
}

// ─── Label with editable bubbles ─────────────────────────────────────────────

interface LabelProps {
  parts: Array<string | BlockParamDef>;
  useDarkText: boolean;
}

function BlockLabel({ parts, useDarkText }: LabelProps) {
  const textColor = useDarkText ? '#1A1A2E' : '#FFFFFF';
  return (
    <View style={styles.labelRow}>
      {parts.map((part, i) => {
        if (typeof part === 'string') {
          return <Text key={i} style={[styles.labelText, { color: textColor }]}>{part}</Text>;
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
  // Width scales with content (1 char = ~14px, min 36px)
  const inputW = Math.max(36, val.length * 14 + 16);
  return (
    <View style={[styles.numberBubble, { width: inputW }]}>
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
  return (
    <TouchableOpacity
      style={styles.dropdownBubble}
      onPress={() => setVal(opts[(opts.indexOf(val) + 1) % opts.length])}
      activeOpacity={0.8}
    >
      <Text style={styles.dropdownText}>{val}</Text>
      <Text style={styles.dropdownChevron}>▾</Text>
    </TouchableOpacity>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  wrapper: {
    alignSelf: 'flex-start',
    minWidth: 180,
  },
  wrapperDragging: {
    opacity: 0.9,
  },

  // Hat cap — sits above the event block body, left-aligned
  hatCapRow: {
    paddingLeft: TAB_LEFT,
  },
  hatCap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
    alignSelf: 'flex-start',
  },
  hatCapIcon: {
    fontSize: 13,
  },

  // Notch slot — the "female" connector, darker tint, left-aligned
  notchRow: {
    paddingLeft: TAB_LEFT,
  },
  notchSlot: {
    width: TAB_W,
    height: TAB_H,
    borderBottomLeftRadius: 5,
    borderBottomRightRadius: 5,
  },

  // Block body
  body: {
    paddingVertical: 13,
    paddingHorizontal: 16,
    minHeight: 52,
    borderRadius: 8,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
    elevation: 4,
  },
  bodyHat: {
    // event block body: the hat cap above provides the top shape
    borderTopLeftRadius: 0,
    borderTopRightRadius: 8,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
  },
  bodyDragging: {
    shadowOpacity: 0.5,
    shadowRadius: 14,
    elevation: 14,
    transform: [{ scale: 1.03 }],
  },
  bodyActive: {
    borderWidth: 2.5,
    borderColor: 'rgba(255,255,255,0.9)',
    shadowColor: '#FFF',
    shadowOpacity: 0.5,
    shadowRadius: 12,
  },

  // Tab — the "male" connector, same color as block, left-aligned
  tabRow: {
    paddingLeft: TAB_LEFT,
  },
  tab: {
    width: TAB_W,
    height: TAB_H,
    borderBottomLeftRadius: 5,
    borderBottomRightRadius: 5,
  },

  // Label row
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

  // Number bubble — auto-width
  numberBubble: {
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
  },
  numberInput: {
    color: '#1A1A2E',
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
    paddingVertical: Platform.OS === 'ios' ? 4 : 2,
    paddingHorizontal: 4,
  },

  // Dropdown bubble
  dropdownBubble: {
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
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
    color: '#666',
    fontSize: 11,
  },
});
