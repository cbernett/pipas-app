/**
 * Native (Android) USB serial implementation of the Pipas Board interface.
 *
 * Mirrors src/serial.ts's public API exactly (same method names/signatures)
 * so every other file can keep doing `import { board } from './serial'` —
 * Metro picks this file automatically on native platforms (.native.ts has
 * priority over .ts), and serial.ts (Web Serial) on web.
 *
 * Protocol is identical to serial.ts — see that file's header comment.
 */
import { PipasUsbSerial } from '../modules/pipas-usb-serial';

type TouchListener      = (pad: number) => void;
type RawLineListener    = (line: string) => void;
type DisconnectListener = () => void;

export const COMMON_BAUD_RATES = [9600, 57600, 115200, 19200, 38400];

const DEBOUNCE_MS = 350;

class PipasBoardSerialNative {
  private connected = false;
  private baud = 115200;
  private touchListeners:      TouchListener[]      = [];
  private rawListeners:        RawLineListener[]    = [];
  private disconnectListeners: DisconnectListener[] = [];
  private lastEmit: Record<number, number> = {};
  private unsubData: (() => void) | null = null;
  private unsubNativeDisconnect: (() => void) | null = null;

  get isSupported() {
    return PipasUsbSerial.isSupported();
  }

  get isConnected() { return this.connected; }

  setBaudRate(rate: number) { this.baud = rate; }

  onTouch(fn: TouchListener): () => void {
    this.touchListeners.push(fn);
    return () => { this.touchListeners = this.touchListeners.filter(l => l !== fn); };
  }

  onRawLine(fn: RawLineListener): () => void {
    this.rawListeners.push(fn);
    return () => { this.rawListeners = this.rawListeners.filter(l => l !== fn); };
  }

  onDisconnect(fn: DisconnectListener): () => void {
    this.disconnectListeners.push(fn);
    return () => { this.disconnectListeners = this.disconnectListeners.filter(l => l !== fn); };
  }

  private emitTouch(pad: number) {
    const now = Date.now();
    if (now - (this.lastEmit[pad] ?? 0) < DEBOUNCE_MS) return;
    this.lastEmit[pad] = now;
    this.touchListeners.forEach(fn => fn(pad));
  }

  private emitRaw(line: string) {
    this.rawListeners.forEach(fn => fn(line));
  }

  async connect(): Promise<void> {
    await PipasUsbSerial.connect(this.baud);
    this.connected = true;

    this.unsubData = PipasUsbSerial.onData((bytes) => {
      for (const b of bytes) this.parseByte(b);
    });
    this.unsubNativeDisconnect = PipasUsbSerial.onDisconnect(() => {
      this.connected = false;
      this.emitRaw('[cabo desconectado]');
      this.disconnectListeners.forEach(fn => fn());
    });

    this.emitRaw(`[conectado a ${this.baud} baud — aguardando toque…]`);
  }

  async disconnect(): Promise<void> {
    this.emitRaw('[desconectado]');
    this.unsubData?.();
    this.unsubNativeDisconnect?.();
    this.unsubData = null;
    this.unsubNativeDisconnect = null;
    await PipasUsbSerial.disconnect();
    this.connected = false;
  }

  async sendCommand(type: number, value: number): Promise<void> {
    if (!this.connected) return;
    await PipasUsbSerial.write([(type << 4) | (value & 0x0F)]);
  }

  async sendBrightness(ledIdx: number, brightness: number): Promise<void> {
    if (!this.connected) return;
    await PipasUsbSerial.write([(6 << 4) | (ledIdx & 0x0F), brightness & 0xFF]);
  }

  async sendSpeed(pinIdx: number, speed: number): Promise<void> {
    if (!this.connected) return;
    await PipasUsbSerial.write([(5 << 4) | (pinIdx & 0x0F), speed & 0xFF]);
  }

  private parseByte(n: number) {
    // Protocol: board sends ASCII '0', '1', '2' for pad 1, 2, 3
    if (n >= 0x30 && n <= 0x32) {
      const pad = (n - 0x30) + 1;
      this.emitRaw(`toque ${pad}`);
      this.emitTouch(pad);
      return;
    }
    // Ignore CR/LF silently
    if (n === 0x0A || n === 0x0D) return;
    // Log unexpected bytes so we can diagnose baud rate / protocol mismatches
    const printable = n >= 0x20 && n < 0x7F;
    this.emitRaw(`[byte: 0x${n.toString(16).padStart(2, '0')}${printable ? ` '${String.fromCharCode(n)}'` : ''}]`);
  }
}

export const board = new PipasBoardSerialNative();
