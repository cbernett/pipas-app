import React, { useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Animated,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '../context/AppContext';
import CategoryBand from './CategoryBand';
import { BLOCKS, BlockCategory } from '../data/blocks';

const CATEGORIES: BlockCategory[] = ['Movimento', 'Luz', 'Som', 'Eventos', 'Controle'];

const HANDLE_HEIGHT = 64;
const BAND_HEIGHT   = 56;
// Drawer is always this height when open — never changes
const OPEN_HEIGHT   = HANDLE_HEIGHT + CATEGORIES.length * BAND_HEIGHT; // 336

// Peek: how many px of the category above show when a category is expanded
const PEEK = 16;

export default function BlockLibraryBottomSheet() {
  const { libraryOpen, setLibraryOpen, expandedCategory, setExpandedCategory, trashHover } = useApp();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);

  const sheetHeight = useRef(new Animated.Value(HANDLE_HEIGHT)).current;

  // Height only changes on open/close — not on category selection
  useEffect(() => {
    Animated.spring(sheetHeight, {
      toValue: libraryOpen ? OPEN_HEIGHT : HANDLE_HEIGHT,
      useNativeDriver: false,
      tension: 90,
      friction: 14,
    }).start();

    if (!libraryOpen) {
      // Don't reset expandedCategory — preserve it so reopening returns to same spot
      scrollRef.current?.scrollTo({ y: 0, animated: false });
    }
  }, [libraryOpen]);

  // Scroll when category selection changes — drawer height stays fixed
  useEffect(() => {
    if (expandedCategory) {
      const idx = CATEGORIES.indexOf(expandedCategory as BlockCategory);
      // Show 16px of the previous bar peeking above; first category goes flush to top
      const scrollY = Math.max(0, idx * BAND_HEIGHT - PEEK);
      scrollRef.current?.scrollTo({ y: scrollY, animated: true });
    } else {
      scrollRef.current?.scrollTo({ y: 0, animated: true });
    }
  }, [expandedCategory]);

  const handleCategoryToggle = (cat: BlockCategory) => {
    setExpandedCategory(expandedCategory === cat ? null : cat);
  };

  return (
    <Animated.View style={[styles.sheet, { height: sheetHeight }]}>
      {/* Handle / header */}
      <TouchableOpacity
        style={styles.handleArea}
        onPress={() => setLibraryOpen(!libraryOpen)}
        activeOpacity={0.8}
      >
        <View style={styles.handle} />
        <Text style={styles.libraryLabel}>BIBLIOTECA DE BLOCOS</Text>
      </TouchableOpacity>

      {/* Fixed-order category list; scrolls programmatically on selection */}
      <ScrollView
        ref={scrollRef}
        style={[styles.scrollView, trashHover && styles.scrollDimmed]}
        showsVerticalScrollIndicator={false}
        scrollEnabled={true}
      >
        {CATEGORIES.map((cat) => (
          <CategoryBand
            key={cat}
            category={cat}
            blocks={BLOCKS.filter((b) => b.category === cat)}
            isExpanded={expandedCategory === cat}
            onToggle={() => handleCategoryToggle(cat)}
          />
        ))}
        <View style={{ height: insets.bottom }} />
      </ScrollView>

      {/* Trash overlay — shown over entire drawer when block is dragged over it */}
      {trashHover && (
        <View style={styles.trashOverlay} pointerEvents="none">
          <Text style={styles.trashIcon}>🗑️</Text>
          <Text style={styles.trashLabel}>SOLTAR PARA APAGAR</Text>
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  sheet: {
    width: '100%',
    backgroundColor: '#1C1F2B',
    overflow: 'hidden',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.12)',
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(255,255,255,0.08)',
    borderRightWidth: 1,
    borderRightColor: 'rgba(255,255,255,0.08)',
  },
  handleArea: {
    height: HANDLE_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    flexShrink: 0,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginTop: -4,
  },
  libraryLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
  },
  scrollView: {
    flex: 1,
  },
  scrollDimmed: {
    opacity: 0.25,
  },
  trashOverlay: {
    position: 'absolute' as any,
    top: 0, left: 0, right: 0, bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  trashIcon: {
    fontSize: 36,
  },
  trashLabel: {
    color: 'rgba(255,120,120,0.9)',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
  },
});
