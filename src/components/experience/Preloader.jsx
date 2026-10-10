import { useEffect } from 'react';
import { pageCurtain } from './motion';

// The first-load curtain itself lives in index.html (#exp-boot), so it is on
// screen and moving before any of this code has loaded. This component only
// decides when: it names the real work as it completes, tells the counter to
// finish, and raises the curtain as the hero's entrance begins.
const STAGES = {
  fonts: 'Setting the type…',
  portrait: 'Hanging the portrait…',
  knot: 'Warming the metal…',
  work: 'Laying out the work…',
};
const MINIMUM = 1300; // from first paint: long enough to read as intended, never long enough to annoy
const HOLD = 260; // a beat on 100 before the lift
let releaseTimer = 0; // survives React's development double-mount without releasing early

const settle = (promise, ms) => Promise.race([promise, new Promise((resolve) => setTimeout(resolve, ms))]).catch(() => {});

// Loaded and decoded, so the first paint of the image is not a hitch mid-lift.
function imageReady(image) {
  if (!image) return Promise.resolve();
  const loaded = image.complete ? Promise.resolve() : new Promise((resolve) => {
    image.addEventListener('load', resolve, { once: true });
    image.addEventListener('error', resolve, { once: true });
  });
  return loaded.then(() => image.decode?.()).catch(() => {});
}

function knotReady() {
  const hero = document.querySelector('.exp-hero');
  if (!hero || hero.dataset.knot) return Promise.resolve();
  return new Promise((resolve) => window.addEventListener('exp:knot-ready', resolve, { once: true }));
}

const uncover = () => { pageCurtain.covered = false; };
const release = () => {
  if (!pageCurtain.preload) return;
  window.__lenis?.start();
  pageCurtain.revealAt = performance.now();
  pageCurtain.release();
};

export default function Preloader() {
  useEffect(() => {
    clearTimeout(releaseTimer);
    const boot = window.__boot;
    if (!boot || !document.contains(boot.el)) { uncover(); release(); return undefined; }
    const home = window.location.pathname === '/';
    const tasks = home
      ? [['fonts', document.fonts.ready], ['portrait', imageReady(document.querySelector('.exp-hero-portrait img'))], ['knot', knotReady()]]
      : [['fonts', document.fonts.ready], ['work', imageReady(document.querySelector('.exp-project-visual img'))]];
    const done = new Set();
    const timers = [];
    let alive = true, finished = false;

    const finish = () => {
      if (finished || !alive) return;
      finished = true;
      boot.stage('Ready when you are.', 350);
      boot.finish()
        .then(() => new Promise((resolve) => timers.push(setTimeout(resolve, HOLD))))
        .then(() => alive && boot.lift(release))
        .then(uncover);
    };

    tasks.forEach(([task, promise]) => settle(promise, 5000).then(() => {
      if (!alive) return;
      done.add(task);
      const pending = tasks.find(([name]) => !done.has(name));
      if (pending) boot.stage(STAGES[pending[0]]);
      else timers.push(setTimeout(finish, Math.max(0, MINIMUM - (performance.now() - boot.started))));
    }));

    // Hold the page still underneath until the curtain lifts (the wheel, touch
    // and key lock itself lives in index.html, so it is there from first paint).
    const stopScroll = requestAnimationFrame(() => { if (!finished) window.__lenis?.stop(); });

    return () => {
      alive = false;
      cancelAnimationFrame(stopScroll);
      timers.forEach(clearTimeout);
      // A real unmount mid-load (not React's development re-run) clears the stage.
      releaseTimer = setTimeout(() => { boot.remove(); uncover(); release(); }, 60);
    };
  }, []);

  return null;
}
