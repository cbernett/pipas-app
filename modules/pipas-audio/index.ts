import { requireNativeModule } from 'expo-modules-core';

const NativeModule = requireNativeModule('PipasAudio');

export const PipasAudio = {
  play(name: string): Promise<void> {
    return NativeModule.play(name);
  },
  playFile(path: string): Promise<void> {
    return NativeModule.playFile(path);
  },
  playFileAtSpeed(path: string, speed: number): Promise<void> {
    return NativeModule.playFileAtSpeed(path, speed);
  },
  playFileWithEcho(path: string): Promise<void> {
    return NativeModule.playFileWithEcho(path);
  },
  playFileWithRobot(path: string): Promise<void> {
    return NativeModule.playFileWithRobot(path);
  },
  stopFile(path: string): Promise<void> {
    return NativeModule.stopFile(path);
  },
  stopAll(): Promise<void> {
    return NativeModule.stopAll();
  },
};
