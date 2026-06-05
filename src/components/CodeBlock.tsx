import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Platform,
} from 'react-native';
import { WorkspaceBlock } from '../context/AppContext';
import { BLOCK_TEMPLATES, CATEGORY_DARK, BlockParamDef } from '../data/blocks';

// Puzzle connector — centered, prominent
export const TAB_W  = 32;
export const TAB_H  = 10;
const BRACKET_ARM_W = 20; // width of the left arm on bracket/C blocks
const INNER_INDENT  = BRACKET_ARM_W + 8;

type BlockVariant = 'hat' | 'stack' | 'bracket' | 'preview';

interface Props {
  block: WorkspaceBlock;
  isFirst?: boolean;
  isLast?: boolean;
  preview?: boolean;
  isDragging?: boolean;
  isActive?: boolean;
  /** called when an event-type block is tapped — runs from this block */
  onEventTap?: () => void;
  /** called when any block is tapped — previews its immediate effect */
  onBlockTap?: () => void;
}

export default function CodeBlock({
  block, isFirst, isLast, preview, isDragging, isActive, onEventTap, onBlockTap,
}: Props) {
  const isEvent   = block.category === 'Eventos';
  const isBracket = ['ctrl_2', 'ctrl_3', 'ctrl_4'].includes(block.defId) && !preview;
  const useDarkText = block.category === 'Eventos';
  const darkColor   = CATEGORY_DARK[block.category as keyof typeof CATEGORY_DARK] ?? block.color;

  const parts = BLOCK_TEMPLATES[block.defId] ?? [block.label];

  if (isBracket) {
    return <BracketBlock block={block} parts={parts} isDragging={isDragging} isActive={isActive} isLast={isLast} />;
  }

  const Body = (
    <View style={[
      styles.body,
      { backgroundColor: block.color },
      isEvent && styles.bodyHat,
      isDragging && styles.bodyDragging,
      isActive && styles.bodyActive,
    ]}>
      {isEvent && (
        <View style={styles.eventBadge}>
          <View style={styles.eventBadgePlay} />
        </View>
      )}
      <BlockLabel parts={parts} useDarkText={useDarkText} />
    </View>
  );

  return (
    <View style={[styles.wrapper, isDragging && styles.wrapperDragging]}>
      {/* Hat cap sits above the body for event blocks */}
      {isEvent && !preview && (
        <View style={styles.hatCapRow}>
          <View style={[styles.hatCap, { backgroundColor: block.color }]} />
        </View>
      )}

      {/* Tab slot at top for non-event, non-first, non-preview blocks */}
      {!isEvent && !isFirst && !preview && (
        <View style={styles.tabSlotRow}>
          <View style={[styles.tabSlot, { backgroundColor: darkColor }]} />
        </View>
      )}

      {(onEventTap || onBlockTap) && !preview ? (
        <TouchableOpacity
          onPress={onEventTap ?? onBlockTap}
          activeOpacity={0.82}
        >
          {Body}
        </TouchableOpacity>
      ) : Body}

      {/* Tab connector at bottom */}
      {!isLast && !preview && (
        <View style={styles.tabRow}>
          <View style={[styles.tab, { backgroundColor: block.color }]} />
        </View>
      )}
    </View>
  );
}

// ─── Bracket / C-block ───────────────────────────────────────────────────────

function BracketBlock({ block, parts, isDragging, isActive, isLast }: {
  block: WorkspaceBlock;
  parts: Array<string | BlockParamDef>;
  isDragging?: boolean;
  isActive?: boolean;
  isLast?: boolean;
}) {
  const darkColor = CATEGORY_DARK[block.category as keyof typeof CATEGORY_DARK] ?? block.color;
  const inner = block.innerBlocks ?? [];

  return (
    <View style={[styles.bracketWrapper, isDragging && styles.wrapperDragging]}>
      {/* Top bar */}
      <View style={[styles.bracketTop, { backgroundColor: block.color }, isActive && styles.bodyActive]}>
        <BlockLabel parts={parts} useDarkText={false} />
      </View>

      {/* Body: left arm + inner area */}
      <View style={styles.bracketBody}>
        <View style={[styles.bracketArm, { backgroundColor: block.color }]} />
        <View style={styles.bracketInner}>
          {inner.length > 0 ? (
            inner.map((ib, i) => (
              <CodeBlock
                key={ib.id}
                block={ib}
                isFirst={i === 0}
                isLast={i === inner.length - 1}
              />
            ))
          ) : (
            <View style={[styles.bracketEmptySlot, { borderColor: darkColor }]} />
          )}
        </View>
      </View>

      {/* Bottom cap */}
      <View style={[styles.bracketBottom, { backgroundColor: block.color }]}>
        {!isLast && (
          <View style={[styles.tab, { backgroundColor: block.color }]} />
        )}
      </View>
    </View>
  );
}

// ─── Label renderer ──────────────────────────────────────────────────────────

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
        if (part.type === 'number') return <NumberBubble key={i} value={part.value} />;
        return <DropdownBubble key={i} value={part.value} options={part.options} />;
      })}
    </View>
  );
}

function NumberBubble({ value }: { value: string }) {
  const [val, setVal] = useState(value);
  const inputW = Math.max(32, val.length * 12 + 16);
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
  wrapper: { alignSelf: 'flex-start', minWidth: 180 },
  wrapperDragging: { opacity: 0.88 },

  // Hat cap — the bump on top of event blocks
  hatCapRow: { alignItems: 'center' },
  hatCap: {
    width: 56, height: 14,
    borderTopLeftRadius: 10, borderTopRightRadius: 10,
  },

  // Tab slot — female connector on top of non-hat blocks
  // NOTE: intentionally very subtle — just a slight indent hint
  tabSlotRow: { alignItems: 'center' },
  tabSlot: {
    width: TAB_W, height: TAB_H,
    borderBottomLeftRadius: 6, borderBottomRightRadius: 6,
    opacity: 0.6,
  },

  // Main block body
  body: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    paddingHorizontal: 16,
    minHeight: 54,
    borderRadius: 10,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  bodyHat: {
    borderTopLeftRadius: 4,
    borderTopRightRadius: 10,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
  },
  bodyDragging: {
    shadowOpacity: 0.45, shadowRadius: 12, elevation: 12,
  },
  bodyActive: {
    borderWidth: 2.5, borderColor: 'rgba(255,255,255,0.9)',
    shadowColor: '#FFF', shadowOpacity: 0.4, shadowRadius: 10,
  },

  // Event block play badge
  eventBadge: {
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center', justifyContent: 'center',
  },
  eventBadgePlay: {
    width: 0, height: 0,
    borderTopWidth: 5, borderBottomWidth: 5, borderLeftWidth: 9,
    borderTopColor: 'transparent', borderBottomColor: 'transparent',
    borderLeftColor: '#FFFFFF',
    marginLeft: 2,
  },

  // Tab connector (male, at bottom)
  tabRow: { alignItems: 'center' },
  tab: {
    width: TAB_W, height: TAB_H,
    borderBottomLeftRadius: 6, borderBottomRightRadius: 6,
  },

  // ── Bracket block ────────────────────────────
  bracketWrapper: { alignSelf: 'flex-start', minWidth: 180 },
  bracketTop: {
    paddingVertical: 13, paddingHorizontal: 16,
    borderTopLeftRadius: 10, borderTopRightRadius: 10,
    flexDirection: 'row', alignItems: 'center', gap: 8,
    minHeight: 54,
  },
  bracketBody: {
    flexDirection: 'row',
  },
  bracketArm: {
    width: BRACKET_ARM_W,
    minHeight: 40,
  },
  bracketInner: {
    flex: 1,
    paddingVertical: 6,
    paddingLeft: 8,
  },
  bracketEmptySlot: {
    height: 36,
    borderRadius: 8,
    borderWidth: 2,
    borderStyle: 'dashed',
    opacity: 0.4,
    marginVertical: 4,
  },
  bracketBottom: {
    height: 20,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },

  // ── Label ────────────────────────────────────
  labelRow: {
    flexDirection: 'row', alignItems: 'center',
    flexWrap: 'wrap', gap: 6, flex: 1,
  },
  labelText: { fontSize: 15, fontWeight: '700' },

  numberBubble: { backgroundColor: '#FFFFFF', borderRadius: 6 },
  numberInput: {
    color: '#1A1A2E', fontSize: 15, fontWeight: '700',
    textAlign: 'center',
    paddingVertical: Platform.OS === 'ios' ? 4 : 2,
    paddingHorizontal: 4,
  },
  dropdownBubble: {
    backgroundColor: '#FFFFFF', borderRadius: 6,
    paddingHorizontal: 8, paddingVertical: 4,
    flexDirection: 'row', alignItems: 'center', gap: 4,
  },
  dropdownText: { color: '#1A1A2E', fontSize: 14, fontWeight: '700' },
  dropdownChevron: { color: '#666', fontSize: 11 },
});
