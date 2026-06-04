import React, { useState, useCallback, useEffect, lazy, Suspense } from 'react';
import { HashRouter, Routes, Route, useLocation } from 'react-router-dom';
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

// Lazy load heavy sections
const Projects      = lazy(() => import('./components/Projects'));
const GitHubActivity = lazy(() => import('./components/GitHubActivity'));
const Contact       = lazy(() => import('./components/Contact'));
const Footer        = lazy(() => import('./components/Footer'));
const WorkArchive   = lazy(() => import('./pages/WorkArchive'));

gsap.registerPlugin(ScrollTrigger);

const isTouchDevice = () =>
  typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches;

const SectionFallback = () => (
  <div className="w-full border-t border-border" style={{ minHeight: '100px' }} />
);

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    if (window.__lenis) {
      window.__lenis.scrollTo(0, { immediate: true });
    } else {
      window.scrollTo(0, 0);
    }
  }, [pathname]);
  return null;
}

function Home({ ready, setReady }) {
  const handlePreloaderComplete = useCallback(() => setReady(true), []);

  return (
    <>
      {/* Preloader */}
      {!ready && <Preloader onComplete={handlePreloaderComplete} />}

      {/* Main — always in DOM, hidden until preloader completes.
          relative z-[1] keeps all content above the fixed Background group
          (which owns z-index 0) without relying on negative z-index. */}
      <div className={`relative z-[1] ${ready ? '' : 'opacity-0 pointer-events-none select-none'}`}>
        <main className="relative w-full h-full selection:bg-green selection:text-bg">
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
      </div>
    </>
  );
}

function App() {
  const [ready, setReady] = useState(false);
  const [isMobile]  = useState(isTouchDevice);

  // ── Lenis smooth scroll ──────────────────────────────────────────────────
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });

    window.__lenis = lenis;

    // Keep ScrollTrigger in sync with Lenis' virtualized scroll position.
    // Without this, scroll-driven animations (incl. the top progress bar) lag
    // or never fire because ScrollTrigger reads the native scroll, not Lenis.
    lenis.on('scroll', ScrollTrigger.update);

    const rafCb = (time) => lenis.raf(time * 1000);
    gsap.ticker.add(rafCb);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(rafCb);
      lenis.destroy();
      window.__lenis = null;
    };
  }, []);

  return (
    <HashRouter>
      <Background />
      <ScrollToTop />
      <ErrorBoundary>
        <ScrollProgress />
        {!isMobile && <CustomCursor />}
        <Routes>
          <Route path="/" element={<Home ready={ready} setReady={setReady} />} />
          <Route path="/work" element={
            <div className={`relative z-[1] ${ready ? '' : 'opacity-0 pointer-events-none select-none'}`}>
              <Suspense fallback={<SectionFallback />}>
                <WorkArchive />
                <Footer />
              </Suspense>
            </div>
          } />
        </Routes>
        <Waaazek />
      </ErrorBoundary>
      <Analytics />
      <SpeedInsights />
    </HashRouter>
  );
}

export default App;
