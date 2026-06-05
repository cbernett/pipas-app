import React, { useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Animated, PanResponder,
  ScrollView, Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '../context/AppContext';
import CategoryBand from './CategoryBand';
import { BLOCKS, BlockCategory } from '../data/blocks';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const COLLAPSED_HEIGHT = 72;
const OPEN_HEIGHT = SCREEN_HEIGHT * 0.58;

const CATEGORIES: BlockCategory[] = ['Movimento', 'Luz', 'Som', 'Eventos', 'Controle'];

export default function BlockLibraryBottomSheet() {
  const { libraryOpen, setLibraryOpen, expandedCategory, setExpandedCategory } = useApp();
  const insets = useSafeAreaInsets();

  const translateY = useRef(new Animated.Value(0)).current;
  const sheetHeight = useRef(new Animated.Value(COLLAPSED_HEIGHT)).current;

  useEffect(() => {
    Animated.spring(sheetHeight, {
      toValue: libraryOpen ? OPEN_HEIGHT : COLLAPSED_HEIGHT,
      useNativeDriver: false,
      tension: 80,
      friction: 12,
    }).start();
    if (!libraryOpen) setExpandedCategory(null);
  }, [libraryOpen]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 40) {
          setLibraryOpen(false);
        } else if (gestureState.dy < -40) {
          setLibraryOpen(true);
        }
      },
    })
  ).current;

  return (
    <Animated.View style={[styles.sheet, { height: sheetHeight }]}>
      {/* Handle area */}
      <TouchableOpacity
        style={styles.handleArea}
        onPress={() => setLibraryOpen(!libraryOpen)}
        activeOpacity={0.8}
        {...(libraryOpen ? {} : panResponder.panHandlers)}
      >
        <View style={styles.handle} />
        <Text style={styles.libraryLabel}>BIBLIOTECA DE BLOCOS</Text>
      </TouchableOpacity>

      {/* Category bands */}
      {libraryOpen && (
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
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
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
    height: 72,
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
