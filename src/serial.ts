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

type TouchListener      = (pad: number) => void;
type RawLineListener    = (line: string) => void;
type DisconnectListener = () => void;

export const COMMON_BAUD_RATES = [9600, 57600, 115200, 19200, 38400];

const DEBOUNCE_MS = 350; // ignore same pad within this window

class PipasBoardSerial {
  private port: any   = null;
  private reader: any = null;
  private touchListeners:      TouchListener[]      = [];
  private rawListeners:        RawLineListener[]    = [];
  private disconnectListeners: DisconnectListener[] = [];
  private running  = false;
  private baud     = 115200;

  // Debounce: track last emit time per pad
  private lastEmit: Record<number, number> = {};

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
    if (!this.isSupported) {
      throw new Error('Web Serial não suportado. Use o Google Chrome.');
    }
    const nav = navigator as any;

    // requestPort() MUST be the first async call after the user gesture —
    // any prior await breaks Chrome's gesture-chain and silently blocks the picker.
    this.port = await nav.serial.requestPort();

    // If the port is already open (e.g. left open from a previous session),
    // close it cleanly before re-opening.
    try { await this.port.close(); } catch (_) {}

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

    // Auto-detect physical USB disconnect
    const nav2 = navigator as any;
    const handlePortDisconnect = (event: any) => {
      if (event.target === this.port || (this.port && event.target?.getInfo && this.port?.getInfo &&
          JSON.stringify(event.target.getInfo()) === JSON.stringify(this.port.getInfo()))) {
        this.running = false;
        this.port   = null;
        this.reader = null;
        this.emitRaw('[cabo desconectado]');
        this.disconnectListeners.forEach(fn => fn());
        nav2.serial.removeEventListener('disconnect', handlePortDisconnect);
      }
    };
    nav2.serial.addEventListener('disconnect', handlePortDisconnect);

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
        // Wrap in try-catch — releaseLock() can itself throw if the reader was
        // already released (e.g. after cancel()), which would escape the finally
        // block and kill the outer while loop permanently.
        try { this.reader?.releaseLock(); } catch (_) {}
        this.reader = null;
      }
      // Brief pause before retrying so a persistent error doesn't spin at 100% CPU
      if (this.running) await new Promise(r => setTimeout(r, 20));
    }
  }

  private parseByte(ch: string) {
    const n = parseInt(ch, 10);
    if (isNaN(n)) return;

    // Don't deduplicate via prevRaw — the board may not send a "no touch" byte
    // between presses, so prevRaw would block re-triggers of the same pad.
    // The 350ms debounce in emitTouch is sufficient to prevent duplicate fires.

    // Firmware is 0-indexed: '0' = pad 1, '1' = pad 2, '2' = pad 3
    // Convert to 1-indexed for the app
    const pad = n + 1; // 1, 2, 3
    if (pad < 1 || pad > 3) return; // ignore out-of-range bytes
    this.emitRaw(`toque ${pad}`);
    this.emitTouch(pad);
  }
}

export const board = new PipasBoardSerial();
