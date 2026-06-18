import { requireNativeModule } from 'expo-modules-core';

const NativeModule = requireNativeModule('PipasAudio');

export const PipasAudio = {
  play(name: string): Promise<void> {
    return NativeModule.play(name);
  },
  stopAll(): Promise<void> {
    return NativeModule.stopAll();
  },
};
