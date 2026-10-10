import { useEffect, useRef } from 'react';
import gsap from 'gsap';

const ROOT = '/portrait-sprites/';
const DIRECTIONS = ['e', 'se', 's', 'sw', 'w', 'nw', 'n', 'ne'];
const SPRITES = [
  'neutral',
  'expression-smile',
  'expression-blink',
  ...DIRECTIONS.map((direction) => `eyes-${direction}`),
  'expression-wink',
  'expression-curious',
  'expression-surprised',
  ...DIRECTIONS.map((direction) => `pose-${direction}`),
];
const EXPRESSIONS = ['expression-wink', 'expression-curious', 'expression-surprised', 'expression-smile'];
const urlFor = (name) => `${ROOT}${name}.webp`;

// The outline copy of the title (over his cut-out) is masked by his silhouette,
// so only the letters that actually cover him show an outline. The mask is one
// static image (the union of every sprite), so it never flickers on a sprite swap.
const SILHOUETTE = `${ROOT}silhouette.webp`;
function useOutlineMask(buttonRef) {
  useEffect(() => {
    const button = buttonRef.current;
    const hero = button.closest('.exp-hero');
    const ghost = hero && hero.querySelector('.exp-hero-title-ghost');
    if (!ghost) return undefined;
    ghost.style.setProperty('--ghost-mask', `url("${SILHOUETTE}")`);
    let last = '';
    const update = () => {
      const box = button.getBoundingClientRect();
      const origin = ghost.getBoundingClientRect();
      if (!box.width || !origin.width) return;
      // The sprite is object-fit: cover (1024x1536) at center 24% inside a square.
      const width = box.width;
      const height = width * 1.5;
      const x = box.left - origin.left;
      const y = box.top - origin.top - (height - width) * 0.24;
      const key = `${x.toFixed(1)}|${y.toFixed(1)}|${width.toFixed(1)}`;
      if (key === last) return;
      last = key;
      ghost.style.setProperty('--ghost-mask-size', `${width}px ${height}px`);
      ghost.style.setProperty('--ghost-mask-pos', `${x}px ${y}px`);
    };
    gsap.ticker.add(update);
    return () => { gsap.ticker.remove(update); ghost.style.removeProperty('--ghost-mask'); };
  }, [buttonRef]);
}

export default function CursorPortrait() {
  const buttonRef = useRef(null);
  const imageRef = useRef(null);
  const portraitRef = useRef({ show: () => {}, react: () => {} });
  useOutlineMask(buttonRef);

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
      // Only mark a sprite ready once it is decoded, so swapping to it is instant.
      const done = () => preload.decode().catch(() => {}).then(() => {
        if (active) ready.add(name);
        scheduleNext();
      });
      preload.onload = done;
      preload.onerror = scheduleNext;
      preload.src = urlFor(name);
      preloads.push(preload);
    };
    const scheduleNext = () => {
      if (!active) return;
      idleHandle = 'requestIdleCallback' in window
        ? window.requestIdleCallback(loadNext, { timeout: 400 })
        : setTimeout(loadNext, 120);
    };
    // Two lanes, so the reactions and eye directions are ready within a moment or two.
    const startQueue = () => { scheduleNext(); scheduleNext(); };
    if (image.complete && image.naturalWidth) startQueue();
    else image.addEventListener('load', startQueue, { once: true });

    // Only the silhouette is interactive: the square card around it lets pointer events through.
    const probe = document.createElement('canvas');
    probe.width = 96;
    probe.height = 144;
    const probeContext = probe.getContext('2d', { willReadFrequently: true });
    let silhouette = false;
    const mask = new Image();
    mask.onload = () => {
      if (!active) return;
      probeContext.drawImage(mask, 0, 0, probe.width, probe.height);
      silhouette = true;
    };
    mask.src = SILHOUETTE;
    const overPerson = (event) => {
      if (!silhouette) return false;
      const box = button.getBoundingClientRect();
      const u = (event.clientX - box.left) / box.width;
      const v = (event.clientY - box.top) / box.height;
      if (u < 0 || u > 1 || v < 0 || v > 1) return false;
      // Same mapping as object-fit: cover at center 24% on a 1024x1536 sprite.
      const x = Math.min(probe.width - 1, Math.floor(u * probe.width));
      const y = Math.min(probe.height - 1, Math.floor(((v + 0.12) / 1.5) * probe.height));
      return probeContext.getImageData(x, y, 1, 1).data[3] > 40;
    };
    const aim = (event) => {
      const hit = overPerson(event);
      button.style.pointerEvents = hit ? 'auto' : 'none';
    };
    button.style.pointerEvents = 'none';

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
    // Tracked on the window, not the hero: the fixed header and chat button sit on top
    // of the hero and would otherwise swallow the pointer and freeze his gaze.
    const move = (event) => {
      const area = hero.getBoundingClientRect();
      if (event.clientY < area.top || event.clientY > area.bottom) {
        if (nextPoint) leave();
        return;
      }
      aim(event);
      nextPoint = { x: event.clientX, y: event.clientY };
      lastMove = performance.now();
      if (!frame) frame = requestAnimationFrame(update);
    };
    const leave = () => { nextPoint = null; show('neutral'); };
    const blink = setInterval(() => {
      if (performance.now() - lastMove > 3200 && performance.now() >= heldUntil) react('expression-blink', 140);
    }, 5800);
    const click = () => {
      // The whole card (arch + cut-out) hops and lands with weight.
      gsap.timeline({ overwrite: 'auto' })
        .to(hero.querySelectorAll('.exp-hero-portrait-reveal'), { y: -22, scaleY: 1.03, scaleX: 0.99, duration: 0.16, ease: 'power2.out', transformOrigin: '50% 100%' })
        .to(hero.querySelectorAll('.exp-hero-portrait-reveal'), { y: 0, scaleY: 1, scaleX: 1, duration: 1.1, ease: 'elastic.out(1, 0.3)' });
      react(EXPRESSIONS[expressionIndex % EXPRESSIONS.length], 850);
      expressionIndex += 1;
    };
    const enter = () => react('expression-smile', 650);
    const onPreferenceChange = () => { if (!finePointer.matches || reduceMotion.matches) show('neutral'); };

    window.addEventListener('pointermove', move, { passive: true });
    document.documentElement.addEventListener('pointerleave', leave);
    button.addEventListener('pointerenter', enter);
    button.addEventListener('click', click);
    finePointer.addEventListener('change', onPreferenceChange);
    reduceMotion.addEventListener('change', onPreferenceChange);
    return () => {
      active = false;
      portraitRef.current = { show: () => {}, react: () => {} };
      window.removeEventListener('pointermove', move);
      document.documentElement.removeEventListener('pointerleave', leave);
      mask.onload = null;
      button.style.pointerEvents = '';
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
