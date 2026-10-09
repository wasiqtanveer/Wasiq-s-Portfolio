// The whole sound palette, synthesized on the fly: paper, wood, metal, and air.
// Nothing is downloaded, the only sustained sound is the scroll wind (silent
// and torn down while the page is still), and the AudioContext is only created
// inside a real user gesture, so the page is silent until someone touches it.
//
// Every moment has its own voice. Controls are grouped by the material they
// look like (pill, paper, wood, slab, heavy); movement has its own kind of air
// (travel, wipe, dive, fling, send, drawer); and sounds sit in the stereo
// field where the thing that made them is on screen.

const STORAGE = 'portfolio-sound';
const listeners = new Set();
const playListeners = new Set();

let enabled = (() => {
  try { return localStorage.getItem(STORAGE) !== 'off'; } catch { return true; }
})();
let engine = null;
let armed = false;
const lastPlayed = new Map();

const jitter = (amount) => 1 + (Math.random() * 2 - 1) * amount;

function build() {
  const Audio = window.AudioContext || window.webkitAudioContext;
  if (!Audio) return null;
  const context = new Audio();
  const master = context.createGain();
  master.gain.value = enabled ? 0.9 : 0;
  const compressor = context.createDynamicsCompressor();
  compressor.threshold.value = -18; compressor.knee.value = 12; compressor.ratio.value = 3;
  compressor.attack.value = 0.003; compressor.release.value = 0.2;
  compressor.connect(master); master.connect(context.destination);

  // A small, warm room: decaying noise, darkened with a one-pole low-pass.
  const length = Math.floor(context.sampleRate * 0.9);
  const impulse = context.createBuffer(2, length, context.sampleRate);
  for (let channel = 0; channel < 2; channel++) {
    const data = impulse.getChannelData(channel);
    let smooth = 0;
    for (let i = 0; i < length; i++) {
      smooth += ((Math.random() * 2 - 1) - smooth) * 0.35;
      data[i] = smooth * Math.pow(1 - i / length, 3.2);
    }
  }
  const room = context.createConvolver();
  room.buffer = impulse;
  const wet = context.createGain();
  wet.gain.value = 0.22;
  room.connect(wet); wet.connect(compressor);

  const noise = context.createBuffer(1, context.sampleRate, context.sampleRate);
  const samples = noise.getChannelData(0);
  for (let i = 0; i < samples.length; i++) samples[i] = Math.random() * 2 - 1;

  return { context, master, dry: compressor, room, noise };
}

// Route a voice through an optional pan to the dry bus and, optionally, the room.
function output(node, { reverb = 0, pan = 0 } = {}) {
  const { context } = engine;
  let last = node;
  if (pan && context.createStereoPanner) {
    const panner = context.createStereoPanner();
    panner.pan.value = Math.max(-1, Math.min(1, pan));
    node.connect(panner); last = panner;
  }
  last.connect(engine.dry);
  if (reverb) {
    const send = context.createGain();
    send.gain.value = reverb;
    last.connect(send); send.connect(engine.room);
  }
}

function envelope(gain, start, peak, attack, release) {
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(Math.max(peak, 0.0002), start + attack);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + attack + release);
  return start + attack + release;
}

function noiseBurst(start, { frequency, q = 1, type = 'bandpass', peak, attack = 0.002, release = 0.02, reverb = 0, pan = 0 }) {
  const { context } = engine;
  const source = context.createBufferSource();
  source.buffer = engine.noise;
  const filter = context.createBiquadFilter();
  filter.type = type; filter.frequency.value = frequency; filter.Q.value = q;
  const gain = context.createGain();
  const end = envelope(gain, start, peak, attack, release);
  source.connect(filter); filter.connect(gain);
  output(gain, { reverb, pan });
  source.start(start, Math.random() * 0.5); source.stop(end + 0.02);
}

function tone(start, { type = 'sine', from, to = from, glide = 0.05, peak, attack = 0.003, release = 0.08, reverb = 0, lowpass, pan = 0 }) {
  const { context } = engine;
  const oscillator = context.createOscillator();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(from, start);
  if (to !== from) oscillator.frequency.exponentialRampToValueAtTime(to, start + glide);
  const gain = context.createGain();
  const end = envelope(gain, start, peak, attack, release);
  let last = oscillator;
  if (lowpass) {
    const filter = context.createBiquadFilter();
    filter.type = 'lowpass'; filter.frequency.value = lowpass;
    oscillator.connect(filter); last = filter;
  }
  last.connect(gain); output(gain, { reverb, pan });
  oscillator.start(start); oscillator.stop(end + 0.02);
}

// Moving air: filtered noise with a frequency path, a swell, a pan path, and
// optional flutter (amplitude wobble) for things that spin, rustle, or slide.
// `sweep` is [startHz, [at, hz], [at, hz]…] with `at` as a fraction of duration.
function air(start, { duration, type = 'bandpass', q = 0.9, sweep, peak, peakAt = 0.45, pan = [0, 0], reverb = 0.3, flutter }) {
  const { context } = engine;
  const end = start + duration;
  const source = context.createBufferSource();
  source.buffer = engine.noise; source.loop = true;
  const filter = context.createBiquadFilter();
  filter.type = type; filter.Q.value = q;
  filter.frequency.setValueAtTime(sweep[0], start);
  sweep.slice(1).forEach(([at, hz]) => filter.frequency.exponentialRampToValueAtTime(hz, start + duration * at));
  const gain = context.createGain();
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(peak, start + duration * peakAt);
  gain.gain.exponentialRampToValueAtTime(0.0001, end);
  source.connect(filter); filter.connect(gain);
  let last = gain;
  if (flutter) {
    const wobble = context.createGain();
    wobble.gain.value = 1 - flutter.depth / 2;
    const lfo = context.createOscillator();
    lfo.frequency.setValueAtTime(flutter.rate, start);
    if (flutter.to) lfo.frequency.exponentialRampToValueAtTime(flutter.to, end);
    const depth = context.createGain();
    depth.gain.value = flutter.depth / 2;
    lfo.connect(depth); depth.connect(wobble.gain);
    last.connect(wobble); last = wobble;
    lfo.start(start); lfo.stop(end + 0.05);
  }
  if (context.createStereoPanner) {
    const panner = context.createStereoPanner();
    panner.pan.setValueAtTime(pan[0], start);
    panner.pan.linearRampToValueAtTime(pan[1], end);
    last.connect(panner); last = panner;
  }
  output(last, { reverb });
  source.start(start, Math.random() * 0.4); source.stop(end + 0.05);
}

// What a control sounds like depends on what it looks like it is made of.
const materials = {
  // Default controls: a woody key with a short click on top.
  wood: {
    down(t, pan) {
      const p = jitter(0.05);
      noiseBurst(t, { frequency: 1700 * p, q: 2.4, peak: 0.21, release: 0.028, reverb: 0.15, pan });
      tone(t, { from: 210 * p, to: 92 * p, glide: 0.06, peak: 0.22, release: 0.09, lowpass: 900, pan });
    },
    up(t, pan) {
      const p = jitter(0.05);
      noiseBurst(t, { frequency: 2900 * p, q: 3, peak: 0.09, release: 0.012, pan });
      tone(t, { from: 420 * p, to: 300 * p, glide: 0.03, peak: 0.035, release: 0.03, pan });
    },
  },
  // Rounded pills (nav, toggles, chat): soft rubber down, a little pip up.
  pill: {
    down(t, pan) {
      const p = jitter(0.04);
      tone(t, { from: 560 * p, to: 240 * p, glide: 0.05, peak: 0.16, release: 0.07, lowpass: 2000, pan });
      noiseBurst(t, { frequency: 900 * p, type: 'lowpass', q: 0.7, peak: 0.07, release: 0.015, pan });
    },
    up(t, pan) {
      const p = jitter(0.04);
      tone(t, { from: 700 * p, to: 900 * p, glide: 0.03, peak: 0.055, release: 0.05, pan });
    },
  },
  // Text links: a crisp flick of paper, no body.
  paper: {
    down(t, pan) {
      const p = jitter(0.08);
      noiseBurst(t, { frequency: 5200 * p, type: 'highpass', q: 0.8, peak: 0.12, release: 0.018, pan });
      noiseBurst(t + 0.006, { frequency: 2600 * p, q: 1.5, peak: 0.06, release: 0.02, pan });
    },
    up(t, pan) {
      noiseBurst(t, { frequency: 6500 * jitter(0.08), type: 'highpass', q: 0.7, peak: 0.05, release: 0.012, pan });
    },
  },
  // Big project cards: a heavy card set down on a table, a soft suction as it lifts.
  slab: {
    down(t, pan) {
      const p = jitter(0.04);
      noiseBurst(t, { frequency: 520 * p, type: 'lowpass', q: 0.8, peak: 0.28, release: 0.06, reverb: 0.2, pan });
      tone(t, { from: 130 * p, to: 68 * p, glide: 0.08, peak: 0.3, release: 0.14, lowpass: 500, pan });
      noiseBurst(t, { frequency: 1400 * p, q: 2, peak: 0.05, release: 0.02, pan });
    },
    up(t, pan) {
      tone(t, { from: 170, to: 300, glide: 0.05, peak: 0.07, release: 0.06, lowpass: 1200, pan });
      noiseBurst(t, { frequency: 1900, q: 2, peak: 0.03, release: 0.015, pan });
    },
  },
  // The big asks (Let's talk, Send): a deep key with weight under it.
  heavy: {
    down(t, pan) {
      const p = jitter(0.04);
      noiseBurst(t, { frequency: 1350 * p, q: 2.2, peak: 0.26, release: 0.04, reverb: 0.2, pan });
      tone(t, { from: 160 * p, to: 62 * p, glide: 0.08, peak: 0.34, release: 0.16, lowpass: 700, pan });
      tone(t, { from: 70, to: 48, glide: 0.1, peak: 0.22, release: 0.18, lowpass: 200, pan });
    },
    up(t, pan) {
      const p = jitter(0.04);
      noiseBurst(t, { frequency: 2300 * p, q: 2.5, peak: 0.1, release: 0.016, pan });
      tone(t, { from: 330 * p, to: 250 * p, glide: 0.03, peak: 0.05, release: 0.04, pan });
    },
  },
};

const voices = {
  // A barely-there paper tick as the pointer reaches something interactive.
  hover(t, { pan = 0 } = {}) {
    noiseBurst(t, { frequency: 4300 * jitter(0.08), q: 1.4, peak: 0.04, release: 0.012, pan });
  },
  press(t, { material = 'wood', pan = 0 } = {}) { (materials[material] || materials.wood).down(t, pan); },
  release(t, { material = 'wood', pan = 0 } = {}) { (materials[material] || materials.wood).up(t, pan); },

  // Typing: soft keys, a deeper space bar, a duller backspace, and a tiny
  // bell on Enter. Held keys repeat more quietly.
  key(t, { kind = 'char', pan = 0, soft = false } = {}) {
    const p = jitter(0.1);
    const v = (soft ? 0.5 : 1) * (0.8 + Math.random() * 0.4);
    if (kind === 'space') {
      noiseBurst(t, { frequency: 1100 * p, q: 1.4, peak: 0.08 * v, release: 0.026, pan });
      tone(t, { from: 150 * p, to: 105 * p, glide: 0.03, peak: 0.09 * v, release: 0.05, lowpass: 700, pan });
    } else if (kind === 'delete') {
      noiseBurst(t, { frequency: 1600 * p, q: 2, peak: 0.065 * v, release: 0.016, pan });
      tone(t, { from: 240 * p, to: 170 * p, glide: 0.02, peak: 0.05 * v, release: 0.035, lowpass: 900, pan });
    } else if (kind === 'enter') {
      noiseBurst(t, { frequency: 1300 * p, q: 1.8, peak: 0.11 * v, release: 0.03, reverb: 0.15, pan });
      tone(t, { from: 170 * p, to: 95 * p, glide: 0.04, peak: 0.11 * v, release: 0.07, lowpass: 700, pan });
      tone(t + 0.05, { from: 1760, peak: 0.022, release: 0.45, reverb: 0.5, pan });
      tone(t + 0.05, { from: 2637, peak: 0.008, release: 0.3, reverb: 0.5, pan });
    } else {
      noiseBurst(t, { frequency: 2600 * p, q: 2.2, peak: 0.07 * v, release: 0.011, pan });
      tone(t, { from: 300 * p, to: 210 * p, glide: 0.015, peak: 0.032 * v, release: 0.022, lowpass: 1200, pan });
    }
  },

  // A long journey down the page: a heavy object passing, rumble and all.
  // The swell peaks at the middle, where the weighted scroll is fastest.
  travel(t, { duration = 1, intensity = 0.7, direction = 1 } = {}) {
    const d = Math.max(0.5, duration);
    air(t, { duration: d, type: 'lowpass', q: 0.6, sweep: [160, [0.5, 1100], [1, 200]], peak: 0.1 + intensity * 0.22, peakAt: 0.5, pan: [-0.5 * direction, 0.5 * direction], reverb: 0.25 });
    air(t + d * 0.08, { duration: d * 0.84, q: 0.7, sweep: [900, [0.5, 3400], [1, 700]], peak: 0.03 + intensity * 0.06, peakAt: 0.48, pan: [-0.7 * direction, 0.7 * direction], reverb: 0.4 });
    tone(t, { from: 52, to: 84, glide: d * 0.5, peak: 0.06 + intensity * 0.1, attack: d * 0.45, release: d * 0.5, lowpass: 160 });
  },
  // The red circle opening: a breath drawn in, then a soft chord as it blooms.
  // Scrolling back closes it with a falling sigh.
  wipe(t, { direction = 1 } = {}) {
    if (direction > 0) {
      air(t, { duration: 0.55, type: 'highpass', q: 0.7, sweep: [500, [1, 4200]], peak: 0.15, peakAt: 0.9, reverb: 0.35 });
      noiseBurst(t + 0.5, { frequency: 300, type: 'lowpass', q: 0.7, peak: 0.14, attack: 0.01, release: 0.22, reverb: 0.3 });
      tone(t + 0.5, { type: 'triangle', from: 196, peak: 0.06, attack: 0.012, release: 0.9, lowpass: 900, reverb: 0.6 });
      tone(t + 0.52, { type: 'triangle', from: 293.66, peak: 0.045, attack: 0.012, release: 0.8, lowpass: 1100, reverb: 0.6 });
    } else {
      air(t, { duration: 0.5, type: 'highpass', q: 0.7, sweep: [3600, [1, 420]], peak: 0.1, peakAt: 0.12, reverb: 0.35 });
    }
  },
  // Diving into the gallery: wind whistling down a tube.
  dive(t, { direction = 1 } = {}) {
    const forward = direction > 0;
    air(t, { duration: 1, q: 7, sweep: forward ? [2600, [1, 320]] : [320, [1, 2600]], peak: 0.12, peakAt: 0.35, pan: [0.3, -0.3], reverb: 0.5, flutter: { rate: 7, to: 3, depth: 0.35 } });
    tone(t, { from: forward ? 520 : 170, to: forward ? 170 : 520, glide: 0.9, peak: 0.025, attack: 0.2, release: 0.7, reverb: 0.4 });
  },
  // The knot leaving your hand: a whip crack, then a whirr that slows with the spin.
  fling(t, { speed = 0.5, direction = 1 } = {}) {
    const s = Math.min(1, Math.max(0, speed));
    air(t, { duration: 0.16, type: 'highpass', q: 0.9, sweep: [1500, [1, 6500]], peak: 0.06 + s * 0.1, peakAt: 0.5, pan: [-0.3 * direction, 0.3 * direction], reverb: 0.2 });
    air(t + 0.03, { duration: 0.35 + s * 0.6, q: 1.6, sweep: [1100, [1, 500]], peak: 0.05 + s * 0.14, peakAt: 0.15, pan: [0.4 * direction, -0.4 * direction], reverb: 0.3, flutter: { rate: 9 + s * 14, to: 3, depth: 0.8 } });
  },
  // A note sent: paper rustles, then flies off like a paper plane.
  send(t) {
    air(t, { duration: 0.14, type: 'highpass', q: 0.7, sweep: [2600, [1, 3400]], peak: 0.09, peakAt: 0.3, reverb: 0.1, flutter: { rate: 55, depth: 0.7 } });
    air(t + 0.1, { duration: 0.55, q: 1.1, sweep: [700, [0.6, 3200], [1, 2200]], peak: 0.09, peakAt: 0.5, pan: [-0.2, 0.7], reverb: 0.45 });
    tone(t + 0.12, { from: 660, to: 1480, glide: 0.4, peak: 0.022, attack: 0.15, release: 0.35, reverb: 0.5, pan: 0.3 });
  },
  // Disclosures are drawers: a slide with some grain, then the stop.
  drawerOpen(t) {
    air(t, { duration: 0.3, q: 1.3, sweep: [600, [1, 950]], peak: 0.07, peakAt: 0.55, reverb: 0.15, flutter: { rate: 38, depth: 0.6 } });
    noiseBurst(t + 0.3, { frequency: 1500, q: 2, peak: 0.08, release: 0.02, reverb: 0.2 });
    tone(t + 0.3, { from: 230, to: 170, glide: 0.04, peak: 0.09, release: 0.07, lowpass: 900 });
  },
  drawerClose(t) {
    air(t, { duration: 0.2, q: 1.3, sweep: [950, [1, 560]], peak: 0.065, peakAt: 0.5, reverb: 0.15, flutter: { rate: 44, depth: 0.6 } });
    noiseBurst(t + 0.2, { frequency: 2400, q: 2.5, peak: 0.12, release: 0.018, reverb: 0.25 });
    tone(t + 0.2, { from: 320, to: 210, glide: 0.03, peak: 0.11, release: 0.06, lowpass: 1400 });
  },

  // The knot is molten metal: a muffled clunk with a faint ring when grabbed…
  grab(t) {
    const p = jitter(0.04);
    noiseBurst(t, { frequency: 700, type: 'lowpass', q: 0.8, peak: 0.15, release: 0.04 });
    tone(t, { from: 150 * p, to: 95 * p, glide: 0.06, peak: 0.2, release: 0.1, lowpass: 500 });
    tone(t, { type: 'triangle', from: 880 * p, peak: 0.025, release: 0.5, lowpass: 3000, reverb: 0.4 });
    tone(t, { from: 1318 * p, peak: 0.012, release: 0.35, reverb: 0.4 });
  },
  // …and a heavy landing that rings a little, scaled by the impact.
  thud(t, { intensity = 1 } = {}) {
    const v = Math.min(1, Math.max(0.15, intensity));
    tone(t, { from: 120, to: 44, glide: 0.16, peak: 0.55 * v, attack: 0.002, release: 0.24, lowpass: 420, reverb: 0.2 });
    noiseBurst(t, { frequency: 520, type: 'lowpass', q: 0.7, peak: 0.3 * v, release: 0.07, reverb: 0.25 });
    noiseBurst(t + 0.004, { frequency: 2200, q: 2, peak: 0.05 * v, release: 0.02 });
    tone(t + 0.01, { type: 'triangle', from: 640 * jitter(0.03), peak: 0.03 * v, release: 0.6, lowpass: 2600, reverb: 0.45 });
  },
  // A notched dial clicking over: used when the project rail lands on a new card.
  detent(t) {
    noiseBurst(t, { frequency: 3100 * jitter(0.04), q: 6, peak: 0.1, release: 0.01 });
    tone(t, { from: 960, to: 720, glide: 0.02, peak: 0.04, release: 0.03 });
  },
  // Sent: a soft upward pair, warm rather than celebratory.
  success(t) {
    tone(t, { type: 'triangle', from: 523.25, peak: 0.1, attack: 0.004, release: 0.9, reverb: 0.5 });
    tone(t + 0.11, { from: 783.99, peak: 0.09, attack: 0.004, release: 1.1, reverb: 0.55 });
    tone(t + 0.11, { from: 1567.98, peak: 0.018, attack: 0.004, release: 0.5, reverb: 0.5 });
  },
  error(t) {
    tone(t, { type: 'triangle', from: 233, peak: 0.08, release: 0.09, lowpass: 1200 });
    tone(t + 0.12, { type: 'triangle', from: 196, peak: 0.08, release: 0.14, lowpass: 1200 });
  },
  toggleOn(t, { pan = 0 } = {}) {
    materials.pill.down(t, pan);
    tone(t + 0.03, { from: 440, to: 660, glide: 0.08, peak: 0.06, release: 0.18, reverb: 0.35, pan });
  },

  // Page curtain: heavy fabric falling (flapping faster as it gains speed),
  // a soft floor-length landing, and a long heave back up.
  curtainDrop(t) {
    air(t, { duration: 0.44, type: 'lowpass', q: 0.7, sweep: [240, [1, 1700]], peak: 0.17, peakAt: 0.95, reverb: 0.3, flutter: { rate: 14, to: 28, depth: 0.45 } });
  },
  curtainLand(t) {
    noiseBurst(t, { frequency: 260, type: 'lowpass', q: 0.7, peak: 0.34, attack: 0.004, release: 0.2, reverb: 0.3 });
    tone(t, { from: 92, to: 48, glide: 0.14, peak: 0.32, release: 0.22, lowpass: 240 });
    noiseBurst(t + 0.01, { frequency: 3200, type: 'highpass', q: 0.7, peak: 0.04, release: 0.09 });
  },
  curtainLift(t) {
    air(t, { duration: 0.8, q: 0.8, sweep: [300, [0.6, 1900], [1, 900]], peak: 0.12, peakAt: 0.5, reverb: 0.35, flutter: { rate: 12, to: 6, depth: 0.3 } });
  },
};

// Minimum gap per voice, so a sweep across many targets never machine-guns.
const spacing = {
  hover: 70, press: 40, release: 40, key: 22, detent: 55, thud: 60, grab: 80,
  travel: 200, wipe: 300, dive: 300, fling: 150, send: 300, drawerOpen: 120, drawerClose: 120,
  curtainDrop: 400, curtainLand: 400, curtainLift: 400,
};

// On phones, the same moments are felt as well as heard (where the browser
// allows vibration: Android, not iOS Safari). Typing is left to the keyboard.
const coarse = typeof window !== 'undefined' ? window.matchMedia?.('(pointer: coarse)') : null;
const touchPatterns = { grab: 12, detent: 5, drawerOpen: 6, drawerClose: 9, send: [8, 40, 8], success: [12, 70, 18], error: [28, 60, 28], toggleOn: 10, curtainLand: 18 };
function haptic(name, options) {
  if (!coarse?.matches || typeof navigator === 'undefined' || !navigator.vibrate) return;
  let pattern = touchPatterns[name];
  if (name === 'press') pattern = options.material === 'heavy' ? 16 : options.material === 'slab' ? 12 : 7;
  if (name === 'thud') pattern = Math.round(10 + 22 * Math.min(1, options.intensity ?? 1));
  if (!pattern) return;
  try { navigator.vibrate(pattern); } catch { /* Vibration is optional. */ }
}

// Scroll wind: one quiet, filtered noise bed whose level and brightness follow
// scroll speed. Gusts rise quickly and die away slowly; it is torn down after
// a few idle seconds so nothing runs while the page is still.
let wind = null;
let windHoldUntil = 0;
let windSleep = 0;
function windBed() {
  const { context } = engine;
  const source = context.createBufferSource();
  source.buffer = engine.noise; source.loop = true;
  const filter = context.createBiquadFilter();
  filter.type = 'bandpass'; filter.Q.value = 0.6; filter.frequency.value = 300;
  const gain = context.createGain();
  gain.gain.value = 0;
  source.connect(filter); filter.connect(gain);
  output(gain, { reverb: 0.25 });
  source.start(0, Math.random() * 0.5);
  return { source, filter, gain, level: 0 };
}
function stopWind() {
  if (!wind) return;
  try { wind.source.stop(); wind.gain.disconnect(); } catch { /* Already stopped. */ }
  wind = null;
}

export const sound = {
  get enabled() { return enabled; },
  get running() { return engine?.context.state === 'running'; },
  subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); },
  onPlay(listener) { playListeners.add(listener); return () => playListeners.delete(listener); },
  setEnabled(next) {
    enabled = next;
    try { localStorage.setItem(STORAGE, next ? 'on' : 'off'); } catch { /* Optional preference storage. */ }
    if (engine) engine.master.gain.setTargetAtTime(next ? 0.9 : 0, engine.context.currentTime, next ? 0.015 : 0.06);
    listeners.forEach((listener) => listener(next));
  },
  // Call from inside a pointerdown, keydown, or click handler.
  unlock() {
    if (!enabled) return;
    armed = true;
    try {
      if (!engine || engine.context.state === 'closed') engine = build();
      if (engine?.context.state === 'suspended') engine.context.resume().catch(() => {});
    } catch { engine = null; }
  },
  play(name, options = {}) {
    // A context resumed inside this gesture is still 'suspended' for a moment;
    // anything scheduled now simply plays as soon as it starts running.
    const state = engine?.context.state;
    const audible = state === 'running' || (armed && state === 'suspended');
    const voice = voices[name];
    if (!enabled || !voice || !(audible || armed)) return;
    const now = performance.now();
    if (now - (lastPlayed.get(name) || 0) < (spacing[name] ?? 30)) return;
    lastPlayed.set(name, now);
    if (audible) {
      try { voice(engine.context.currentTime + 0.002, options); } catch { /* Audio is a nicety; never break an interaction. */ }
    }
    if (armed) haptic(name, options);
    playListeners.forEach((listener) => listener(name, options));
  },
  /** Feed the current scroll velocity (px/s); the wind bed follows it. */
  wind(velocity) {
    if (!enabled || engine?.context.state !== 'running') { stopWind(); return; }
    const { currentTime } = engine.context;
    const speed = performance.now() < windHoldUntil ? 0 : Math.min(6000, Math.abs(velocity));
    const level = speed < 250 ? 0 : Math.pow(Math.min(1, (speed - 250) / 4000), 1.3) * 0.13;
    if (!wind) {
      if (!level) return;
      wind = windBed();
    }
    wind.gain.gain.setTargetAtTime(level, currentTime, level > wind.level ? 0.07 : 0.28);
    wind.filter.frequency.setTargetAtTime(260 + speed * 0.24, currentTime, 0.12);
    wind.level = level;
    clearTimeout(windSleep);
    if (!level) windSleep = setTimeout(stopWind, 3000);
  },
  /** Keep the wind quiet while another sound already carries a big move. */
  holdWind(ms) { windHoldUntil = performance.now() + ms; },
};

/** Where an element sits left-to-right, as a stereo position. */
export function panFor(element, spread = 0.55) {
  if (!element?.getBoundingClientRect) return 0;
  const box = element.getBoundingClientRect();
  const centre = (box.left + box.width / 2) / window.innerWidth;
  return Math.max(-1, Math.min(1, centre * 2 - 1)) * spread;
}
