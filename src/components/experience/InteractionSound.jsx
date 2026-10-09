import { useEffect, useRef, useSyncExternalStore } from 'react';
import { panFor, sound } from './sfx';
import { installPress } from './motion';

const INTERACTIVE = 'a, button:not(:disabled), summary';
const TYPEABLE = /^(text|email|search|url|tel)$/;

// Controls sound like what they look like they are made of.
const materialFor = (element) => {
  if (element.matches('.exp-contact-orb, .exp-send')) return 'heavy';
  if (element.matches('.exp-project-visual, .exp-lab-art')) return 'slab';
  if (element.matches('.exp-nav a, .exp-wordmark, .exp-scroll-cue, .waaazek-wrapper, .waaazek-pill, .waaazek-icon-btn, .waaazek-send-btn, .waaazek-scroll-btn')) return 'pill';
  if (element.matches('.exp-text-link, .exp-contact-email, .exp-all-work, .exp-footer-bottom a, .exp-project-info h3 a, .exp-section-kicker a, .exp-form-status a')) return 'paper';
  return 'wood';
};

const keyKind = (event) => {
  if (event.key === ' ') return 'space';
  if (event.key === 'Backspace' || event.key === 'Delete') return 'delete';
  if (event.key === 'Enter') return 'enter';
  return event.key.length === 1 ? 'char' : null;
};

export default function InteractionSound() {
  const enabled = useSyncExternalStore(sound.subscribe, () => sound.enabled, () => true);
  const bars = useRef(null);

  useEffect(() => installPress(), []);

  useEffect(() => {
    let pressed = null;
    let previous = null;
    const interactive = (event) => {
      const element = event.target.closest?.(INTERACTIVE);
      return element && !element.matches('.exp-sound-toggle') ? element : null;
    };
    const voice = (element) => ({ material: materialFor(element), pan: panFor(element) });
    const down = (event) => {
      sound.unlock();
      const element = interactive(event);
      if (!element || event.button !== 0) return;
      pressed = voice(element);
      sound.play('press', pressed);
    };
    const up = () => {
      sound.unlock();
      if (!pressed) return;
      sound.play('release', pressed);
      pressed = null;
    };
    const cancel = () => { pressed = null; };
    // Enter / Space activations arrive as clicks with no pointer behind them.
    const click = (event) => {
      if (event.detail !== 0) return;
      sound.unlock();
      const element = interactive(event);
      if (!element) return;
      const options = voice(element);
      sound.play('press', options);
      setTimeout(() => sound.play('release', options), 60);
    };
    // Typing in any text field gets keys; held keys repeat more quietly.
    const key = (event) => {
      sound.unlock();
      const field = event.target;
      const typeable = field instanceof HTMLTextAreaElement || (field instanceof HTMLInputElement && TYPEABLE.test(field.type));
      if (!typeable || event.isComposing || event.ctrlKey || event.metaKey || event.altKey) return;
      const kind = keyKind(event);
      if (!kind || (kind === 'delete' && !field.value)) return;
      sound.play('key', { kind, pan: panFor(field, 0.35), soft: event.repeat });
    };
    const over = (event) => {
      if (event.pointerType !== 'mouse') return;
      const element = interactive(event);
      if (element && element !== previous) sound.play('hover', { pan: panFor(element) });
      previous = element;
    };
    const toggle = (event) => {
      if (event.target instanceof HTMLDetailsElement) sound.play(event.target.open ? 'drawerOpen' : 'drawerClose');
    };
    document.addEventListener('pointerdown', down, { passive: true });
    window.addEventListener('pointerup', up, { passive: true });
    window.addEventListener('pointercancel', cancel, { passive: true });
    document.addEventListener('click', click);
    document.addEventListener('keydown', key);
    document.addEventListener('pointerover', over, { passive: true });
    document.addEventListener('toggle', toggle, true);
    return () => {
      document.removeEventListener('pointerdown', down);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', cancel);
      document.removeEventListener('click', click);
      document.removeEventListener('keydown', key);
      document.removeEventListener('pointerover', over);
      document.removeEventListener('toggle', toggle, true);
    };
  }, []);

  // Scroll wind: sample scroll speed only while the page is moving.
  useEffect(() => {
    let frame = 0, lastY = window.scrollY, lastTime = 0, still = 0;
    const tick = (time) => {
      const dt = Math.max(0.008, (time - lastTime) / 1000 || 0.016);
      lastTime = time;
      const y = window.scrollY;
      const velocity = (y - lastY) / dt;
      lastY = y;
      sound.wind(velocity);
      still = Math.abs(velocity) < 20 ? still + 1 : 0;
      frame = still > 45 ? 0 : requestAnimationFrame(tick);
    };
    const onScroll = () => {
      if (frame) return;
      lastTime = performance.now();
      still = 0;
      frame = requestAnimationFrame(tick);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => { window.removeEventListener('scroll', onScroll); cancelAnimationFrame(frame); sound.wind(0); };
  }, []);

  // The meter in the toggle hops with every sound, so what you hear has a source.
  useEffect(() => sound.onPlay((name) => {
    if (name === 'hover' || !bars.current || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    [...bars.current.children].forEach((bar, index) => {
      bar.animate({ scale: ['1 1', `1 ${1.35 + ((index * 7) % 5) / 6}`, '1 1'] }, { duration: 260 + index * 40, easing: 'cubic-bezier(0.2, 0.8, 0.3, 1)' });
    });
  }), []);

  const flip = (event) => {
    const pan = panFor(event.currentTarget);
    if (enabled) {
      sound.play('press', { material: 'pill', pan });
      sound.setEnabled(false);
    } else {
      sound.setEnabled(true);
      sound.unlock();
      sound.play('toggleOn', { pan });
    }
  };

  return <button type="button" className="exp-sound-toggle" aria-label={enabled ? 'Mute interaction sounds' : 'Enable interaction sounds'} aria-pressed={enabled} onClick={flip}>
    <span ref={bars} className="exp-sound-bars" aria-hidden="true"><i /><i /><i /><i /></span><span>Sound {enabled ? 'on' : 'off'}</span>
  </button>;
}
