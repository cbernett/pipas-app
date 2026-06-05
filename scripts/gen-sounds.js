const fs = require('fs');
const path = require('path');

const SAMPLE_RATE = 44100;
const OUT_DIR = path.join(__dirname, '../assets/sounds');

function writeWav(filename, samples) {
  const numSamples = samples.length;
  const buf = Buffer.alloc(44 + numSamples * 2);

  // RIFF header
  buf.write('RIFF', 0);
  buf.writeUInt32LE(36 + numSamples * 2, 4);
  buf.write('WAVE', 8);
  buf.write('fmt ', 12);
  buf.writeUInt32LE(16, 16);           // chunk size
  buf.writeUInt16LE(1, 20);            // PCM
  buf.writeUInt16LE(1, 22);            // mono
  buf.writeUInt32LE(SAMPLE_RATE, 24);
  buf.writeUInt32LE(SAMPLE_RATE * 2, 28); // byte rate
  buf.writeUInt16LE(2, 32);            // block align
  buf.writeUInt16LE(16, 34);           // bits per sample
  buf.write('data', 36);
  buf.writeUInt32LE(numSamples * 2, 40);

  for (let i = 0; i < numSamples; i++) {
    const v = Math.max(-1, Math.min(1, samples[i]));
    buf.writeInt16LE(Math.round(v * 32767), 44 + i * 2);
  }

  fs.writeFileSync(path.join(OUT_DIR, filename), buf);
  console.log(`wrote ${filename} (${numSamples} samples)`);
}

function sine(freq, duration, amplitude = 0.6) {
  const n = Math.round(SAMPLE_RATE * duration);
  return Array.from({ length: n }, (_, i) => {
    const t = i / SAMPLE_RATE;
    const env = i < 200 ? i / 200 : i > n - 800 ? (n - i) / 800 : 1;
    return amplitude * env * Math.sin(2 * Math.PI * freq * t);
  });
}

function concat(...arrays) {
  return [].concat(...arrays);
}

function silence(duration) {
  return Array(Math.round(SAMPLE_RATE * duration)).fill(0);
}

// meow — chirpy rising tone like a cat
const meow = concat(
  sine(800, 0.05, 0.5),
  sine(900, 0.05, 0.55),
  sine(1000, 0.08, 0.6),
  sine(900, 0.06, 0.55),
  sine(700, 0.08, 0.4),
  silence(0.05)
);

// bah — low bleat
const bah = concat(
  sine(180, 0.03, 0.7),
  sine(200, 0.1, 0.75),
  sine(220, 0.06, 0.7),
  sine(190, 0.08, 0.6),
  silence(0.05)
);

// cheer — ascending fanfare notes
const cheer = concat(
  sine(523, 0.1),   // C5
  sine(659, 0.1),   // E5
  sine(784, 0.1),   // G5
  sine(1047, 0.2),  // C6
  silence(0.05)
);

// erro — descending buzz / error beep
const erro = concat(
  sine(440, 0.08, 0.7),
  sine(330, 0.08, 0.7),
  sine(220, 0.12, 0.7),
  silence(0.05)
);

// menu — short pop click
const menu = concat(
  sine(880, 0.03, 0.6),
  sine(1100, 0.04, 0.5),
  silence(0.03)
);

fs.mkdirSync(OUT_DIR, { recursive: true });
writeWav('meow.wav', meow);
writeWav('bah.wav', bah);
writeWav('cheer.wav', cheer);
writeWav('erro.wav', erro);
writeWav('menu.wav', menu);
