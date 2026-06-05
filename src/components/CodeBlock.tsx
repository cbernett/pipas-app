import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { WorkspaceBlock } from '../context/AppContext';

interface Props {
  block: WorkspaceBlock;
  isFirst?: boolean;
  isLast?: boolean;
  isConnected?: boolean;
  indentLevel?: number;
  onLongPress?: () => void;
}

export default function CodeBlock({ block, isFirst, isLast, isConnected, indentLevel = 0, onLongPress }: Props) {
  const isEvent = block.category === 'Eventos';
  const isControl = block.category === 'Controle';

  return (
    <TouchableOpacity
      onLongPress={onLongPress}
      activeOpacity={0.8}
      style={[styles.wrapper, { marginLeft: indentLevel * 20 }]}
    >
      {/* Notch connector top (puzzle piece feel) */}
      {!isFirst && isConnected && (
        <View style={styles.connectorTop} />
      )}

      <View style={[
        styles.block,
        { backgroundColor: block.color },
        isEvent && styles.eventBlock,
        isControl && styles.controlBlock,
      ]}>
        {/* Left puzzle nub */}
        <View style={[styles.leftNub, { backgroundColor: block.color }]} />

        <Text style={styles.label} numberOfLines={1}>{block.label}</Text>

        {isControl && (
          <View style={styles.controlBadge}>
            <Text style={styles.controlBadgeText}>{ }</Text>
          </View>
        )}
      </View>

      {/* Bottom connector nub */}
      {!isLast && isConnected && (
        <View style={styles.connectorBottom} />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignSelf: 'flex-start',
    minWidth: 200,
  },
  block: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    minHeight: 52,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  eventBlock: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
  },
  controlBlock: {
    borderRadius: 8,
  },
  leftNub: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 10,
    opacity: 0.6,
  },
  label: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    flex: 1,
  },
  controlBadge: {
    backgroundColor: 'rgba(0,0,0,0.15)',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  controlBadgeText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '600',
  },
  connectorTop: {
    width: 20,
    height: 8,
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: -4,
    zIndex: 1,
  },
  connectorBottom: {
    width: 20,
    height: 8,
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 3,
    alignSelf: 'center',
    marginTop: -4,
    zIndex: 1,
  },
});
