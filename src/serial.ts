/**
 * Web Serial API wrapper for the Pipas Board.
 *
 * Expected protocol (Arduino Serial.println):
 *   "TOUCH 1\n"  — touch pad 1 triggered
 *   "TOUCH 2\n"  — touch pad 2 triggered
 *   "TOUCH 3\n"  — touch pad 3 triggered
 *
 * Baud rate: 9600 (change BAUD below if your firmware uses a different rate)
 */

const BAUD = 9600;

type TouchListener = (pad: number) => void;

class PipasBoardSerial {
  private port: any = null;
  private reader: any = null;
  private listeners: TouchListener[] = [];
  private running = false;

  get isSupported() {
    return typeof navigator !== 'undefined' && 'serial' in navigator;
  }

  get isConnected() {
    return this.port !== null;
  }

  onTouch(fn: TouchListener) {
    this.listeners.push(fn);
    return () => { this.listeners = this.listeners.filter(l => l !== fn); };
  }

  private emit(pad: number) {
    this.listeners.forEach(fn => fn(pad));
  }

  async connect(): Promise<void> {
    if (!this.isSupported) throw new Error('Web Serial not supported in this browser. Use Chrome.');

    const nav = navigator as any;
    this.port = await nav.serial.requestPort();
    await this.port.open({ baudRate: BAUD });
    this.running = true;
    this.readLoop();
  }

  async disconnect(): Promise<void> {
    this.running = false;
    try { await this.reader?.cancel(); } catch (_) {}
    try { await this.port?.close(); } catch (_) {}
    this.port = null;
    this.reader = null;
  }

  private async readLoop() {
    const decoder = new TextDecoder();
    let buffer = '';

    while (this.running && this.port?.readable) {
      this.reader = this.port.readable.getReader();
      try {
        while (true) {
          const { value, done } = await this.reader.read();
          if (done) break;
          buffer += decoder.decode(value);
          const lines = buffer.split('\n');
          buffer = lines.pop() ?? '';
          for (const line of lines) {
            this.parseLine(line.trim());
          }
        }
      } catch (_) {
        // port closed or error — exit loop
      } finally {
        this.reader?.releaseLock();
        this.reader = null;
      }
    }
  }

  private parseLine(line: string) {
    // Accept "TOUCH 1", "T1", "touch1", "TOQUE 1", etc.
    const m = line.match(/(?:TOUCH|T|TOQUE)\s*(\d)/i);
    if (m) this.emit(parseInt(m[1], 10));
  }
}

export const board = new PipasBoardSerial();
