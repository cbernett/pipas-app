import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Platform, Modal, Animated, ScrollView, useWindowDimensions,
} from 'react-native';
import { WorkspaceBlock, useApp } from '../context/AppContext';
import { BLOCK_TEMPLATES, BlockParamDef } from '../data/blocks';
import { SOUND_SECTIONS, QUICK_PICKS, EMOJI_FOR, NAME_FOR, ALL_SOUNDS } from '../data/soundData';
import { playSound } from '../audio';

export const TAB_W      = 36;
export const TAB_H      = 9;   // reduced — indent is less deep
export const TAB_OFFSET = 20;
const BLOCK_R           = 18;
const WS_BG             = '#1A1F2E';  // workspace background = indent colour

const BRACKET_DEFIDS = ['ctrl_2', 'ctrl_3', 'ctrl_4', 'ctrl_5'];

interface Props {
  block: WorkspaceBlock;
  isFirst?: boolean;
  isLast?: boolean;
  preview?: boolean;
  showBracket?: boolean;  // force bracket rendering even in preview (used by library)
  isDragging?: boolean;
  isActive?: boolean;
  inBracket?: boolean;
  isBracketHovered?: boolean;
  bracketInsertAt?: number;   // index within innerBlocks to show drop spacer
  elseInsertAt?: number;      // index within elseBlocks to show drop spacer
  draggedH?: number;          // height of the dragged block (for spacer sizing)
  onEventTap?: () => void;
  onBlockTap?: () => void;
}

export default function CodeBlock(props: Props) {
  const { block } = props;
  const isEvent   = block.category === 'Eventos';
  const isBracket = BRACKET_DEFIDS.includes(block.defId) && (!props.preview || props.showBracket);
  const parts     = BLOCK_TEMPLATES[block.defId] ?? [block.label];

  if (isBracket) return <BracketBlock {...props} parts={parts} />;
  if (isEvent)   return <EventBlock   {...props} parts={parts} />;
  return                <StackBlock   {...props} parts={parts} />;
}

// ─── Event block — seamless pill with circular left end ──────────────────────

function EventBlock({ block, preview, isDragging, isActive, onEventTap, onBlockTap, parts }: Props & { parts: any[] }) {
  // A "start" event has no param parts — just text. Make it span full width.
  const isFullWidth = parts.every(p => typeof p === 'string');

  const body = (
    <View style={[
      styles.eventBody, { backgroundColor: block.color },
      isFullWidth && styles.eventBodyFull,
      isDragging && styles.bodyDragging,
      isActive   && styles.bodyActive,
    ]}>
      <BlockLabel blockId={block.id} parts={parts} />
    </View>
  );

  return (
    <View style={[styles.wrapper, isFullWidth && styles.wrapperFull]}>
      {(onEventTap || onBlockTap) && !preview ? (
        <TouchableOpacity
          onPress={onEventTap ?? onBlockTap}
          activeOpacity={0.82}
          style={isFullWidth ? { width: '100%' } : undefined}
        >
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

function StackBlock({ block, preview, isDragging, isActive, inBracket, onEventTap, onBlockTap, parts }: Props & { parts: any[] }) {
  const body = (
    <View style={[
      styles.body, { backgroundColor: block.color },
      inBracket && { borderTopLeftRadius: 0, borderBottomLeftRadius: 0, shadowOpacity: 0, elevation: 0 },
      isDragging && styles.bodyDragging,
      isActive   && styles.bodyActive,
    ]}>
      {/* Indent slot: workspace-bg coloured so tab from above fills it */}
      {!preview && <View style={styles.indent} />}
      <BlockLabel blockId={block.id} parts={parts} />
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

// Width of the bracket arm column — inner blocks sit to the right of this.
// Their indents are at ARM_W + TAB_OFFSET from the bracket's left edge.
const BRACKET_ARM_W = 20;

function BracketBlock({ block, preview, isActive, isBracketHovered, bracketInsertAt, elseInsertAt, draggedH = 44, parts }: Props & { parts: any[] }) {
  const inner    = block.innerBlocks ?? [];
  const hasInner = inner.length > 0;
  const isIfElse = block.defId === 'ctrl_5';
  const elseInner    = block.elseBlocks ?? [];
  const hasElseInner = elseInner.length > 0;

  // Pulse animation when a block is dragged over this bracket's inner zone
  const hoverAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (isBracketHovered) {
      const pulse = Animated.loop(Animated.sequence([
        Animated.timing(hoverAnim, { toValue: 1, duration: 400, useNativeDriver: false }),
        Animated.timing(hoverAnim, { toValue: 0, duration: 400, useNativeDriver: false }),
      ]));
      pulse.start();
      return () => { pulse.stop(); hoverAnim.setValue(0); };
    } else {
      hoverAnim.setValue(0);
    }
  }, [isBracketHovered]);

  const hoverBg = hoverAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(91,196,209,0.08)', 'rgba(91,196,209,0.22)'],
  });
  const hoverBorderColor = hoverAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(91,196,209,0.4)', 'rgba(91,196,209,0.9)'],
  });

  // The bracketTop's tab must land at x = BRACKET_ARM_W + TAB_OFFSET from
  // the bracket's left, which equals where the first inner block's indent is.
  const innerTabLeft = BRACKET_ARM_W + TAB_OFFSET; // 40px

  return (
    <View style={styles.wrapper}>
      {/* Top bar */}
      <View style={[styles.bracketTop, { backgroundColor: block.color }, isActive && styles.bodyActive]}>
        {!preview && <View style={styles.indent} />}
        <BlockLabel blockId={block.id} parts={parts} />
      </View>

      {/* Tab below top bar — offset to align with inner blocks' indents.
          zIndex must exceed inner block zIndices so it renders on top. */}
      {!preview && (
        <View style={{ paddingLeft: innerTabLeft, zIndex: inner.length + 2 }}>
          <Tab color={block.color} />
        </View>
      )}

      {/* C-body: marginTop:-TAB_H pulls the body up so the tab above overlaps
          the first inner block's indent. zIndex:1 so its children stack correctly. */}
      <View style={[styles.bracketBody, { marginTop: preview ? 0 : -TAB_H, zIndex: 1 }]}>
        <View style={[styles.bracketArm, { backgroundColor: block.color }]} />
        <Animated.View style={[
          styles.bracketInner,
          isBracketHovered && {
            backgroundColor: hoverBg,
            borderWidth: 2,
            borderLeftWidth: 0,
            borderColor: hoverBorderColor,
            borderTopRightRadius: 6,
            borderBottomRightRadius: 6,
          },
        ]}>
          {hasInner
            ? (
                <>
                  {inner.map((ib, i) => (
                    <React.Fragment key={ib.id}>
                      {/* Drop spacer above this block */}
                      {bracketInsertAt === i && (
                        <View style={[styles.bracketInsertSpacer, { height: draggedH, marginTop: i === 0 ? 0 : -TAB_H }]} pointerEvents="none" />
                      )}
                      <View style={{ marginTop: i === 0 && bracketInsertAt !== 0 ? 0 : i === 0 ? 0 : -TAB_H, zIndex: inner.length - i + 1 }}>
                        <CodeBlock block={ib} isFirst={i === 0} isLast={i === inner.length - 1} inBracket />
                      </View>
                    </React.Fragment>
                  ))}
                  {/* Drop spacer after last block */}
                  {bracketInsertAt === inner.length && (
                    <View style={[styles.bracketInsertSpacer, { height: draggedH, marginTop: -TAB_H }]} pointerEvents="none" />
                  )}
                </>
              )
            : (
                <Animated.View style={[
                  styles.bracketSlotEmpty,
                  isBracketHovered && {
                    backgroundColor: hoverBg,
                  },
                ]} />
              )
          }
        </Animated.View>
      </View>

      {/* For if/else (ctrl_5): senão section between then and bottom */}
      {isIfElse && !preview && (
        <>
          {/* senão bar — same as a bracketTop but labelled "senão" */}
          <View style={[
            styles.bracketTop,
            { backgroundColor: block.color, zIndex: 0 },
            (hasInner) && { marginTop: -TAB_H },
          ]}>
            <View style={[styles.indent, { left: innerTabLeft }]} />
            <Text style={styles.elseLabel}>senão</Text>
          </View>

          {/* Tab into else zone */}
          <View style={{ paddingLeft: innerTabLeft, zIndex: elseInner.length + 2 }}>
            <Tab color={block.color} />
          </View>

          {/* else inner zone */}
          <View style={[styles.bracketBody, { marginTop: -TAB_H, zIndex: 1 }]}>
            <View style={[styles.bracketArm, { backgroundColor: block.color }]} />
            <View style={styles.bracketInner}>
              {hasElseInner
                ? (
                    <>
                      {elseInner.map((ib, i) => (
                        <React.Fragment key={ib.id}>
                          {elseInsertAt === i && (
                            <View style={[styles.bracketInsertSpacer, { height: draggedH, marginTop: i === 0 ? 0 : -TAB_H }]} pointerEvents="none" />
                          )}
                          <View style={{ marginTop: i === 0 ? 0 : -TAB_H, zIndex: elseInner.length - i + 1 }}>
                            <CodeBlock block={ib} isFirst={i === 0} isLast={i === elseInner.length - 1} inBracket />
                          </View>
                        </React.Fragment>
                      ))}
                      {elseInsertAt === elseInner.length && (
                        <View style={[styles.bracketInsertSpacer, { height: draggedH, marginTop: -TAB_H }]} pointerEvents="none" />
                      )}
                    </>
                  )
                : <View style={styles.bracketSlotEmpty} />
              }
            </View>
          </View>
        </>
      )}

      {/* Bottom bar */}
      <View style={[
        styles.bracketBottom,
        { backgroundColor: block.color, zIndex: 0 },
        (isIfElse ? hasElseInner : hasInner) && !preview && { marginTop: -TAB_H },
      ]}>
        <View style={[styles.indent, { left: innerTabLeft }]} />
      </View>

      {!preview && (
        <View style={styles.tabRow}>
          <Tab color={block.color} />
        </View>
      )}
    </View>
  );
}

// ─── Live param store ─────────────────────────────────────────────────────────
// Maps `${blockId}_${paramIdx}` → current string value.
// NumberBubble writes here on every change; AppContext reads here for execution.
export const liveParamValues = new Map<string, string>();

// ─── Label renderer ───────────────────────────────────────────────────────────

function BlockLabel({ blockId, parts }: { blockId: string; parts: Array<string | BlockParamDef> }) {
  return (
    <View style={styles.labelRow}>
      {parts.map((part, i) => {
        if (typeof part === 'string') return <Text key={i} style={styles.labelText}>{part}</Text>;
        if (part.type === 'number') return <NumberBubble key={i} blockId={blockId} paramIdx={i} value={part.value} />;
        return <DropdownBubble key={i} blockId={blockId} paramIdx={i} value={part.value} options={part.options} />;
      })}
    </View>
  );
}

function NumberBubble({ blockId, paramIdx, value }: { blockId: string; paramIdx: number; value: string }) {
  const liveKey = `${blockId}_${paramIdx}`;
  const [val, setVal] = useState(() => liveParamValues.get(liveKey) ?? value);
  const w = Math.max(32, val.length * 12 + 16);
  const handleChange = (v: string) => {
    setVal(v);
    liveParamValues.set(liveKey, v);
  };
  return (
    <View style={[styles.numBubble, { width: w }]}>
      <TextInput
        style={styles.numInput} value={val} onChangeText={handleChange}
        keyboardType="numeric" selectTextOnFocus
      />
    </View>
  );
}

function DropdownBubble({ blockId, paramIdx, value, options }: { blockId: string; paramIdx: number; value: string; options?: string[] }) {
  const liveKey = `${blockId}_${paramIdx}`;
  const [val, setVal]   = useState(() => liveParamValues.get(liveKey) ?? value);
  const [open, setOpen] = useState(false);
  const [pos, setPos]   = useState({ x: 0, y: 0 });
  const ref = useRef<View>(null);
  const { userSounds, setActiveTab } = useApp();
  const isSoundDropdown = options?.includes('meow!') ?? false;

  const handleSelect = (opt: string) => {
    setVal(opt);
    liveParamValues.set(liveKey, opt);
    setOpen(false);
  };

  const handleOpenSimple = () => {
    ref.current?.measureInWindow((x, y, _w, h) => {
      setPos({ x, y: y + h + 4 });
      setOpen(true);
    });
  };

  if (!isSoundDropdown) {
    // Simple dropdown for non-sound params (LED, motor, toque — 2-3 options)
    const opts = options ?? [value];
    return (
      <View ref={ref} testID="dropdown-bubble">
        <TouchableOpacity style={styles.dropBubble} onPress={handleOpenSimple} activeOpacity={0.8}>
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
                  onPress={() => handleSelect(opt)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.dropOptionText, opt === val && styles.dropOptionTextActive]}>{opt}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </TouchableOpacity>
        </Modal>
      </View>
    );
  }

  // Sound picker bottom sheet
  return (
    <View ref={ref} testID="dropdown-bubble">
      <TouchableOpacity style={styles.dropBubble} onPress={() => setOpen(true)} activeOpacity={0.8}>
        <Text style={styles.dropText}>{EMOJI_FOR[val] ?? '🎵'} {NAME_FOR[val] ?? val}</Text>
        <Text style={styles.dropChevron}>▾</Text>
      </TouchableOpacity>
      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <SoundPickerSheet
          current={val}
          userSounds={userSounds}
          onSelect={handleSelect}
          onClose={() => setOpen(false)}
          onRecord={() => { setOpen(false); setActiveTab('sons'); }}
        />
      </Modal>
    </View>
  );
}

function SoundPickerSheet({
  current, userSounds, onSelect, onClose, onRecord,
}: {
  current: string;
  userSounds: Array<{ name: string }>;
  onSelect: (s: string) => void;
  onClose: () => void;
  onRecord: () => void;
}) {
  const { height } = useWindowDimensions();
  const [query, setQuery] = useState('');
  const [preview, setPreview] = useState<string | null>(null);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const handlePreview = (fileKey: string) => {
    setPreview(fileKey);
    try { playSound(fileKey); } catch {}
    setTimeout(() => setPreview(null), 1000);
  };

  const q = query.trim().toLowerCase();
  const searchResults = q
    ? ALL_SOUNDS.filter(s =>
        s.name.toLowerCase().includes(q) ||
        s.fileKey.toLowerCase().includes(q)
      )
    : null;

  // User recording rows
  const userRows = userSounds.map(s => ({ fileKey: s.name, name: s.name, emoji: '🎙️' }));

  return (
    <TouchableOpacity style={styles.spOverlay} onPress={onClose} activeOpacity={1}>
      <View
        style={[styles.spSheet, { maxHeight: height * 0.72 }]}
        onStartShouldSetResponder={() => true}
      >
          {/* Header */}
          <View style={styles.spHeader}>
            <Text style={styles.spTitle}>🎵 Escolher Som</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Text style={styles.spClose}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Search */}
          <View style={styles.spSearchRow}>
            <Text style={styles.spSearchIcon}>🔍</Text>
            <TextInput
              style={styles.spSearchInput}
              placeholder="Buscar som..."
              placeholderTextColor="#AAA"
              value={query}
              onChangeText={setQuery}
              autoCorrect={false}
              clearButtonMode="while-editing"
            />
          </View>

          <ScrollView style={styles.spScroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            {searchResults ? (
              /* Search results */
              searchResults.length === 0 ? (
                <Text style={styles.spEmpty}>Nenhum resultado</Text>
              ) : (
                <View style={styles.spResultList}>
                  {searchResults.map(s => (
                    <SoundRow
                      key={s.fileKey}
                      emoji={s.emoji}
                      name={s.name}
                      fileKey={s.fileKey}
                      selected={s.fileKey === current}
                      previewing={preview === s.fileKey}
                      onSelect={onSelect}
                      onPreview={handlePreview}
                    />
                  ))}
                </View>
              )
            ) : (
              <>
                {/* Quick picks */}
                <Text style={styles.spSectionLabel}>Favoritos</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.spQuickRow}>
                  {QUICK_PICKS.map(fk => (
                    <TouchableOpacity
                      key={fk}
                      style={[styles.spChip, fk === current && styles.spChipActive]}
                      onPress={() => onSelect(fk)}
                      activeOpacity={0.75}
                    >
                      <Text style={styles.spChipEmoji}>{EMOJI_FOR[fk] ?? '🎵'}</Text>
                      <Text style={[styles.spChipName, fk === current && styles.spChipNameActive]}>
                        {NAME_FOR[fk] ?? fk}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                {/* User sounds */}
                {userRows.length > 0 && (
                  <>
                    <Text style={styles.spSectionLabel}>Meus Sons</Text>
                    <View style={styles.spResultList}>
                      {userRows.map(s => (
                        <SoundRow
                          key={s.fileKey}
                          emoji={s.emoji}
                          name={s.name}
                          fileKey={s.fileKey}
                          selected={s.fileKey === current}
                          previewing={false}
                          onSelect={onSelect}
                          onPreview={() => {}}
                        />
                      ))}
                    </View>
                  </>
                )}

                {/* Library sections — collapsible */}
                <Text style={styles.spSectionLabel}>Biblioteca</Text>
                {SOUND_SECTIONS.map(section => {
                  const isOpen = expandedSection === section.title;
                  return (
                    <View key={section.title} style={styles.spSection}>
                      <TouchableOpacity
                        style={[styles.spSectionHeader, { borderLeftColor: section.color }]}
                        onPress={() => setExpandedSection(isOpen ? null : section.title)}
                        activeOpacity={0.75}
                      >
                        <Text style={styles.spSectionTitle}>{section.title}</Text>
                        <Text style={styles.spSectionChevron}>{isOpen ? '▴' : '▾'}</Text>
                      </TouchableOpacity>
                      {isOpen && (
                        <View style={styles.spResultList}>
                          {section.sounds.map(s => (
                            <SoundRow
                              key={s.fileKey}
                              emoji={s.emoji}
                              name={s.name}
                              fileKey={s.fileKey}
                              selected={s.fileKey === current}
                              previewing={preview === s.fileKey}
                              onSelect={onSelect}
                              onPreview={handlePreview}
                            />
                          ))}
                        </View>
                      )}
                    </View>
                  );
                })}
              </>
            )}

            {/* Record button */}
            <TouchableOpacity style={styles.spRecordBtn} onPress={onRecord} activeOpacity={0.8}>
              <Text style={styles.spRecordBtnText}>🎙️  Gravar meu som</Text>
            </TouchableOpacity>
            <View style={{ height: 24 }} />
          </ScrollView>
      </View>
    </TouchableOpacity>
  );
}

function SoundRow({ emoji, name, fileKey, selected, previewing, onSelect, onPreview }: {
  emoji: string; name: string; fileKey: string;
  selected: boolean; previewing: boolean;
  onSelect: (k: string) => void; onPreview: (k: string) => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.spRow, selected && styles.spRowActive]}
      onPress={() => onSelect(fileKey)}
      activeOpacity={0.75}
    >
      <Text style={styles.spRowEmoji}>{emoji}</Text>
      <Text style={[styles.spRowName, selected && styles.spRowNameActive]}>{name}</Text>
      {selected && <Text style={styles.spRowCheck}>✓</Text>}
      <TouchableOpacity
        style={[styles.spRowPlay, previewing && styles.spRowPlayActive]}
        onPress={() => onPreview(fileKey)}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Text style={styles.spRowPlayIcon}>{previewing ? '♪' : '▶'}</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // touch-action: none tells the browser not to claim this element's pointer
  // events for native scroll/pan — required for custom pointer-event drag to
  // work on the first grab without the browser intercepting the gesture.
  wrapper:     { alignSelf: 'flex-start', touchAction: 'none' } as any,
  wrapperFull: { alignSelf: 'flex-start', touchAction: 'none' } as any,

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
    borderTopLeftRadius: BLOCK_R,
    borderTopRightRadius: BLOCK_R,
    borderBottomLeftRadius: BLOCK_R,
    borderBottomRightRadius: BLOCK_R,
    gap: 6,
    // No vertical shadow — would create a visible line between body and tab
    shadowColor: '#000', shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15, shadowRadius: 3, elevation: 2,
  },
  // Inside a bracket: no left border radius so block sits flush against the arm
  bodyInBracket: { borderTopLeftRadius: 0, borderBottomLeftRadius: 0 },
  bodyDragging: { shadowOpacity: 0.4, shadowRadius: 12, elevation: 10 },
  bodyActive: {
    borderWidth: 2.5, borderColor: 'rgba(255,255,255,0.9)',
    shadowColor: '#FFF', shadowOpacity: 0.5, shadowRadius: 10,
  },

  // ── Tab — pull up 2px to close the shadow gap between body and tab
  tabRow: { paddingLeft: TAB_OFFSET, marginTop: -2 },
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
  eventBodyFull: {},

  // ── Bracket
  bracketTop: {
    position: 'relative',
    paddingTop: TAB_H + 6, paddingBottom: 8, paddingHorizontal: 16,
    borderTopLeftRadius: BLOCK_R, borderTopRightRadius: BLOCK_R,
    flexDirection: 'row', alignItems: 'center', gap: 6,
  },
  bracketBody:  { flexDirection: 'row' },
  bracketArm:   { width: BRACKET_ARM_W },
  bracketInner: { flex: 1 },
  bracketInnerHovered: {
    // hover styles now applied via Animated.View inline (pulsing teal)
  },

  // Concave inner corners: WS_BG quarter-circles positioned at the two
  // inner-left junctions of the C-shape (where arm meets inner area).
  // borderTopLeftRadius / borderBottomLeftRadius clips the WS_BG square into
  // a quarter-circle that makes the corner appear curved inward.
  // WS_BG quarter-circle overlays at the two inner-left junctions of the C.
  // The trick: a R×R square clipped to a quarter-circle using border-radius.
  //   borderBottomRightRadius on a R×R square → visible area = top-left quarter-circle
  //   borderTopRightRadius    on a R×R square → visible area = bottom-left quarter-circle
  // These sit above inner blocks (zIndex:100) so the WS_BG arc is always visible,
  // making the bracket's inner left corners appear concave.
  bracketConcaveTop: {
    position: 'absolute',
    top: 0, left: BRACKET_ARM_W,
    width: BLOCK_R, height: BLOCK_R,
    backgroundColor: WS_BG,
    borderBottomRightRadius: BLOCK_R,
    zIndex: 100,
  } as any,
  bracketConcaveBottom: {
    position: 'absolute',
    bottom: TAB_H, left: BRACKET_ARM_W,
    width: BLOCK_R, height: BLOCK_R,
    backgroundColor: WS_BG,
    borderTopRightRadius: BLOCK_R,
    zIndex: 100,
  } as any,

  // Empty inner slot — just reserves space, no visible border
  bracketSlotEmpty: {
    height: TAB_H + 6 + 20 + 8,   // same height as one block body
  },
  bracketSlotHovered: {
    // hover styles now applied via Animated.View inline (pulsing teal)
  },
  bracketInsertSpacer: {
    borderRadius: 10,
    borderWidth: 2,
    borderColor: 'rgba(91,196,209,0.7)',
    borderStyle: 'dashed',
    backgroundColor: 'rgba(91,196,209,0.08)',
    marginHorizontal: 4,
  } as any,

  elseLabel: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
    fontWeight: '700',
    paddingLeft: 8,
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

  numBubble: {
    borderBottomWidth: 1.5,
    borderBottomColor: 'rgba(255,255,255,0.7)',
    paddingHorizontal: 2,
  },
  numInput: {
    color: '#FFF', fontSize: 14, fontWeight: '700', textAlign: 'center',
    paddingVertical: Platform.OS === 'ios' ? 2 : 0, paddingHorizontal: 4,
    minWidth: 28,
  },

  // ── Dropdown bubble
  dropBubble: {
    borderBottomWidth: 1.5,
    borderBottomColor: 'rgba(255,255,255,0.7)',
    paddingHorizontal: 2, paddingVertical: 2,
    flexDirection: 'row', alignItems: 'center', gap: 4, flexShrink: 0,
  },
  dropText:    { color: '#FFF', fontSize: 13, fontWeight: '700' },
  dropChevron: { color: 'rgba(255,255,255,0.6)', fontSize: 10 },

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
  dropDivider: {
    height: 1,
    backgroundColor: '#E2E2E2',
  },
  dropRecordLink: {
    paddingHorizontal: 14,
    paddingVertical: 11,
    alignItems: 'center',
  },
  dropRecordLinkText: {
    fontSize: 12, fontWeight: '800', color: '#6B4FBB', letterSpacing: 0.5,
  },

  // ── Sound picker bottom sheet
  spOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  spSheet: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 8,
    overflow: 'hidden',
  },
  spHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  spTitle: {
    fontSize: 16, fontWeight: '800', color: '#1A1A2E',
  },
  spClose: {
    fontSize: 16, color: '#888', fontWeight: '700',
  },
  spSearchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 14,
    marginTop: 10,
    marginBottom: 4,
    backgroundColor: '#F4F4F8',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: Platform.OS === 'ios' ? 8 : 4,
  },
  spSearchIcon: { fontSize: 14, marginRight: 6 },
  spSearchInput: {
    flex: 1,
    fontSize: 14,
    color: '#1A1A2E',
    fontWeight: '500',
  },
  spScroll: { flex: 1 },
  spSectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#888',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginTop: 14,
    marginBottom: 4,
    paddingHorizontal: 16,
  },
  spQuickRow: {
    paddingLeft: 14,
    marginBottom: 4,
  },
  spChip: {
    alignItems: 'center',
    backgroundColor: '#F4F4F8',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginRight: 8,
    minWidth: 60,
  },
  spChipActive: {
    backgroundColor: '#6B4FBB',
  },
  spChipEmoji: { fontSize: 22, marginBottom: 2 },
  spChipName: {
    fontSize: 10, fontWeight: '700', color: '#555', textAlign: 'center',
  },
  spChipNameActive: { color: '#FFF' },
  spSection: {
    marginHorizontal: 14,
    marginBottom: 4,
  },
  spSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderLeftWidth: 3,
    borderRadius: 6,
    backgroundColor: '#F8F8FA',
    marginBottom: 2,
  },
  spSectionTitle: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    color: '#333',
  },
  spSectionChevron: {
    fontSize: 10, color: '#AAA', fontWeight: '700',
  },
  spResultList: {
    marginHorizontal: 14,
  },
  spRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    borderRadius: 6,
  },
  spRowActive: {
    backgroundColor: '#F0EEFF',
  },
  spRowEmoji: { fontSize: 18, marginRight: 10, width: 26, textAlign: 'center' },
  spRowName: {
    flex: 1,
    fontSize: 14, fontWeight: '600', color: '#222',
  },
  spRowNameActive: { color: '#6B4FBB', fontWeight: '700' },
  spRowCheck: { fontSize: 14, color: '#6B4FBB', marginRight: 8, fontWeight: '700' },
  spRowPlay: {
    width: 28, height: 28,
    borderRadius: 14,
    backgroundColor: '#F0F0F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  spRowPlayActive: { backgroundColor: '#6B4FBB' },
  spRowPlayIcon: { fontSize: 11, color: '#555' },
  spEmpty: {
    textAlign: 'center',
    color: '#AAA',
    fontSize: 14,
    paddingVertical: 24,
  },
  spRecordBtn: {
    marginHorizontal: 16,
    marginTop: 16,
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: '#6B4FBB',
    alignItems: 'center',
  },
  spRecordBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
});
