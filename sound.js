/* Tiny synthesized sound effects (no audio files). Browsers only allow audio after a tap, which is when these play. */

let ctx = null;
let enabled = true;

export const setSoundEnabled = on => { enabled = on; };

function audio() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function tone(freq, start, dur, { type = 'sine', gain = 0.12, slide = 0 } = {}) {
  const a = audio();
  if (!a) return;
  const t = a.currentTime + start;
  const osc = a.createOscillator();
  const g = a.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  if (slide) osc.frequency.exponentialRampToValueAtTime(freq * slide, t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(gain, t + 0.015);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(g).connect(a.destination);
  osc.start(t);
  osc.stop(t + dur + 0.05);
}

const SOUNDS = {
  tap: () => tone(660, 0, 0.06, { type: 'triangle', gain: 0.05 }),
  set: () => { tone(880, 0, 0.12, { type: 'triangle' }); tone(1320, 0.07, 0.16, { type: 'triangle', gain: 0.08 }); },
  rest: () => { tone(988, 0, 0.15); tone(988, 0.22, 0.15); tone(1319, 0.44, 0.3); },
  quest: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.09, 0.35, { type: 'triangle', gain: 0.1 })),
  level: () => {
    [392, 523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, i * 0.08, 0.5, { type: 'sawtooth', gain: 0.045 }));
    tone(1568, 0.5, 0.9, { type: 'sine', gain: 0.08 });
  },
  rank: () => {
    tone(130, 0, 1.2, { type: 'sawtooth', gain: 0.06, slide: 2 });
    [523, 784, 1047, 1568].forEach((f, i) => tone(f, 0.5 + i * 0.12, 0.8, { type: 'triangle', gain: 0.08 }));
  },
  coin: () => { tone(1319, 0, 0.08, { type: 'square', gain: 0.04 }); tone(1760, 0.07, 0.18, { type: 'square', gain: 0.04 }); },
  penalty: () => { tone(220, 0, 0.4, { type: 'sawtooth', gain: 0.07, slide: 0.5 }); tone(160, 0.3, 0.6, { type: 'sawtooth', gain: 0.06, slide: 0.6 }); },
  unlock: () => [784, 988, 1175].forEach((f, i) => tone(f, i * 0.07, 0.3, { type: 'triangle', gain: 0.08 })),
};

export function sfx(name) {
  if (!enabled || !SOUNDS[name]) return;
  try {
    SOUNDS[name]();
  } catch { /* audio unavailable */ }
}
