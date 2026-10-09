import { sound } from './sfx';

// One damped spring, shared by every hand-driven motion on the page. Mass is
// what makes things feel heavy: more of it means slower to start, slower to
// stop, and a little overshoot as the momentum runs out.
export function createSpring(initial, { stiffness = 120, damping = 12, mass = 1, precision = 0.01 } = {}, render) {
  const value = { ...initial };
  const target = { ...initial };
  const velocity = Object.fromEntries(Object.keys(initial).map((key) => [key, 0]));
  let frame = 0, previous = 0;
  const tick = (time) => {
    const dt = Math.min((time - previous) / 1000 || 0.016, 0.032);
    previous = time;
    let moving = false;
    for (const key in value) {
      const force = (target[key] - value[key]) * stiffness - velocity[key] * damping;
      velocity[key] += (force / mass) * dt;
      value[key] += velocity[key] * dt;
      if (Math.abs(target[key] - value[key]) + Math.abs(velocity[key]) > precision) moving = true;
      else { value[key] = target[key]; velocity[key] = 0; }
    }
    render(value);
    frame = moving ? requestAnimationFrame(tick) : 0;
  };
  const wake = () => { if (!frame) { previous = performance.now(); frame = requestAnimationFrame(tick); } };
  return {
    value, target, velocity,
    set(next) {
      let changed = false;
      for (const key in next) if (target[key] !== next[key]) { target[key] = next[key]; changed = true; }
      if (changed) wake();
    },
    kick(impulse) { for (const key in impulse) velocity[key] += impulse[key]; wake(); },
    stop() { cancelAnimationFrame(frame); frame = 0; },
  };
}

// Slow to get going, committed in the middle, braking hard at the end: the
// curve of moving something with real mass.
export const heavyEase = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/** Travel to a section (or a y position) with weight, and let the air move with it. */
export function travelTo(target) {
  const lenis = window.__lenis;
  const y = typeof target === 'number' ? target : target.getBoundingClientRect().top + window.scrollY;
  const distance = Math.abs(y - window.scrollY);
  if (distance < 4) return;
  const screens = distance / window.innerHeight;
  const duration = Math.min(1.7, 0.75 + screens * 0.11);
  sound.holdWind(duration * 1000 + 250);
  sound.play('travel', { duration: duration * 0.95, intensity: Math.min(1, 0.35 + screens / 8), direction: y > window.scrollY ? 1 : -1 });
  if (lenis) lenis.scrollTo(target, { duration, easing: heavyEase, force: true });
  else if (typeof target === 'number') window.scrollTo(0, target);
  else target.scrollIntoView();
}

// A damped spring (damping ratio 0.5) sampled for WAAPI and CSS: one soft
// overshoot, then rest. The same curve lives in experience.css as --spring.
export const SPRING = 'linear(0, 0.046, 0.162, 0.319, 0.492, 0.662, 0.815, 0.942, 1.039, 1.106, 1.146, 1.162, 1.16, 1.144, 1.12, 1.092, 1.064, 1.038, 1.016, 0.998, 0.986, 0.978, 0.974, 0.974, 0.975, 0.979, 0.983, 0.988, 0.992, 0.996, 0.999, 1.002, 1.003, 1.004, 1.004, 1.004, 1.004, 1.003, 1.002, 1.001, 1)';

// How far each kind of control gives under a finger. Big surfaces barely
// move; small, heavy-looking controls sink further.
const pressDepth = (element) => {
  if (element.matches('.exp-contact-orb')) return 0.9;
  if (element.matches('.exp-project-visual, .exp-lab-art')) return 0.976;
  if (element.matches('.exp-send, .exp-all-work, .exp-text-link, .exp-contact-email, .exp-project-info h3 a')) return 0.96;
  return 0.93;
};

/**
 * Every link and button compresses while held and springs back on release.
 * Uses the individual `scale` property, so it composes with any transform a
 * magnetic or scroll animation already owns on the same element.
 */
export function installPress() {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  const animations = new WeakMap();
  let held = null;
  const pressable = (event) => {
    const element = event.target.closest?.('a, button:not(:disabled), summary');
    if (!element) return null;
    return getComputedStyle(element).display === 'inline' ? null : element;
  };
  const animate = (element, to, options) => {
    const current = getComputedStyle(element).scale;
    const from = current === 'none' ? 1 : parseFloat(current) || 1;
    animations.get(element)?.cancel();
    animations.set(element, element.animate({ scale: [String(from), String(to)] }, options));
  };
  const depth = (element) => {
    const full = pressDepth(element);
    return reduce.matches ? 1 - (1 - full) / 2 : full;
  };
  const sink = (element) => animate(element, depth(element), { duration: 110, easing: 'cubic-bezier(0.3, 0, 0.2, 1)', fill: 'forwards' });
  const spring = (element) => animate(element, 1, reduce.matches ? { duration: 160, easing: 'ease-out' } : { duration: 680, easing: SPRING });
  const down = (event) => {
    if (event.button !== 0) return;
    const element = pressable(event);
    if (!element) return;
    held = element;
    sink(element);
  };
  const up = () => {
    if (!held) return;
    spring(held);
    held = null;
  };
  // Keyboard activation (Enter / Space) gets the same tap, compressed in time.
  const click = (event) => {
    if (event.detail !== 0) return;
    const element = pressable(event);
    if (!element) return;
    animate(element, depth(element), { duration: 70, easing: 'ease-out', fill: 'forwards' });
    setTimeout(() => spring(element), 70);
  };
  document.addEventListener('pointerdown', down, { passive: true });
  window.addEventListener('pointerup', up, { passive: true });
  window.addEventListener('pointercancel', up, { passive: true });
  window.addEventListener('dragstart', up);
  document.addEventListener('click', click);
  return () => {
    document.removeEventListener('pointerdown', down);
    window.removeEventListener('pointerup', up);
    window.removeEventListener('pointercancel', up);
    window.removeEventListener('dragstart', up);
    document.removeEventListener('click', click);
  };
}

// Shared between the hero's layout/scroll code (main bundle) and the lazily
// loaded WebGL sculpture. `slot` is the knot's resting place in hero pixels;
// `journey` is the scroll progress of the hero transition, 0 to 1; `introAt`
// marks when the entrance began, so the knot can land after the type.
export const heroRig = { slot: null, version: 0, journey: 0, introAt: undefined };

// When a page curtain will lift (performance.now() ms), so entrances wait for
// it. On first load the hero entrance also waits for the preloader to release.
let releaseIntro = () => {};
export const pageCurtain = {
  revealAt: 0,
  covered: true, // the preloader hides the page; the knot need not draw under it
  preload: typeof window === 'undefined' ? null : new Promise((resolve) => { releaseIntro = resolve; }),
  release() { this.preload = null; releaseIntro(); },
};
