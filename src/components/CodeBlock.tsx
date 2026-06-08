import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Platform, Modal,
} from 'react-native';
import { WorkspaceBlock } from '../context/AppContext';
import { BLOCK_TEMPLATES, BlockParamDef } from '../data/blocks';

export const TAB_W      = 36;
export const TAB_H      = 9;   // reduced — indent is less deep
export const TAB_OFFSET = 20;
const BLOCK_R           = 18;
const WS_BG             = '#1A1F2E';  // workspace background = indent colour

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

// ─── Event block — seamless pill with circular left end ──────────────────────

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
    <View style={styles.wrapper}>
      {(onEventTap || onBlockTap) && !preview ? (
        <TouchableOpacity onPress={onEventTap ?? onBlockTap} activeOpacity={0.82}>
          {body}
        </TouchableOpacity>
      ) : body}
      {!preview && (
        <View style={styles.tabRow}>
          <View style={[styles.tab, { backgroundColor: block.color }]} />
        </View>
      )}
    </View>
  );
}

// ─── Stack block ──────────────────────────────────────────────────────────────

function StackBlock({ block, preview, isDragging, isActive, onEventTap, onBlockTap, parts }: Props & { parts: any[] }) {
  const body = (
    <View style={[
      styles.body, { backgroundColor: block.color },
      isDragging && styles.bodyDragging,
      isActive   && styles.bodyActive,
    ]}>
      {/* Indent slot: workspace-bg coloured so tab from above fills it */}
      {!preview && <View style={styles.indent} />}
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
      {!preview && (
        <View style={styles.tabRow}>
          <Tab color={block.color} />
        </View>
      )}
    </View>
  );
}

// ─── Tab with inner shadow (appears recessed into the indent) ─────────────────

function Tab({ color }: { color: string }) {
  return (
    <View style={[styles.tab, { backgroundColor: color }]}>
      {/* Inner shadow at top edge — makes the tab look sunken into the slot */}
      <View style={styles.tabInnerShadow} />
    </View>
  );
}

// ─── Bracket / C-block ────────────────────────────────────────────────────────

function BracketBlock({ block, preview, isActive, parts }: Props & { parts: any[] }) {
  const inner = block.innerBlocks ?? [];
  const hasInner = inner.length > 0;

  return (
    <View style={styles.wrapper}>
      {/* Top bar — same body style as StackBlock */}
      <View style={[styles.bracketTop, { backgroundColor: block.color }, isActive && styles.bodyActive]}>
        {!preview && <View style={styles.indent} />}
        <BlockLabel parts={parts} />
      </View>

      {/* Tab below top bar.  zIndex:2 so it renders ON TOP of the first inner
          block's indent — same trick Workspace uses between stacked blocks. */}
      {!preview && (
        <View style={[styles.tabRow, { zIndex: 2 }]}>
          <Tab color={block.color} />
        </View>
      )}

      {/* C-body.  marginTop:-TAB_H overlaps the tab above (first inner block's
          indent receives it).  zIndex:1 keeps last-block tab above bracketBottom. */}
      <View style={[styles.bracketBody, { marginTop: preview ? 0 : -TAB_H, zIndex: 1 }]}>
        <View style={[styles.bracketArm, { backgroundColor: block.color }]} />
        <View style={styles.bracketInner}>
          {hasInner
            ? inner.map((ib, i) => (
                <View
                  key={ib.id}
                  style={{
                    // First block: top-bar tab already overlaps (via bracketBody marginTop).
                    // Each subsequent block overlaps the previous tab, just like a stack.
                    marginTop: i === 0 ? 0 : -TAB_H,
                    zIndex: inner.length - i + 1,
                  }}
                >
                  <CodeBlock block={ib} isFirst={i === 0} isLast={i === inner.length - 1} />
                </View>
              ))
            : (
                // Placeholder — styled to look exactly like one block body
                <View style={[styles.bracketSlot, { borderColor: block.color }]}>
                  <View style={styles.indent} />
                </View>
              )
          }
        </View>
      </View>

      {/* Bottom bar.  zIndex:0 so last inner block's tab (in bracketBody, zIndex:1)
          shows through the indent notch here. */}
      <View style={[
        styles.bracketBottom,
        { backgroundColor: block.color, zIndex: 0 },
        hasInner && !preview && { marginTop: -TAB_H },
      ]}>
        <View style={styles.indent} />
        <Text style={styles.returnArrow}>↩</Text>
      </View>

      {!preview && (
        <View style={styles.tabRow}>
          <Tab color={block.color} />
        </View>
      )}
    </View>
  );
}

// ─── Label renderer ───────────────────────────────────────────────────────────

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
      <TextInput
        style={styles.numInput} value={val} onChangeText={setVal}
        keyboardType="numeric" selectTextOnFocus
      />
    </View>
  );
}

function DropdownBubble({ value, options }: { value: string; options?: string[] }) {
  const [val, setVal]   = useState(value);
  const [open, setOpen] = useState(false);
  const [pos, setPos]   = useState({ x: 0, y: 0 });
  const ref = useRef<View>(null);
  const opts = options ?? [value];

  const handleOpen = () => {
    ref.current?.measureInWindow((x, y, _w, h) => {
      setPos({ x, y: y + h + 4 });
      setOpen(true);
    });
  };

  return (
    <View ref={ref}>
      <TouchableOpacity style={styles.dropBubble} onPress={handleOpen} activeOpacity={0.8}>
        <Text style={styles.dropText}>{val}</Text>
        <Text style={styles.dropChevron}>▾</Text>
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <TouchableOpacity style={styles.dropOverlay} onPress={() => setOpen(false)} activeOpacity={1}>
          <View style={[styles.dropMenu, { top: pos.y, left: pos.x }]}>
            {opts.map(opt => (
              <TouchableOpacity
                key={opt}
                style={[styles.dropOption, opt === val && styles.dropOptionActive]}
                onPress={() => { setVal(opt); setOpen(false); }}
                activeOpacity={0.8}
              >
                <Text style={[styles.dropOptionText, opt === val && styles.dropOptionTextActive]}>
                  {opt}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // touch-action: none tells the browser not to claim this element's pointer
  // events for native scroll/pan — required for custom pointer-event drag to
  // work on the first grab without the browser intercepting the gesture.
  wrapper: { alignSelf: 'flex-start', touchAction: 'none' } as any,

  // ── Indent: workspace-bg colour so the tab from above "fills" the void
  indent: {
    position: 'absolute',
    top: 0, left: TAB_OFFSET,
    width: TAB_W, height: TAB_H,
    backgroundColor: WS_BG,
    borderBottomLeftRadius: 6, borderBottomRightRadius: 6,
  },

  // ── Stack block body — flat, no drop shadow so tab stays seamless
  body: {
    position: 'relative',
    flexDirection: 'row', alignItems: 'center',
    paddingTop: TAB_H + 6,
    paddingBottom: 8, paddingHorizontal: 16,
    borderRadius: BLOCK_R,
    gap: 6,
    // No vertical shadow — would create a visible line between body and tab
    shadowColor: '#000', shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15, shadowRadius: 3, elevation: 2,
  },
  bodyDragging: { shadowOpacity: 0.4, shadowRadius: 12, elevation: 10 },
  bodyActive: {
    borderWidth: 2.5, borderColor: 'rgba(255,255,255,0.9)',
    shadowColor: '#FFF', shadowOpacity: 0.5, shadowRadius: 10,
  },

  // ── Tab — no inner shadow, pure colour so it's seamless with the body
  tabRow: { paddingLeft: TAB_OFFSET },
  tab: {
    width: TAB_W, height: TAB_H,
    borderBottomLeftRadius: 6, borderBottomRightRadius: 6,
  },
  tabInnerShadow: {},  // unused — kept to avoid TS errors on Tab component

  // ── Event block — full pill: both sides are circular (radius 999)
  eventBody: {
    flexDirection: 'row', alignItems: 'center',
    borderTopLeftRadius: 999, borderBottomLeftRadius: 999,
    borderTopRightRadius: 999, borderBottomRightRadius: 999,
    paddingLeft: 16,
    paddingRight: 20,
    paddingVertical: 10,
    gap: 6,
    shadowColor: '#000', shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15, shadowRadius: 3, elevation: 2,
  },

  // ── Bracket
  bracketTop: {
    position: 'relative',
    paddingTop: TAB_H + 6, paddingBottom: 8, paddingHorizontal: 16,
    borderTopLeftRadius: BLOCK_R, borderTopRightRadius: BLOCK_R,
    flexDirection: 'row', alignItems: 'center', gap: 6,
  },
  bracketBody:  { flexDirection: 'row' },
  bracketArm:   { width: 20 },
  bracketInner: { flex: 1 },

  // Placeholder slot — same dimensions as one block body so a dropped block
  // fills the space exactly.
  bracketSlot: {
    position: 'relative',
    height: TAB_H + 6 + 20 + 8,   // paddingTop + label + paddingBottom = one block body
    borderRadius: BLOCK_R,
    borderWidth: 2,
    borderStyle: 'dashed',
    opacity: 0.5,
  },

  bracketBottom: {
    position: 'relative',
    height: TAB_H + 20,
    borderBottomLeftRadius: BLOCK_R, borderBottomRightRadius: BLOCK_R,
    alignItems: 'center', justifyContent: 'center',
  },
  returnArrow: { color: 'rgba(255,255,255,0.55)', fontSize: 14 },

  // ── Label
  labelRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 5, flexShrink: 1 },
  labelText: { color: '#FFF', fontSize: 14, fontWeight: '700' },

  numBubble: { backgroundColor: '#FFF', borderRadius: 6 },
  numInput: {
    color: '#1A1A2E', fontSize: 14, fontWeight: '700', textAlign: 'center',
    paddingVertical: Platform.OS === 'ios' ? 3 : 1, paddingHorizontal: 4,
  },

  // ── Dropdown bubble
  dropBubble: {
    backgroundColor: '#FFF', borderRadius: 6,
    paddingHorizontal: 7, paddingVertical: 4,
    flexDirection: 'row', alignItems: 'center', gap: 3, flexShrink: 0,
  },
  dropText:    { color: '#1A1A2E', fontSize: 13, fontWeight: '700' },
  dropChevron: { color: '#666', fontSize: 10 },

  // ── Dropdown modal menu
  dropOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  dropMenu: {
    position: 'absolute',
    backgroundColor: '#FFF',
    borderRadius: 10,
    overflow: 'hidden',
    minWidth: 140,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 20,
  },
  dropOption: {
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  dropOptionActive: {
    backgroundColor: '#F0EEFF',
  },
  dropOptionText: {
    fontSize: 14, fontWeight: '600', color: '#1A1A2E',
  },
  dropOptionTextActive: {
    color: '#6B4FBB',
    fontWeight: '700',
  },
});
