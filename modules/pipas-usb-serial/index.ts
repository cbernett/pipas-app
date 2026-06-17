import { requireNativeModule, EventEmitter } from 'expo-modules-core';

type DataEvent = { bytes: number[] };
type DisconnectEvent = { reason: string };

const NativeModule = requireNativeModule('PipasUsbSerial');
const emitter = new EventEmitter(NativeModule as any);

export const PipasUsbSerial = {
  isSupported(): boolean {
    return NativeModule.isSupported();
  },
  connect(baudRate: number): Promise<void> {
    return NativeModule.connect(baudRate);
  },
  disconnect(): Promise<void> {
    return NativeModule.disconnect();
  },
  write(bytes: number[]): Promise<void> {
    return NativeModule.write(bytes);
  },
  onData(fn: (bytes: number[]) => void): () => void {
    const sub = emitter.addListener('onData', (e: DataEvent) => fn(e.bytes));
    return () => sub.remove();
  },
  onDisconnect(fn: (reason: string) => void): () => void {
    const sub = emitter.addListener('onDisconnect', (e: DisconnectEvent) => fn(e.reason));
    return () => sub.remove();
  },
};
