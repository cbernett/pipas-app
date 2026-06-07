import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Platform,
} from 'react-native';
import { WorkspaceBlock } from '../context/AppContext';
import { BLOCK_TEMPLATES, CATEGORY_DARK, BlockParamDef } from '../data/blocks';

// Puzzle connector — centered, OctoStudio-style proportions
export const TAB_W  = 40;
export const TAB_H  = 12;
const R             = 14; // block body border-radius
const BRACKET_ARM_W = 22;

const BRACKET_DEFIDS = ['ctrl_2', 'ctrl_3', 'ctrl_4'];

interface Props {
  block: WorkspaceBlock;
  isFirst?: boolean;
  isLast?: boolean;
  preview?: boolean;
  isDragging?: boolean;
  isActive?: boolean;
  onEventTap?: () => void;
  onBlockTap?: () => void;
}

export default function CodeBlock({
  block, isFirst, isLast, preview, isDragging, isActive, onEventTap, onBlockTap,
}: Props) {
  const isEvent   = block.category === 'Eventos';
  const isBracket = BRACKET_DEFIDS.includes(block.defId) && !preview;
  const useDarkText = false; // all categories now use white text
  const darkColor   = CATEGORY_DARK[block.category as keyof typeof CATEGORY_DARK] ?? block.color;
  const parts       = BLOCK_TEMPLATES[block.defId] ?? [block.label];

  if (isBracket) {
    return <BracketBlock block={block} parts={parts} isDragging={isDragging} isActive={isActive} isLast={isLast} />;
  }

  const body = (
    <View style={[
      styles.body,
      { backgroundColor: block.color },
      isEvent && styles.bodyHat,
      isDragging && styles.bodyDragging,
      isActive && styles.bodyActive,
    ]}>
      {isEvent && (
        <View style={styles.eventBadge}>
          <View style={styles.eventPlay} />
        </View>
      )}
      <BlockLabel parts={parts} />
    </View>
  );

  return (
    <View style={[styles.wrapper, isDragging && styles.wrapperDragging]}>
      {/* Hat cap — dome bump on top of event blocks */}
      {isEvent && !preview && (
        <View style={styles.hatCapRow}>
          <View style={[styles.hatCap, { backgroundColor: block.color }]} />
        </View>
      )}

      {/* Notch slot — very subtle indent at top of non-hat, non-first blocks */}
      {!isEvent && !isFirst && !preview && (
        <View style={styles.slotRow}>
          <View style={[styles.slot, { backgroundColor: darkColor }]} />
        </View>
      )}

      {(onEventTap || onBlockTap) && !preview ? (
        <TouchableOpacity onPress={onEventTap ?? onBlockTap} activeOpacity={0.82}>
          {body}
        </TouchableOpacity>
      ) : body}

      {/* Tab connector at bottom */}
      {!isLast && !preview && (
        <View style={styles.tabRow}>
          <View style={[styles.tab, { backgroundColor: block.color }]} />
        </View>
      )}
    </View>
  );
}

// ─── Bracket / C-block ────────────────────────────────────────────────────────

function BracketBlock({ block, parts, isDragging, isActive, isLast }: {
  block: WorkspaceBlock; parts: Array<string | BlockParamDef>;
  isDragging?: boolean; isActive?: boolean; isLast?: boolean;
}) {
  const inner = block.innerBlocks ?? [];
  return (
    <View style={[styles.bracketWrapper, isDragging && styles.wrapperDragging]}>
      {/* Top bar */}
      <View style={[styles.bracketTop, { backgroundColor: block.color }, isActive && styles.bodyActive]}>
        <BlockLabel parts={parts} />
      </View>

      {/* Arm + inner slot */}
      <View style={styles.bracketBody}>
        <View style={[styles.bracketArm, { backgroundColor: block.color }]} />
        <View style={styles.bracketInner}>
          {inner.length > 0
            ? inner.map((ib, i) => (
                <CodeBlock key={ib.id} block={ib} isFirst={i === 0} isLast={i === inner.length - 1} />
              ))
            : <View style={[styles.bracketSlot, { borderColor: block.color }]} />
          }
        </View>
      </View>

      {/* Bottom cap with return arrow */}
      <View style={[styles.bracketBottom, { backgroundColor: block.color }]}>
        <Text style={styles.returnArrow}>↩</Text>
        {!isLast && (
          <View style={[styles.tab, { backgroundColor: block.color, position: 'absolute', bottom: -TAB_H, alignSelf: 'center' }]} />
        )}
      </View>
    </View>
  );
}

// ─── Label renderer ───────────────────────────────────────────────────────────

interface LabelProps { parts: Array<string | BlockParamDef>; }

function BlockLabel({ parts }: LabelProps) {
  return (
    <View style={styles.labelRow}>
      {parts.map((part, i) => {
        if (typeof part === 'string') return <Text key={i} style={styles.labelText}>{part}</Text>;
        if (part.type === 'number') return <NumberBubble key={i} value={part.value} />;
        return <DropdownBubble key={i} value={part.value} options={part.options} />;
      })}
    </View>
  );
}

function NumberBubble({ value }: { value: string }) {
  const [val, setVal] = useState(value);
  const w = Math.max(36, val.length * 12 + 16);
  return (
    <View style={[styles.numBubble, { width: w }]}>
      <TextInput
        style={styles.numInput}
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
      style={styles.dropBubble}
      onPress={() => setVal(opts[(opts.indexOf(val) + 1) % opts.length])}
      activeOpacity={0.8}
    >
      <Text style={styles.dropText}>{val}</Text>
      <Text style={styles.dropChevron}>▾</Text>
    </TouchableOpacity>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  wrapper: { alignSelf: 'flex-start', minWidth: 180 },
  wrapperDragging: { opacity: 0.9 },

  // Hat cap — wide dome sitting flush on event block top
  hatCapRow: { alignItems: 'center' },
  hatCap: {
    width: 60, height: 16,
    borderTopLeftRadius: 12, borderTopRightRadius: 12,
  },

  // Notch slot — subtle darker indent at top of stack blocks
  slotRow: { alignItems: 'center' },
  slot: {
    width: TAB_W, height: TAB_H,
    borderBottomLeftRadius: 8, borderBottomRightRadius: 8,
    opacity: 0.7,
  },

  // Main body
  body: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 18,
    minHeight: 56,
    borderRadius: R,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.22,
    shadowRadius: 5,
    elevation: 5,
  },
  bodyHat: {
    borderTopLeftRadius: 4,
    borderTopRightRadius: R,
  },
  bodyDragging: {
    shadowOpacity: 0.5, shadowRadius: 14, elevation: 14,
  },
  bodyActive: {
    borderWidth: 3, borderColor: 'rgba(255,255,255,0.9)',
    shadowColor: '#FFF', shadowOpacity: 0.5, shadowRadius: 10,
  },

  // Event play badge
  eventBadge: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center', justifyContent: 'center',
  },
  eventPlay: {
    width: 0, height: 0,
    borderTopWidth: 6, borderBottomWidth: 6, borderLeftWidth: 10,
    borderTopColor: 'transparent', borderBottomColor: 'transparent',
    borderLeftColor: '#FFF',
    marginLeft: 2,
  },

  // Tab (male connector)
  tabRow: { alignItems: 'center' },
  tab: {
    width: TAB_W, height: TAB_H,
    borderBottomLeftRadius: 8, borderBottomRightRadius: 8,
  },

  // ── Bracket block ──────────────────────────
  bracketWrapper: { alignSelf: 'flex-start', minWidth: 180 },
  bracketTop: {
    paddingVertical: 14, paddingHorizontal: 18,
    borderTopLeftRadius: R, borderTopRightRadius: R,
    flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 56,
  },
  bracketBody: { flexDirection: 'row' },
  bracketArm:  { width: BRACKET_ARM_W, minHeight: 44 },
  bracketInner: { flex: 1, paddingVertical: 8, paddingLeft: 8 },
  bracketSlot: {
    height: 40, borderRadius: 10, borderWidth: 2,
    borderStyle: 'dashed', opacity: 0.4, marginVertical: 4,
  },
  bracketBottom: {
    height: 28,
    borderBottomLeftRadius: R, borderBottomRightRadius: R,
    alignItems: 'center', justifyContent: 'center',
  },
  returnArrow: { color: 'rgba(255,255,255,0.6)', fontSize: 16 },

  // ── Label ──────────────────────────────────
  labelRow: {
    flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6, flex: 1,
  },
  labelText: { color: '#FFF', fontSize: 15, fontWeight: '700' },

  numBubble: { backgroundColor: '#FFF', borderRadius: 8 },
  numInput: {
    color: '#1A1A2E', fontSize: 15, fontWeight: '700', textAlign: 'center',
    paddingVertical: Platform.OS === 'ios' ? 4 : 2, paddingHorizontal: 4,
  },
  dropBubble: {
    backgroundColor: '#FFF', borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 5,
    flexDirection: 'row', alignItems: 'center', gap: 4,
  },
  dropText:    { color: '#1A1A2E', fontSize: 14, fontWeight: '700' },
  dropChevron: { color: '#666', fontSize: 11 },
});
