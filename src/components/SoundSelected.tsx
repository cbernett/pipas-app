import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, TextInput, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface Sound {
  id: string;
  name: string;
  duration: string;
}

interface Props {
  sound: Sound;
  onBack: () => void;
  onDelete: (id: string) => void;
}

export default function SoundSelected({ sound, onBack, onDelete }: Props) {
  const [name, setName] = useState(sound.name);
  const [isPlaying, setIsPlaying] = useState(false);
  const insets = useSafeAreaInsets();

  const handlePlay = () => {
    setIsPlaying(true);
    setTimeout(() => setIsPlaying(false), 1500);
  };

  const handleDelete = () => {
    Alert.alert('Apagar som', `Apagar "${name}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Apagar', style: 'destructive', onPress: () => { onDelete(sound.id); onBack(); } },
    ]);
  };

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      {/* Back */}
      <TouchableOpacity style={styles.backBtn} onPress={onBack}>
        <Text style={styles.backText}>← Sons</Text>
      </TouchableOpacity>

      {/* Name input */}
      <TextInput
        style={styles.nameInput}
        value={name}
        onChangeText={setName}
        placeholder="Nome do som"
        placeholderTextColor="#CCC"
      />

      <Text style={styles.duration}>{sound.duration}</Text>

      {/* Waveform */}
      <View style={styles.waveformContainer}>
        {[4, 8, 14, 20, 24, 18, 12, 20, 16, 10, 22, 14, 8, 18, 24, 16, 10, 14, 20, 8].map((h, i) => (
          <View key={i} style={[styles.wavebar, { height: h, backgroundColor: isPlaying ? '#6B4FBB' : '#CCC' }]} />
        ))}
      </View>

      {/* Play */}
      <TouchableOpacity
        style={[styles.playBtn, isPlaying && styles.playBtnActive]}
        onPress={handlePlay}
        activeOpacity={0.8}
      >
        <Text style={styles.playIcon}>{isPlaying ? '■' : '▶'}</Text>
      </TouchableOpacity>

      <View style={styles.spacer} />

      {/* Actions */}
      <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
        <Text style={styles.deleteText}>Apagar som</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.saveBtn} onPress={onBack}>
        <Text style={styles.saveText}>Salvar</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F8FC',
    padding: 24,
    alignItems: 'center',
  },
  backBtn: {
    alignSelf: 'flex-start',
    marginBottom: 24,
  },
  backText: {
    fontSize: 16,
    color: '#6B4FBB',
    fontWeight: '600',
  },
  nameInput: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1A1A2E',
    borderBottomWidth: 2,
    borderBottomColor: '#6B4FBB',
    paddingBottom: 8,
    alignSelf: 'stretch',
    textAlign: 'center',
  },
  duration: {
    marginTop: 8,
    fontSize: 14,
    color: '#999',
    fontWeight: '500',
  },
  waveformContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 60,
    gap: 4,
    marginVertical: 40,
    width: '100%',
    justifyContent: 'center',
  },
  wavebar: {
    width: 6,
    borderRadius: 3,
  },
  playBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#6B4FBB',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6B4FBB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  playBtnActive: {
    backgroundColor: '#9268F6',
  },
  playIcon: {
    color: '#FFF',
    fontSize: 22,
    marginLeft: 4,
  },
  spacer: {
    flex: 1,
  },
  deleteBtn: {
    alignSelf: 'stretch',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#EF4444',
    marginBottom: 12,
  },
  deleteText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#EF4444',
  },
  saveBtn: {
    alignSelf: 'stretch',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    backgroundColor: '#6B4FBB',
  },
  saveText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
  },
});
