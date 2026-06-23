import { requireNativeModule } from 'expo-modules-core';

const NativeModule = requireNativeModule('PipasRecording');

export const PipasRecording = {
  /** Begin recording. Returns the file path where audio will be saved. */
  startRecording(): Promise<string> {
    return NativeModule.startRecording();
  },
  /** Stop recording. Returns the final file path of the recorded audio. */
  stopRecording(): Promise<string> {
    return NativeModule.stopRecording();
  },
  /** Cancel and discard the current recording. */
  cancelRecording(): Promise<void> {
    return NativeModule.cancelRecording();
  },
  /** Returns the current peak amplitude (0–32767). Call frequently while recording for a live meter. */
  getMaxAmplitude(): number {
    return NativeModule.getMaxAmplitude();
  },
};
