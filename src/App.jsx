import React, { useState, useCallback, useEffect, useLayoutEffect, useRef, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";
import CustomCursor from './components/CustomCursor';
import Background from './components/Background';
import Hero from './components/Hero';
import About from './components/About';
import ScrollProgress from './components/ScrollProgress';
import Preloader from './components/Preloader';
import ErrorBoundary from './components/ErrorBoundary';
import Waaazek from './components/Waaazek';
import {
  loadProjects, loadGitHub, loadContact, loadFooter, loadWorkArchive, loadPaperLab,
  prefetchHome, prefetchWork, onIdle,
} from './lazyRoutes';

// Lazy load heavy sections. The loaders come from ./lazyRoutes so the same
// module promise can be pre-warmed on hover / during idle time.
const Projects       = lazy(loadProjects);
const GitHubActivity = lazy(loadGitHub);
const Contact        = lazy(loadContact);
const Footer         = lazy(loadFooter);
const WorkArchive    = lazy(loadWorkArchive);
const PaperLab       = lazy(loadPaperLab);

gsap.registerPlugin(ScrollTrigger);

const isTouchDevice = () =>
  typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches;

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const SectionFallback = () => (
  <div className="w-full border-t border-border" style={{ minHeight: '100px' }} />
);

// The /work fallback reserves a full viewport instead of 100px. A collapsing
// placeholder made the page height snap twice (shrink, then grow when the real
// content mounted), which Lenis and ScrollTrigger both had to re-measure —
// that double re-measure is what read as the scroll "hitching" mid-navigation.
const PageFallback = () => (
  <div className="w-full" style={{ minHeight: '100vh' }} />
);

// Back-compat: rewrite old HashRouter URLs (/#/work -> /work) before the
// router mounts, so stale external links still land on the right page.
if (typeof window !== 'undefined' && window.location.hash.startsWith('#/')) {
  window.history.replaceState(null, '', window.location.hash.slice(1));
}

/**
 * Resets scroll on navigation and re-measures the scroll systems afterwards.
 *
 * Runs in a LAYOUT effect on purpose. As a passive effect this landed one paint
 * too late: the new route was painted at the *old* scroll offset (often
 * thousands of pixels down, so you saw a slice of the footer) and only then
 * snapped to the top. That snap was the "animation pauses, then continues" —
 * the entrance tween was already running while the viewport jumped underneath
 * it. Resetting before paint means the new page is only ever painted at y=0.
 */
function RouteScrollReset() {
  const { pathname } = useLocation();
  const first = useRef(true);

  useLayoutEffect(() => {
    // Native scroll first (synchronous, always applies), then hand Lenis the
    // same position so its internal animatedScroll/targetScroll don't drift.
    window.scrollTo(0, 0);
    window.__lenis?.scrollTo(0, { immediate: true, force: true });

    if (first.current) { first.current = false; return; }

    // The new tree is mounted but hasn't been laid out from the browser's point
    // of view yet. One frame later the document height is final, so this is the
    // right moment to let Lenis and ScrollTrigger re-measure — without it,
    // every trigger on the new page keeps the *previous* page's start/end
    // offsets and fires at the wrong time (or never).
    const id = requestAnimationFrame(() => {
      window.__lenis?.resize();
      ScrollTrigger.refresh();
    });
    return () => cancelAnimationFrame(id);
  }, [pathname]);

  return null;
}

// True until the first route has mounted. The initial page load already has its
// own choreography (preloader → hero timeline), so the navigation transition
// must not double up on it — it only applies to client-side route changes.
let firstRouteMounted = false;

/**
 * Entrance transition for a route change. A short, transform-only rise+fade so
 * navigation never hard-cuts.
 *
 * Two details matter for smoothness:
 *  - it wraps only the page BODY, never the preloader or the fixed background,
 *    because a transform on an ancestor re-anchors `position: fixed`
 *    descendants for the duration of the tween;
 *  - `clearProps` on completion drops the inline transform and will-change, so
 *    the compositor stops holding a full-page promoted layer once the page has
 *    settled.
 */
function PageTransition({ children, className = '' }) {
  const el = useRef(null);
  // Read once, at mount, via a state initializer rather than a ref. A ref read
  // during render is not safe under concurrent rendering (React can render a
  // tree it later discards, and the ref would already be stale) — and it is
  // exactly what `react-hooks/refs` flags here.
  const [animate] = useState(() => firstRouteMounted);

  useLayoutEffect(() => {
    firstRouteMounted = true;
    const node = el.current;
    if (!node) return;

    if (!animate || prefersReducedMotion()) {
      gsap.set(node, { opacity: 1, y: 0, clearProps: 'willChange' });
      return;
    }

    const tween = gsap.fromTo(node,
      { opacity: 0, y: 14 },
      {
        opacity: 1, y: 0, duration: 0.5, ease: 'power2.out', force3D: true,
        onComplete: () => gsap.set(node, { clearProps: 'transform,willChange' }),
      }
    );
    return () => tween.kill();
  }, [animate]);

  return (
    <div
      ref={el}
      className={className}
      style={animate ? { opacity: 0, willChange: 'transform, opacity' } : undefined}
    >
      {children}
    </div>
  );
}

function Home({ ready, setReady }) {
  const handlePreloaderComplete = useCallback(() => setReady(true), [setReady]);

  return (
    <>
      {/* Preloader — outside PageTransition on purpose: it is position:fixed and
          must not inherit a transform from the transition wrapper. */}
      {!ready && <Preloader onComplete={handlePreloaderComplete} />}

      {/* Main — always in DOM, hidden until preloader completes.
          relative z-[1] keeps all content above the fixed Background group
          (which owns z-index 0) without relying on negative z-index. */}
      <PageTransition className={`relative z-[1] ${ready ? '' : 'opacity-0 pointer-events-none select-none'}`}>
        <a href="#main-content" className="skip-link">Skip to content</a>
        <main id="main-content" tabIndex={-1} className="relative w-full h-full selection:bg-green selection:text-bg">
          <Hero isReady={ready} />
          <About />
          <Suspense fallback={<SectionFallback />}>
            <Projects />
          </Suspense>
          <Suspense fallback={<SectionFallback />}>
            <GitHubActivity />
          </Suspense>
          <Suspense fallback={<SectionFallback />}>
            <Contact />
          </Suspense>
          <Suspense fallback={<SectionFallback />}>
            <Footer />
          </Suspense>
        </main>
      </PageTransition>
    </>
  );
}

/** The /work route. Deliberately NOT gated on the preloader's `ready` flag —
 *  the preloader only ever runs on "/", so gating opacity on it left the whole
 *  archive invisible for anyone who opened /work directly or reloaded on it. */
function WorkRoute() {
  return (
    <PageTransition className="relative z-[1]">
      <Suspense fallback={<PageFallback />}>
        <WorkArchive />
        <Footer />
      </Suspense>
    </PageTransition>
  );
}

function PaperLabRoute() {
  return (
    <PageTransition className="relative z-[1]">
      <Suspense fallback={<PageFallback />}>
        <PaperLab />
      </Suspense>
    </PageTransition>
  );
}

function RoutedApp({ ready, setReady }) {
  const { pathname } = useLocation();
  const isHome = pathname === '/';

  // ── Chunk warming ────────────────────────────────────────────────────────
  // Once the preloader is done (or immediately, on any non-home route) the main
  // thread has an idle gap. Spend it fetching the chunks the user is most
  // likely to need next, so neither the first scroll nor the /work navigation
  // has to wait on the network.
  useEffect(() => {
    if (isHome && !ready) return;
    const cancelHome = onIdle(prefetchHome);
    const cancelWork = onIdle(prefetchWork, 6000);
    return () => { cancelHome(); cancelWork(); };
  }, [ready, isHome]);

  return (
    <>
      <RouteScrollReset />
      <Routes>
        <Route path="/" element={<Home ready={ready} setReady={setReady} />} />
        <Route path="/work" element={<WorkRoute />} />
        {/* Design prototype — torn paper / stop-motion direction, under review */}
        <Route path="/paper" element={<PaperLabRoute />} />
      </Routes>
    </>
  );
}

function App() {
  const [ready, setReady] = useState(false);
  const [isMobile]  = useState(isTouchDevice);

  // ── Lenis smooth scroll ──────────────────────────────────────────────────
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.05,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });

    window.__lenis = lenis;

    // Keep ScrollTrigger in sync with Lenis' virtualized scroll position.
    // Without this, scroll-driven animations (incl. the top progress bar) lag
    // or never fire because ScrollTrigger reads the native scroll, not Lenis.
    lenis.on('scroll', ScrollTrigger.update);

    // NOTE: the scroll velocity-skew effect was removed deliberately. Skewing
    // <main> every scroll tick invalidated the backdrop-filter on the liquid
    // glass cards each frame (the blur must resample a changed backdrop), which
    // tanked scroll FPS. Glass and whole-page transform effects don't mix.

    // Lenis drives itself from its own rAF rather than riding gsap.ticker.
    // The usual gsap.ticker integration requires lagSmoothing(0) so Lenis
    // receives true elapsed time — but lagSmoothing is global, so disabling it
    // means ANY long frame (a route swap, a lazy chunk parsing, the GC) lets
    // every in-flight tween jump forward by the whole stall instead of easing
    // through it. That teleport is exactly the "animations stop, then continue"
    // artifact. Separate loops = Lenis keeps real time AND GSAP keeps its
    // default lag clamp, so a hiccup slows motion briefly instead of skipping.
    let rafId = 0;
    const raf = (time) => {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    };
    rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      lenis.off('scroll', ScrollTrigger.update);
      lenis.destroy();
      window.__lenis = null;
    };
  }, []);

  // ScrollTrigger recalculates every trigger on window resize. Mobile browsers
  // fire resize when the URL bar hides/shows during a scroll, so without this
  // a full refresh lands mid-scroll on every flick.
  useEffect(() => {
    ScrollTrigger.config({ ignoreMobileResize: true });
  }, []);

  return (
    <BrowserRouter>
      <Background />
      <ErrorBoundary>
        <ScrollProgress />
        {!isMobile && <CustomCursor />}
        <RoutedApp ready={ready} setReady={setReady} />
        <Waaazek />
      </ErrorBoundary>
      <Analytics />
      <SpeedInsights />
    </BrowserRouter>
  );
}

export default App;
