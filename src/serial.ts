/**
 * Web Serial API wrapper for the Pipas Board.
 *
 * Touch message format — the parser accepts any of these (case-insensitive):
 *   "TOUCH 1", "T1", "TOQUE 1", "toque1", "1", "pad1", "cap1", "sensor1"
 *
 * If none of the above match, the raw line is still emitted to rawLine
 * listeners so you can see exactly what the board is sending.
 *
 * Baud rate defaults to 9600. Call board.setBaudRate(115200) before
 * connect() if your firmware uses a different rate.
 */

type TouchListener   = (pad: number) => void;
type RawLineListener = (line: string) => void;

export const COMMON_BAUD_RATES = [9600, 115200, 57600, 38400, 19200];

class PipasBoardSerial {
  private port: any   = null;
  private reader: any = null;
  private touchListeners:   TouchListener[]   = [];
  private rawListeners:     RawLineListener[] = [];
  private running = false;
  private baud    = 9600;

  get isSupported() {
    return typeof navigator !== 'undefined' && 'serial' in navigator;
  }

  get isConnected() { return this.port !== null; }

  setBaudRate(rate: number) { this.baud = rate; }

  onTouch(fn: TouchListener): () => void {
    this.touchListeners.push(fn);
    return () => { this.touchListeners = this.touchListeners.filter(l => l !== fn); };
  }

  /** Subscribe to every raw line received — useful for debugging */
  onRawLine(fn: RawLineListener): () => void {
    this.rawListeners.push(fn);
    return () => { this.rawListeners = this.rawListeners.filter(l => l !== fn); };
  }

  private emitTouch(pad: number) {
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
    await this.port.open({ baudRate: this.baud });
    this.running = true;
    this.emitRaw(`[conectado a ${this.baud} baud]`);
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
            const trimmed = line.trim();
            if (!trimmed) continue;
            this.emitRaw(trimmed);
            this.parseLine(trimmed);
          }
        }
      } catch (err: any) {
        if (this.running) {
          this.emitRaw(`[erro: ${err?.message ?? err}]`);
        }
      } finally {
        this.reader?.releaseLock();
        this.reader = null;
      }
    }
  }

  private parseLine(line: string) {
    const l = line.toLowerCase();

    // Explicit touch keywords: "TOUCH 1", "T1", "TOQUE 1", "toque1", etc.
    const keyword = l.match(/(?:touch|toque|pad|cap|sensor|t)\s*(\d)/);
    if (keyword) { this.emitTouch(parseInt(keyword[1], 10)); return; }

    // Bare digit: "1", "2", "3"
    const bare = l.match(/^(\d)$/);
    if (bare) { this.emitTouch(parseInt(bare[1], 10)); return; }

    // "key:1" or "pin:1" style
    const colon = l.match(/(?:key|pin|btn|button|touch|toque):\s*(\d)/);
    if (colon) { this.emitTouch(parseInt(colon[1], 10)); }
  }
}

export const board = new PipasBoardSerial();
