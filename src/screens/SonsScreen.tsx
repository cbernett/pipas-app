import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import SoundList from '../components/SoundList';
import SoundRecorder from '../components/SoundRecorder';
import SoundSelected from '../components/SoundSelected';

type SonsView = 'list' | 'record' | 'selected';

interface Sound {
  id: string;
  name: string;
  duration: string;
}

export default function SonsScreen() {
  const [view, setView] = useState<SonsView>('list');
  const [selectedSound, setSelectedSound] = useState<Sound | null>(null);

  if (view === 'record') {
    return (
      <SoundRecorder
        onCancel={() => setView('list')}
        onSave={(name) => setView('list')}
      />
    );
  }

  if (view === 'selected' && selectedSound) {
    return (
      <SoundSelected
        sound={selectedSound}
        onBack={() => setView('list')}
        onDelete={() => setView('list')}
      />
    );
  }

  return (
    <SoundList
      onRecord={() => setView('record')}
      onSelectSound={(sound) => { setSelectedSound(sound); setView('selected'); }}
    />
  );
}
