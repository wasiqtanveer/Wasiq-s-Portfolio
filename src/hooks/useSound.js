import { useSyncExternalStore, useCallback } from 'react';

/**
 * One switch for every sound on the site.
 *
 * Three independent sources used to fire with no way to stop them: a click tone
 * on every document mousedown, a tick on every keystroke in the contact form,
 * and a tick on every archive row hover — the last of which turned a mouse
 * crossing the nine-row list into machine-gun clicking. Audio the visitor did
 * not request, cannot predict, and cannot mute is a close-the-tab event in any
 * shared or quiet room.
 *
 * So it is OFF until asked for, and the choice persists.
 */

const STORAGE_KEY = 'wt:sound';

const listeners = new Set();

const read = () => {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'on';
  } catch {
    // Private mode / storage disabled — stay silent rather than throwing.
    return false;
  }
};

let enabled = typeof window === 'undefined' ? false : read();

export const isSoundEnabled = () => enabled;

export const setSoundEnabled = (next) => {
  enabled = next;
  try {
    localStorage.setItem(STORAGE_KEY, next ? 'on' : 'off');
  } catch {
    // Preference just won't survive a reload; the toggle still works this session.
  }
  listeners.forEach(fn => fn());
};

const subscribe = (fn) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};

/** `[enabled, toggle]` — re-renders any component showing the toggle state. */
export default function useSound() {
  const value = useSyncExternalStore(subscribe, isSoundEnabled, () => false);
  const toggle = useCallback(() => setSoundEnabled(!isSoundEnabled()), []);
  return [value, toggle];
}

// ── Shared tone generator ──────────────────────────────────────────────────
// One AudioContext for the whole site rather than one per component. Created
// lazily on first real playback so no context is opened for a visitor who never
// turns sound on.

let ctx = null;

/**
 * Short synthesized tick. No-ops entirely when sound is off, so call sites can
 * stay simple and never need to check first.
 */
export function playTick({ from = 600, to = 100, gain = 0.03, duration = 0.03 } = {}) {
  if (!enabled) return;
  try {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();

    const osc = ctx.createOscillator();
    const amp = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(from, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(to, ctx.currentTime + duration);

    amp.gain.setValueAtTime(gain, ctx.currentTime);
    amp.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    osc.connect(amp);
    amp.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch {
    // Autoplay policy blocked it — silence is the correct fallback.
  }
}
