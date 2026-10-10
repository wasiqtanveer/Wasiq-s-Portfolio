import { useEffect, useRef } from 'react';

const ROOT = '/portrait-sprites/';
const DIRECTIONS = ['e', 'se', 's', 'sw', 'w', 'nw', 'n', 'ne'];
const SPRITES = [
  'neutral',
  ...DIRECTIONS.map((direction) => `eyes-${direction}`),
  'expression-blink',
  'expression-smile',
  'expression-wink',
  'expression-curious',
  'expression-surprised',
  ...DIRECTIONS.map((direction) => `pose-${direction}`),
];
const EXPRESSIONS = ['expression-wink', 'expression-curious', 'expression-surprised', 'expression-smile'];
const urlFor = (name) => `${ROOT}${name}.webp`;

export default function CursorPortrait() {
  const buttonRef = useRef(null);
  const imageRef = useRef(null);
  const portraitRef = useRef({ show: () => {}, react: () => {} });

  useEffect(() => {
    const button = buttonRef.current;
    const image = imageRef.current;
    const hero = button.closest('.exp-hero');
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (!hero || !finePointer.matches || reduceMotion.matches) return undefined;

    const ready = new Set(['neutral']);
    const preloads = [];
    let active = true;
    let current = 'neutral';
    let heldUntil = 0;
    let lastMove = performance.now();
    let lastChange = 0;
    let frame = 0;
    let nextPoint = null;
    let releaseTimer = 0;
    let expressionIndex = 0;

    // Neutral loads first via the <img>; the rest follow one at a time once the browser is idle.
    const queue = SPRITES.slice(1);
    let idleHandle = 0;
    const loadNext = () => {
      if (!active || !queue.length) return;
      const name = queue.shift();
      const preload = new Image();
      preload.decoding = 'async';
      const done = () => {
        if (active) ready.add(name);
        scheduleNext();
      };
      preload.onload = done;
      preload.onerror = scheduleNext;
      preload.src = urlFor(name);
      preloads.push(preload);
    };
    const scheduleNext = () => {
      if (!active) return;
      idleHandle = 'requestIdleCallback' in window
        ? window.requestIdleCallback(loadNext, { timeout: 1500 })
        : setTimeout(loadNext, 120);
    };
    const startQueue = () => scheduleNext();
    if (image.complete && image.naturalWidth) startQueue();
    else image.addEventListener('load', startQueue, { once: true });

    const show = (name) => {
      if (!ready.has(name) || name === current) return;
      current = name;
      image.src = urlFor(name);
    };
    const react = (name, duration = 680) => {
      if (!ready.has(name)) return;
      heldUntil = performance.now() + duration;
      show(name);
      clearTimeout(releaseTimer);
      releaseTimer = setTimeout(() => {
        heldUntil = 0;
        show('neutral');
      }, duration);
    };
    portraitRef.current = { show, react };

    const update = () => {
      frame = 0;
      if (!nextPoint || performance.now() < heldUntil) return;
      if (performance.now() - lastChange < 65) return;
      const rect = button.getBoundingClientRect();
      const dx = nextPoint.x - (rect.left + rect.width / 2);
      const dy = nextPoint.y - (rect.top + rect.height / 2);
      const distance = Math.hypot(dx, dy);
      if (distance < rect.width * 0.16) {
        show('neutral');
      } else {
        const angle = Math.atan2(dy, dx);
        const direction = DIRECTIONS[(Math.round(angle / (Math.PI / 4)) + 8) % 8];
        const family = distance > Math.max(rect.width * 1.15, 230) ? 'pose' : 'eyes';
        show(`${family}-${direction}`);
      }
      lastChange = performance.now();
    };
    const move = (event) => {
      nextPoint = { x: event.clientX, y: event.clientY };
      lastMove = performance.now();
      if (!frame) frame = requestAnimationFrame(update);
    };
    const leave = () => { nextPoint = null; show('neutral'); };
    const blink = setInterval(() => {
      if (performance.now() - lastMove > 3200 && performance.now() >= heldUntil) react('expression-blink', 140);
    }, 5800);
    const click = () => {
      react(EXPRESSIONS[expressionIndex % EXPRESSIONS.length], 850);
      expressionIndex += 1;
    };
    const enter = () => react('expression-smile', 650);
    const onPreferenceChange = () => { if (!finePointer.matches || reduceMotion.matches) show('neutral'); };

    hero.addEventListener('pointermove', move, { passive: true });
    hero.addEventListener('pointerleave', leave);
    button.addEventListener('pointerenter', enter);
    button.addEventListener('click', click);
    finePointer.addEventListener('change', onPreferenceChange);
    reduceMotion.addEventListener('change', onPreferenceChange);
    return () => {
      active = false;
      portraitRef.current = { show: () => {}, react: () => {} };
      hero.removeEventListener('pointermove', move);
      hero.removeEventListener('pointerleave', leave);
      button.removeEventListener('pointerenter', enter);
      button.removeEventListener('click', click);
      finePointer.removeEventListener('change', onPreferenceChange);
      reduceMotion.removeEventListener('change', onPreferenceChange);
      cancelAnimationFrame(frame);
      clearInterval(blink);
      clearTimeout(releaseTimer);
      image.removeEventListener('load', startQueue);
      if ('cancelIdleCallback' in window) window.cancelIdleCallback(idleHandle);
      clearTimeout(idleHandle);
      preloads.forEach((preload) => { preload.onload = null; preload.onerror = null; });
    };
  }, []);

  return <button ref={buttonRef} type="button" className="exp-hero-portrait-mat" aria-label="Change portrait expression">
    <img ref={imageRef} src={urlFor('neutral')} alt="Wasiq Tanveer" width="1024" height="1536" fetchPriority="high" />
  </button>;
}
