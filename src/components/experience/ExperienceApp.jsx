import { lazy, Suspense, useEffect, useLayoutEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import Lenis from 'lenis';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';
import ErrorBoundary from '../ErrorBoundary';
import LiquidNav from './LiquidNav';
import SharpCursor from './SharpCursor';
import InteractionSound from './InteractionSound';
import PageCurtain from './PageCurtain';
import Preloader from './Preloader';
import { sound } from './sfx';
import Portfolio, { WorkIndex } from './Portfolio';
import { travelTo } from './motion';
import './experience.css';

const PaperLab = lazy(() => import('../../pages/PaperLab'));
const Waaazek = lazy(() => import('../Waaazek'));

if (window.location.hash.startsWith('#/')) window.history.replaceState(null, '', window.location.hash.slice(1));

function Experience() {
  const { pathname, hash } = useLocation();
  const isPaper = pathname === '/paper';
  useLayoutEffect(() => {
    document.documentElement.classList.toggle('experience-mode', !isPaper);
    return () => document.documentElement.classList.remove('experience-mode');
  }, [isPaper]);

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    let lenis, frame;
    const setup = () => {
      cancelAnimationFrame(frame); lenis?.destroy(); window.__lenis = null;
      if (media.matches) return;
      // A short exponential glide: enough inertia to feel like mass, not so
      // much that scroll-linked scenes trail behind the hand.
      lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
      window.__lenis = lenis;
      lenis.on('scroll', ScrollTrigger.update);
      const tick = (time) => { lenis.raf(time); frame = requestAnimationFrame(tick); };
      frame = requestAnimationFrame(tick);
    };
    setup(); media.addEventListener('change', setup);
    return () => { media.removeEventListener('change', setup); cancelAnimationFrame(frame); lenis?.destroy(); window.__lenis = null; };
  }, []);

  // The scrollbar takes the colour of the section crossing the middle of the screen.
  useEffect(() => {
    const root = document.documentElement;
    const sections = document.querySelectorAll('[data-tone]');
    if (!sections.length) return undefined;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && root.dataset.scrollTone !== entry.target.dataset.tone) root.dataset.scrollTone = entry.target.dataset.tone;
      });
    }, { rootMargin: '-49% 0px -50% 0px' });
    sections.forEach((section) => observer.observe(section));
    return () => { observer.disconnect(); delete root.dataset.scrollTone; };
  }, [pathname]);

  // In-page anchors travel with the same weighted curve (and sound) as the nav.
  useEffect(() => {
    const click = (event) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = event.target.closest?.('a[href^="#"]');
      if (!link || link.matches('.skip-link')) return;
      const id = link.getAttribute('href');
      const target = id === '#top' ? 0 : document.getElementById(id.slice(1));
      if (target == null) return;
      event.preventDefault();
      history.replaceState(history.state, '', id === '#top' ? window.location.pathname : id);
      travelTo(target);
    };
    document.addEventListener('click', click);
    return () => document.removeEventListener('click', click);
  }, []);

  useLayoutEffect(() => {
    sound.holdWind(900); // the jump to the new page's position is not a gust
    window.scrollTo(0, 0); window.__lenis?.scrollTo(0, { immediate: true, force: true });
    let alive = true;
    let frame = requestAnimationFrame(() => {
      const jump = () => {
        if (!alive) return;
        ScrollTrigger.refresh(); window.__lenis?.resize();
        const id = hash === '#projects' ? '#work' : hash;
        const target = id ? document.getElementById(id.slice(1)) : null;
        if (target) {
          if (window.__lenis) window.__lenis.scrollTo(target, { immediate: true });
          else target.scrollIntoView();
        }
      };
      // Let route layout effects and the pinned timeline settle before using
      // their final positions. CSS scroll-padding owns the header offset.
      document.fonts.ready.then(() => {
        if (!alive) return;
        frame = requestAnimationFrame(() => { frame = requestAnimationFrame(jump); });
      });
    });
    return () => { alive = false; cancelAnimationFrame(frame); };
  }, [pathname, hash]);

  return <div id="top">
    {!isPaper && <><a href="#main-content" className="skip-link">Skip to content</a><LiquidNav /><SharpCursor /><InteractionSound /><PageCurtain /><Preloader /></>}
    <Routes><Route path="/" element={<Portfolio />} /><Route path="/work" element={<WorkIndex />} /><Route path="/paper" element={<Suspense fallback={<div className="exp-loading">Loading the paper lab…</div>}><PaperLab /></Suspense>} /><Route path="*" element={<Navigate to="/" replace />} /></Routes>
    {!isPaper && <Suspense fallback={null}><Waaazek /></Suspense>}
    {import.meta.env.PROD && <><Analytics /><SpeedInsights /></>}
  </div>;
}

export default function ExperienceApp() {
  return <BrowserRouter><ErrorBoundary><Experience /></ErrorBoundary></BrowserRouter>;
}
