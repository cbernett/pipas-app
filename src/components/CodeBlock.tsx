import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Platform,
} from 'react-native';
import { WorkspaceBlock } from '../context/AppContext';
import { BLOCK_TEMPLATES, CATEGORY_DARK, BlockParamDef } from '../data/blocks';

export const TAB_W      = 40;  // connector tab width
export const TAB_H      = 12;  // connector tab height
export const TAB_OFFSET = 16;  // left offset of tab from block edge
const BLOCK_R           = 14;  // body corner radius
const CIRCLE_D          = 46;  // event-block circle diameter
const BRACKET_DEFIDS    = ['ctrl_2', 'ctrl_3', 'ctrl_4'];
const WS_BG             = '#1A1F2E'; // workspace background (used for indent colour)

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

export default function CodeBlock(props: Props) {
  const { block, isFirst, isLast, preview, isDragging, isActive, onEventTap, onBlockTap } = props;
  const isEvent   = block.category === 'Eventos';
  const isBracket = BRACKET_DEFIDS.includes(block.defId) && !preview;
  const parts     = BLOCK_TEMPLATES[block.defId] ?? [block.label];

  if (isBracket) return <BracketBlock {...props} parts={parts} />;
  if (isEvent)   return <EventBlock   {...props} parts={parts} />;
  return                <StackBlock   {...props} parts={parts} />;
}

// ─── Event block — OctoStudio "key" shape ────────────────────────────────────

function EventBlock({ block, isLast, preview, isDragging, isActive, onEventTap, onBlockTap, parts }: Props & { parts: any[] }) {
  const wrap = onEventTap || onBlockTap;
  const body = (
    <View style={[
      styles.eventBody, { backgroundColor: block.color },
      isDragging && styles.bodyDragging,
      isActive   && styles.bodyActive,
    ]}>
      <BlockLabel parts={parts} />
    </View>
  );

  return (
    <View style={styles.eventWrapper}>
      <View style={styles.eventRow}>
        {/* Circle cap — the "key head" */}
        <TouchableOpacity
          style={[styles.eventCircle, { backgroundColor: block.color }]}
          onPress={onEventTap ?? onBlockTap}
          activeOpacity={0.82}
        >
          <View style={styles.eventPlay} />
        </TouchableOpacity>

        {/* Body — rounded right side, slight left overlap with circle */}
        {wrap && !preview ? (
          <TouchableOpacity onPress={onEventTap ?? onBlockTap} activeOpacity={0.82} style={{ flex: 0 }}>
            {body}
          </TouchableOpacity>
        ) : body}
      </View>

      {/* Bottom connector tab */}
      {!isLast && !preview && (
        <View style={styles.tabRow}>
          <View style={[styles.tab, { backgroundColor: block.color }]} />
        </View>
      )}
    </View>
  );
}

// ─── Stack block — normal connector block ────────────────────────────────────

function StackBlock({ block, isFirst, isLast, preview, isDragging, isActive, onEventTap, onBlockTap, parts }: Props & { parts: any[] }) {
  const wrap = onEventTap || onBlockTap;
  const body = (
    <View style={[
      styles.body, { backgroundColor: block.color },
      isDragging && styles.bodyDragging,
      isActive   && styles.bodyActive,
    ]}>
      <BlockLabel parts={parts} />
    </View>
  );

  return (
    <View style={styles.wrapper}>
      {/* Top indent — the "female" connector slot, matches tab shape exactly */}
      {!isFirst && !preview && (
        <View style={styles.indentRow}>
          <View style={[styles.indent, { backgroundColor: WS_BG }]} />
        </View>
      )}

      {wrap && !preview ? (
        <TouchableOpacity onPress={onEventTap ?? onBlockTap} activeOpacity={0.82}>
          {body}
        </TouchableOpacity>
      ) : body}

      {/* Bottom connector tab */}
      {!isLast && !preview && (
        <View style={styles.tabRow}>
          <View style={[styles.tab, { backgroundColor: block.color }]} />
        </View>
      )}
    </View>
  );
}

// ─── Bracket / C-block ───────────────────────────────────────────────────────

function BracketBlock({ block, isFirst, isLast, preview, isDragging, isActive, parts }: Props & { parts: any[] }) {
  const inner = block.innerBlocks ?? [];
  return (
    <View style={styles.wrapper}>
      {!isFirst && !preview && (
        <View style={styles.indentRow}>
          <View style={[styles.indent, { backgroundColor: WS_BG }]} />
        </View>
      )}

      <View style={[styles.bracketTop, { backgroundColor: block.color }, isActive && styles.bodyActive]}>
        <BlockLabel parts={parts} />
      </View>

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

      <View style={[styles.bracketBottom, { backgroundColor: block.color }]}>
        <Text style={styles.returnArrow}>↩</Text>
      </View>

      {!isLast && !preview && (
        <View style={styles.tabRow}>
          <View style={[styles.tab, { backgroundColor: block.color }]} />
        </View>
      )}
    </View>
  );
}

// ─── Label with editable bubbles ─────────────────────────────────────────────

function BlockLabel({ parts }: { parts: Array<string | BlockParamDef> }) {
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
  const w = Math.max(32, val.length * 12 + 16);
  return (
    <View style={[styles.numBubble, { width: w }]}>
      <TextInput style={styles.numInput} value={val} onChangeText={setVal} keyboardType="numeric" selectTextOnFocus />
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

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  wrapper: { alignSelf: 'flex-start', minWidth: 160 },

  // ── Indent (female connector) ─────────────────
  indentRow: { paddingLeft: TAB_OFFSET },
  indent: {
    width: TAB_W, height: TAB_H,
    borderBottomLeftRadius: 7, borderBottomRightRadius: 7,
  },

  // ── Stack block body ──────────────────────────
  body: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 10, paddingHorizontal: 16,
    minHeight: 46, borderRadius: BLOCK_R,
    gap: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2, shadowRadius: 4, elevation: 4,
  },
  bodyDragging: { shadowOpacity: 0.5, shadowRadius: 14, elevation: 14 },
  bodyActive: {
    borderWidth: 3, borderColor: 'rgba(255,255,255,0.9)',
    shadowColor: '#FFF', shadowOpacity: 0.5, shadowRadius: 10,
  },

  // ── Tab (male connector) ──────────────────────
  tabRow: { paddingLeft: TAB_OFFSET },
  tab: {
    width: TAB_W, height: TAB_H,
    borderBottomLeftRadius: 7, borderBottomRightRadius: 7,
  },

  // ── Event block (key shape) ───────────────────
  eventWrapper: { alignSelf: 'flex-start' },
  eventRow: { flexDirection: 'row', alignItems: 'center' },
  eventCircle: {
    width: CIRCLE_D, height: CIRCLE_D, borderRadius: CIRCLE_D / 2,
    alignItems: 'center', justifyContent: 'center',
    zIndex: 2,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2, shadowRadius: 4, elevation: 4,
  },
  eventPlay: {
    width: 0, height: 0,
    borderTopWidth: 7, borderBottomWidth: 7, borderLeftWidth: 12,
    borderTopColor: 'transparent', borderBottomColor: 'transparent',
    borderLeftColor: 'rgba(0,0,0,0.5)',
    marginLeft: 2,
  },
  eventBody: {
    flexDirection: 'row', alignItems: 'center',
    // overlap circle by ~1/3 of its radius to form seamless key shape
    marginLeft: -(CIRCLE_D * 0.28),
    paddingLeft: CIRCLE_D * 0.28 + 10,
    paddingRight: 16, paddingVertical: 10,
    minHeight: CIRCLE_D, minWidth: 80,
    borderTopRightRadius: BLOCK_R, borderBottomRightRadius: BLOCK_R,
    borderTopLeftRadius: 6, borderBottomLeftRadius: 6,
    zIndex: 1, gap: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2, shadowRadius: 4, elevation: 4,
  },

  // ── Bracket block ─────────────────────────────
  bracketTop: {
    paddingVertical: 10, paddingHorizontal: 16,
    borderTopLeftRadius: BLOCK_R, borderTopRightRadius: BLOCK_R,
    flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 46,
  },
  bracketBody: { flexDirection: 'row' },
  bracketArm:  { width: 22, minHeight: 44 },
  bracketInner: { flex: 1, paddingVertical: 8, paddingLeft: 8 },
  bracketSlot: { height: 40, borderRadius: 10, borderWidth: 2, borderStyle: 'dashed', opacity: 0.4, marginVertical: 4 },
  bracketBottom: {
    height: 26, borderBottomLeftRadius: BLOCK_R, borderBottomRightRadius: BLOCK_R,
    alignItems: 'center', justifyContent: 'center',
  },
  returnArrow: { color: 'rgba(255,255,255,0.6)', fontSize: 15 },

  // ── Label ─────────────────────────────────────
  labelRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6, flex: 1 },
  labelText: { color: '#FFF', fontSize: 15, fontWeight: '700' },

  numBubble: { backgroundColor: '#FFF', borderRadius: 7 },
  numInput: {
    color: '#1A1A2E', fontSize: 15, fontWeight: '700', textAlign: 'center',
    paddingVertical: Platform.OS === 'ios' ? 4 : 2, paddingHorizontal: 4,
  },
  dropBubble: {
    backgroundColor: '#FFF', borderRadius: 7,
    paddingHorizontal: 8, paddingVertical: 5,
    flexDirection: 'row', alignItems: 'center', gap: 4,
  },
  dropText:    { color: '#1A1A2E', fontSize: 14, fontWeight: '700' },
  dropChevron: { color: '#666', fontSize: 11 },
});
