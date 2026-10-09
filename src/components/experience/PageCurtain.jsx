import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { sound } from './sfx';
import { pageCurtain } from './motion';

// Moving between the homepage and the project index is a physical event: a
// heavy emerald curtain drops, lands with a bounce, names where you are
// going, and heaves back up on the new page. Browser back/forward stays instant.
const DESTINATIONS = {
  '/': ['Back to', 'the good stuff.'],
  '/work': ['The work.', 'And the play.'],
};

export default function PageCurtain() {
  const curtain = useRef(null);
  const navigate = useNavigate();
  // The router hands out a new navigate function on every route change; keep
  // the latest in a ref so the transition is never torn down mid-flight.
  const navigateRef = useRef(navigate);
  useEffect(() => { navigateRef.current = navigate; }, [navigate]);

  useEffect(() => {
    const element = curtain.current;
    const [line, accent] = element.querySelectorAll('.exp-curtain-line > *');
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    let busy = false;
    let timeline;

    const go = (to, path) => {
      busy = true;
      [line.textContent, accent.textContent] = DESTINATIONS[path];
      sound.holdWind(2200);
      const hold = 0.36;
      const arrive = () => {
        pageCurtain.revealAt = performance.now() + hold * 1000;
        navigateRef.current(to);
      };
      const done = () => { busy = false; gsap.set(element, { visibility: 'hidden' }); };
      timeline?.kill();
      if (reduce.matches) {
        timeline = gsap.timeline({ onComplete: done })
          .set(element, { visibility: 'visible', y: 0, yPercent: 0, opacity: 0 })
          .to(element, { opacity: 1, duration: 0.16, ease: 'none' })
          .add(arrive)
          .to(element, { opacity: 0, duration: 0.24, ease: 'none' }, `+=${hold}`);
        return;
      }
      timeline = gsap.timeline({ onComplete: done })
        .set(element, { visibility: 'visible', opacity: 1, y: 0, yPercent: -104, scaleY: 1 })
        .set([line, accent], { yPercent: 115 })
        .add(() => sound.play('curtainDrop'))
        .to(element, { yPercent: 0, duration: 0.42, ease: 'power2.in' })
        .add(() => { sound.play('curtainLand'); arrive(); })
        // The hem hits the floor and bounces once before it settles.
        .fromTo(element, { scaleY: 0.955 }, { scaleY: 1, duration: 0.7, ease: 'elastic.out(1, 0.38)', transformOrigin: '50% 0%' })
        .to([line, accent], { yPercent: 0, duration: 0.55, stagger: 0.07, ease: 'expo.out' }, '<')
        .add(() => sound.play('curtainLift'), `<${hold}`)
        .to(element, { yPercent: -104, duration: 0.72, ease: 'power3.inOut' }, '<')
        .to([line, accent], { yPercent: -60, duration: 0.5, ease: 'power2.in' }, '<');
    };

    const click = (event) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = event.target.closest?.('a[href]');
      if (!link || (link.target && link.target !== '_self') || link.hasAttribute('download')) return;
      const url = new URL(link.href, window.location.href);
      if (url.origin !== window.location.origin || url.pathname === window.location.pathname || !DESTINATIONS[url.pathname]) return;
      // Capture phase: claiming the click here stops the router link from
      // navigating instantly; the curtain navigates once it has landed.
      event.preventDefault();
      if (!busy) go(`${url.pathname}${url.search}${url.hash}`, url.pathname);
    };
    document.addEventListener('click', click, true);
    return () => { document.removeEventListener('click', click, true); timeline?.kill(); };
  }, []);

  return <div ref={curtain} className="exp-curtain" aria-hidden="true">
    <p><span className="exp-curtain-line"><span /></span><span className="exp-curtain-line"><em /></span></p>
  </div>;
}
