import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import SoundList from '../components/SoundList';
import SoundRecorder from '../components/SoundRecorder';
import SoundSelected from '../components/SoundSelected';

type SonsView = 'list' | 'record' | 'selected';

export interface Sound {
  id: string;
  name: string;
  fileKey: string;
  duration: string;
  uri?: string;   // blob URL for recorded sounds
}

export default function SonsScreen() {
  const [view, setView]                   = useState<SonsView>('list');
  const [selectedSound, setSelectedSound] = useState<Sound | null>(null);
  const [extraSounds, setExtraSounds]     = useState<Sound[]>([]);

  if (view === 'record') {
    return (
      <SoundRecorder
        onCancel={() => setView('list')}
        onSave={(name, uri) => {
          const newSound: Sound = {
            id: `rec_${Date.now()}`,
            name,
            fileKey: name,
            duration: '',
            uri,
          };
          setExtraSounds(prev => [...prev, newSound]);
          setView('list');
        }}
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
      extraSounds={extraSounds}
      onRecord={() => setView('record')}
      onSelectSound={(sound) => { setSelectedSound(sound); setView('selected'); }}
    />
  );
}

const styles = StyleSheet.create({});
