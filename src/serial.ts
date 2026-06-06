/**
 * Web Serial API wrapper for the Pipas Board.
 *
 * Protocol (board → app):
 *   Continuous stream of single ASCII bytes, no newlines:
 *     '0' = no touch
 *     '1' = pad 1 touched
 *     '2' = pad 2 touched
 *     '3' = pad 3 touched
 *
 * Protocol (app → board):
 *   Single byte: upper nibble = command type, lower nibble = value
 *   e.g. LED on pad 1 = 0x11, motor = 0x21
 *
 * Baud rate: 9600
 */

type TouchListener   = (pad: number) => void;
type RawLineListener = (line: string) => void;

export const COMMON_BAUD_RATES = [9600, 57600, 115200, 19200, 38400];

const DEBOUNCE_MS = 350; // ignore same pad within this window

class PipasBoardSerial {
  private port: any   = null;
  private reader: any = null;
  private touchListeners:  TouchListener[]   = [];
  private rawListeners:    RawLineListener[] = [];
  private running  = false;
  private baud     = 9600;

  // Debounce: track last emit time per pad
  private lastEmit: Record<number, number> = {};
  // State tracking: only fire on change (avoids repeated triggers from same byte)
  private prevRaw = -1;

  get isSupported() {
    return typeof navigator !== 'undefined' && 'serial' in navigator;
  }

  get isConnected() { return this.port !== null; }

  setBaudRate(rate: number) { this.baud = rate; }

  onTouch(fn: TouchListener): () => void {
    this.touchListeners.push(fn);
    return () => { this.touchListeners = this.touchListeners.filter(l => l !== fn); };
  }

  onRawLine(fn: RawLineListener): () => void {
    this.rawListeners.push(fn);
    return () => { this.rawListeners = this.rawListeners.filter(l => l !== fn); };
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
    if (!this.isSupported) {
      throw new Error('Web Serial não suportado. Use o Google Chrome.');
    }
    const nav = navigator as any;
    this.port = await nav.serial.requestPort();
    await this.port.open({
      baudRate:    this.baud,
      dataBits:    8,
      stopBits:    1,
      parity:      'none',
      flowControl: 'none',
    });

    // Toggle DTR to wake the board
    try {
      await this.port.setSignals({ dataTerminalReady: false, requestToSend: false });
      await new Promise(r => setTimeout(r, 100));
      await this.port.setSignals({ dataTerminalReady: true,  requestToSend: true  });
    } catch (_) {}

    this.running = true;
    this.emitRaw(`[conectado a ${this.baud} baud — aguardando toque…]`);
    this.readLoop();
  }

  async disconnect(): Promise<void> {
    this.emitRaw('[desconectado]');
    this.running = false;
    try { await this.reader?.cancel(); } catch (_) {}
    try { await this.port?.close(); }    catch (_) {}
    this.port   = null;
    this.reader = null;
  }

  /** Send a single-byte command to the board (e.g. LED on, motor on) */
  async sendCommand(type: number, value: number): Promise<void> {
    if (!this.port?.writable) return;
    const writer = this.port.writable.getWriter();
    try {
      await writer.write(new Uint8Array([(type << 4) | (value & 0x0F)]));
    } finally {
      writer.releaseLock();
    }
  }

  private async readLoop() {
    const decoder = new TextDecoder();

    while (this.running && this.port?.readable) {
      this.reader = this.port.readable.getReader();
      try {
        while (true) {
          const { value, done } = await this.reader.read();
          if (done) break;

          // Process byte-by-byte — protocol has no newlines
          const text = decoder.decode(value);
          for (const ch of text) {
            this.parseByte(ch);
          }
        }
      } catch (err: any) {
        if (this.running) {
          this.emitRaw(`[erro: ${err?.message ?? String(err)}]`);
        }
      } finally {
        this.reader?.releaseLock();
        this.reader = null;
      }
    }
  }

  private parseByte(ch: string) {
    const n = parseInt(ch, 10);
    if (isNaN(n)) return;

    // Only process state changes — ignore repeated identical bytes
    if (n === this.prevRaw) return;
    this.prevRaw = n;

    // Firmware is 0-indexed: '0' = pad 1, '1' = pad 2, '2' = pad 3
    // Convert to 1-indexed for the app
    const pad = n + 1; // 1, 2, 3
    this.emitRaw(`toque ${pad}`);
    this.emitTouch(pad);
  }
}

export const board = new PipasBoardSerial();
