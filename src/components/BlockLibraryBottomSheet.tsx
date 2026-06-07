import React, { useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Animated,
  ScrollView, Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '../context/AppContext';
import CategoryBand from './CategoryBand';
import { BLOCKS, BlockCategory } from '../data/blocks';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const COLLAPSED_HEIGHT = 72;
const OPEN_HEIGHT      = SCREEN_HEIGHT * 0.58;
// How far to push the sheet below the fold when collapsed
const HIDDEN_OFFSET    = OPEN_HEIGHT - COLLAPSED_HEIGHT;

const CATEGORIES: BlockCategory[] = ['Movimento', 'Luz', 'Som', 'Eventos', 'Controle'];

export default function BlockLibraryBottomSheet() {
  const { libraryOpen, setLibraryOpen, expandedCategory, setExpandedCategory } = useApp();
  const insets = useSafeAreaInsets();

  // Slide the sheet down by HIDDEN_OFFSET when collapsed, 0 when open
  const translateY = useRef(new Animated.Value(HIDDEN_OFFSET)).current;

  useEffect(() => {
    Animated.spring(translateY, {
      toValue: libraryOpen ? 0 : HIDDEN_OFFSET,
      useNativeDriver: true,
      tension: 80,
      friction: 12,
    }).start();
    if (!libraryOpen) setExpandedCategory(null);
  }, [libraryOpen]);

  return (
    <Animated.View style={[styles.sheet, { transform: [{ translateY }] }]}>
      {/* Handle / header */}
      <TouchableOpacity
        style={styles.handleArea}
        onPress={() => setLibraryOpen(!libraryOpen)}
        activeOpacity={0.8}
      >
        <View style={styles.handle} />
        <Text style={styles.libraryLabel}>BIBLIOTECA DE BLOCOS</Text>
      </TouchableOpacity>

      {/* Category bands — always mounted so pointer events stay attached */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {CATEGORIES.map((cat) => (
          <CategoryBand
            key={cat}
            category={cat}
            blocks={BLOCKS.filter((b) => b.category === cat)}
            isExpanded={expandedCategory === cat}
            onToggle={() =>
              setExpandedCategory(expandedCategory === cat ? null : cat)
            }
          />
        ))}
        <View style={{ height: insets.bottom + 20 }} />
      </ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: OPEN_HEIGHT,         // fixed height, translateY slides it off-screen
    backgroundColor: '#1C1F2B',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 20,
  },
  handleArea: {
    height: COLLAPSED_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.25)',
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
});
