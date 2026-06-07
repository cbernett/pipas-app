import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Platform,
} from 'react-native';
import { WorkspaceBlock } from '../context/AppContext';
import { BLOCK_TEMPLATES, CATEGORY_DARK, BlockParamDef } from '../data/blocks';

export const TAB_W      = 36;   // connector width
export const TAB_H      = 12;   // connector height
export const TAB_OFFSET = 20;   // horizontal offset from block left edge
const BLOCK_R           = 18;   // body corner radius — pill-like
const CIRCLE_D          = 50;   // event-block circle diameter

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

function EventBlock({ block, preview, isDragging, isActive, onEventTap, onBlockTap, parts }: Props & { parts: any[] }) {
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

      {/* Bottom connector tab — always visible so blocks can always connect below */}
      {!preview && (
        <View style={styles.tabRow}>
          <View style={[styles.tab, { backgroundColor: block.color }]} />
        </View>
      )}
    </View>
  );
}

// ─── Stack block ──────────────────────────────────────────────────────────

function StackBlock({ block, preview, isDragging, isActive, onEventTap, onBlockTap, parts }: Props & { parts: any[] }) {
  const darkColor = CATEGORY_DARK[block.category as keyof typeof CATEGORY_DARK] ?? '#000';
  const body = (
    <View style={[
      styles.body, { backgroundColor: block.color },
      isDragging && styles.bodyDragging,
      isActive   && styles.bodyActive,
    ]}>
      {/* Inset indent slot */}
      {!preview && (
        <View style={[styles.insetIndent, { backgroundColor: darkColor }]} />
      )}
      <BlockLabel parts={parts} />
      {/* Subtle bottom separator — visible as a thin line between connected blocks */}
      {!preview && (
        <View style={styles.separator} />
      )}
    </View>
  );

  return (
    <View style={styles.wrapper}>
      {(onEventTap || onBlockTap) && !preview ? (
        <TouchableOpacity onPress={onEventTap ?? onBlockTap} activeOpacity={0.82}>
          {body}
        </TouchableOpacity>
      ) : body}

      {/* Bottom tab — always shown so blocks can always receive a connection below */}
      {!preview && (
        <View style={styles.tabRow}>
          <View style={[styles.tab, { backgroundColor: block.color }]} />
        </View>
      )}
    </View>
  );
}

// ─── Bracket / C-block ────────────────────────────────────────────────────

function BracketBlock({ block, preview, isActive, parts }: Props & { parts: any[] }) {
  const inner = block.innerBlocks ?? [];
  return (
    <View style={styles.wrapper}>
      <View style={[styles.bracketTop, { backgroundColor: block.color }, isActive && styles.bodyActive]}>
        {!preview && <View style={[styles.insetIndent, { backgroundColor: CATEGORY_DARK[block.category as keyof typeof CATEGORY_DARK] ?? '#000' }]} />}
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
      {!preview && (
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
  // backgroundColor is set dynamically (CATEGORY_DARK of the block)
  insetIndent: {
    position: 'absolute',
    top: 0, left: TAB_OFFSET,
    width: TAB_W, height: TAB_H,
    borderBottomLeftRadius: 6, borderBottomRightRadius: 6,
  },

  // ── Stack block body
  body: {
    position: 'relative',
    flexDirection: 'row', alignItems: 'center',
    paddingTop: TAB_H + 8,
    paddingBottom: 10,
    paddingHorizontal: 16,
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

  // ── Tab (male connector) — left-aligned, always rendered
  tabRow: { paddingLeft: TAB_OFFSET },
  tab: {
    width: TAB_W, height: TAB_H,
    borderBottomLeftRadius: 6, borderBottomRightRadius: 6,
  },

  // ── Subtle separator line at bottom of block body (shows between connected blocks)
  separator: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    height: 1.5,
    backgroundColor: 'rgba(0,0,0,0.18)',
    borderBottomLeftRadius: BLOCK_R,
    borderBottomRightRadius: BLOCK_R,
  },

  // ── Event block (key shape) ───────────────────────────────────────────
  eventWrapper: { alignSelf: 'flex-start' },
  eventRow: { flexDirection: 'row', alignItems: 'center' },

  eventCircle: {
    width: CIRCLE_D, height: CIRCLE_D,
    borderRadius: CIRCLE_D / 2,
    zIndex: 2,
    // Sits above the body so they merge visually
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25, shadowRadius: 5, elevation: 5,
  },
  eventBody: {
    position: 'relative',
    flexDirection: 'row', alignItems: 'center',
    // 50% overlap — circle center aligns with body left edge (OctoStudio exact)
    marginLeft: -(CIRCLE_D / 2),
    paddingLeft: CIRCLE_D / 2 + 10,
    paddingRight: 16,
    paddingVertical: 11,
    minHeight: CIRCLE_D,
    borderTopRightRadius: BLOCK_R, borderBottomRightRadius: BLOCK_R,
    borderTopLeftRadius: BLOCK_R / 2, borderBottomLeftRadius: BLOCK_R / 2,
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
