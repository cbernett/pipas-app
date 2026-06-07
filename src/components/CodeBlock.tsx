import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Platform,
} from 'react-native';
import { WorkspaceBlock } from '../context/AppContext';
import { BLOCK_TEMPLATES, CATEGORY_DARK, BlockParamDef } from '../data/blocks';

export const TAB_W      = 36;   // connector width
export const TAB_H      = 11;   // connector height
export const TAB_OFFSET = 18;   // horizontal offset from block left edge
const BLOCK_R           = 12;   // body corner radius
const CIRCLE_D          = 44;   // event-block circle diameter
const WS_BG             = '#1A1F2E';

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

export default function CodeBlock(props: Props) {
  const { block } = props;
  const isEvent   = block.category === 'Eventos';
  const isBracket = BRACKET_DEFIDS.includes(block.defId) && !props.preview;
  const parts     = BLOCK_TEMPLATES[block.defId] ?? [block.label];

  if (isBracket) return <BracketBlock {...props} parts={parts} />;
  if (isEvent)   return <EventBlock   {...props} parts={parts} />;
  return                <StackBlock   {...props} parts={parts} />;
}

// ─── Event block — OctoStudio "key" shape ─────────────────────────────────

function EventBlock({ block, isLast, preview, isDragging, isActive, onEventTap, onBlockTap, parts }: Props & { parts: any[] }) {
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
        {/* Circular cap — the key "head", no icon inside */}
        <TouchableOpacity
          style={[styles.eventCircle, { backgroundColor: block.color }]}
          onPress={onEventTap ?? onBlockTap}
          activeOpacity={0.82}
        />

        {/* Body — overlaps circle slightly on the left */}
        {(onEventTap || onBlockTap) && !preview ? (
          <TouchableOpacity onPress={onEventTap ?? onBlockTap} activeOpacity={0.82} style={{ flexShrink: 0 }}>
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

// ─── Stack block ──────────────────────────────────────────────────────────

function StackBlock({ block, isLast, preview, isDragging, isActive, onEventTap, onBlockTap, parts }: Props & { parts: any[] }) {
  const body = (
    <View style={[
      styles.body, { backgroundColor: block.color },
      isDragging && styles.bodyDragging,
      isActive   && styles.bodyActive,
    ]}>
      {/* Inset indent — always present on non-event blocks; the tab from above covers it */}
      {!preview && (
        <View style={styles.insetIndent} />
      )}
      <BlockLabel parts={parts} />
    </View>
  );

  return (
    <View style={styles.wrapper}>
      {(onEventTap || onBlockTap) && !preview ? (
        <TouchableOpacity onPress={onEventTap ?? onBlockTap} activeOpacity={0.82}>
          {body}
        </TouchableOpacity>
      ) : body}

      {!isLast && !preview && (
        <View style={styles.tabRow}>
          <View style={[styles.tab, { backgroundColor: block.color }]} />
        </View>
      )}
    </View>
  );
}

// ─── Bracket / C-block ────────────────────────────────────────────────────

function BracketBlock({ block, isLast, preview, isActive, parts }: Props & { parts: any[] }) {
  const inner = block.innerBlocks ?? [];
  return (
    <View style={styles.wrapper}>
      <View style={[styles.bracketTop, { backgroundColor: block.color }, isActive && styles.bodyActive]}>
        {!preview && <View style={styles.insetIndent} />}
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

// ─── Label renderer ───────────────────────────────────────────────────────

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

// ─── Styles ───────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  wrapper:      { alignSelf: 'flex-start' },

  // ── Inset indent — sits inside the body at top-left, covered by tab from above
  insetIndent: {
    position: 'absolute',
    top: 0, left: TAB_OFFSET,
    width: TAB_W, height: TAB_H,
    backgroundColor: WS_BG,
    borderBottomLeftRadius: 6, borderBottomRightRadius: 6,
  },

  // ── Stack block body
  body: {
    position: 'relative',
    flexDirection: 'row', alignItems: 'center',
    // paddingTop includes space for the inset indent
    paddingTop: TAB_H + 7,
    paddingBottom: 9,
    paddingHorizontal: 14,
    borderRadius: BLOCK_R,
    gap: 6,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.22, shadowRadius: 4, elevation: 4,
  },
  bodyDragging: { shadowOpacity: 0.5, shadowRadius: 14, elevation: 14 },
  bodyActive: {
    borderWidth: 2.5, borderColor: 'rgba(255,255,255,0.9)',
    shadowColor: '#FFF', shadowOpacity: 0.5, shadowRadius: 10,
  },

  // ── Tab (male connector) — left-aligned
  tabRow: { paddingLeft: TAB_OFFSET },
  tab: {
    width: TAB_W, height: TAB_H,
    borderBottomLeftRadius: 6, borderBottomRightRadius: 6,
  },

  // ── Event block (key shape) ───────────────────────────────────────────
  eventWrapper: { alignSelf: 'flex-start' },
  eventRow: { flexDirection: 'row', alignItems: 'center' },

  eventCircle: {
    width: CIRCLE_D, height: CIRCLE_D,
    borderRadius: CIRCLE_D / 2,
    zIndex: 2,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2, shadowRadius: 4, elevation: 4,
  },
  eventBody: {
    position: 'relative',
    flexDirection: 'row', alignItems: 'center',
    // Overlap circle so they merge seamlessly
    marginLeft: -(CIRCLE_D * 0.32),
    paddingLeft: CIRCLE_D * 0.32 + 10,
    paddingRight: 14,
    paddingVertical: 10,
    minHeight: CIRCLE_D,
    borderTopRightRadius: BLOCK_R, borderBottomRightRadius: BLOCK_R,
    borderTopLeftRadius: 6, borderBottomLeftRadius: 6,
    zIndex: 1, gap: 6,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18, shadowRadius: 4, elevation: 3,
  },

  // ── Bracket ────────────────────────────────────────────────────────────
  bracketTop: {
    position: 'relative',
    paddingTop: TAB_H + 7, paddingBottom: 9, paddingHorizontal: 14,
    borderTopLeftRadius: BLOCK_R, borderTopRightRadius: BLOCK_R,
    flexDirection: 'row', alignItems: 'center', gap: 6,
  },
  bracketBody:  { flexDirection: 'row' },
  bracketArm:   { width: 20, minHeight: 36 },
  bracketInner: { flex: 1, paddingVertical: 6, paddingLeft: 8 },
  bracketSlot:  { height: 36, borderRadius: 8, borderWidth: 2, borderStyle: 'dashed', opacity: 0.4 },
  bracketBottom: {
    height: 24, borderBottomLeftRadius: BLOCK_R, borderBottomRightRadius: BLOCK_R,
    alignItems: 'center', justifyContent: 'center',
  },
  returnArrow: { color: 'rgba(255,255,255,0.55)', fontSize: 14 },

  // ── Label ───────────────────────────────────────────────────────────────
  labelRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 5, flexShrink: 1 },
  labelText: { color: '#FFF', fontSize: 14, fontWeight: '700' },

  numBubble: { backgroundColor: '#FFF', borderRadius: 6 },
  numInput: {
    color: '#1A1A2E', fontSize: 14, fontWeight: '700', textAlign: 'center',
    paddingVertical: Platform.OS === 'ios' ? 3 : 1, paddingHorizontal: 4,
  },
  dropBubble: {
    backgroundColor: '#FFF', borderRadius: 6,
    paddingHorizontal: 7, paddingVertical: 4,
    flexDirection: 'row', alignItems: 'center', gap: 3,
    flexShrink: 0,
  },
  dropText:    { color: '#1A1A2E', fontSize: 13, fontWeight: '700' },
  dropChevron: { color: '#666', fontSize: 10 },
});
