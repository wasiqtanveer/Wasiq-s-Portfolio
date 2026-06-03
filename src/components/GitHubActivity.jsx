import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import useScrollReveal from '../hooks/useScrollReveal';

gsap.registerPlugin(ScrollTrigger);

// ─── Helpers ───────────────────────────────────────────────────────────────

function getLevel(count) {
  if (count === 0) return '#111110';
  if (count <= 3)  return 'rgba(57,255,20,0.2)';
  if (count <= 6)  return 'rgba(57,255,20,0.45)';
  if (count <= 9)  return 'rgba(57,255,20,0.7)';
  return '#39FF14';
}

function calcStreak(contributions) {
  let max = 0, cur = 0;
  for (const { count } of contributions) {
    if (count > 0) { cur++; max = Math.max(max, cur); }
    else cur = 0;
  }
  return max;
}

function calcMostActiveDay(contributions) {
  if (!contributions.length) return '—';
  const best = contributions.reduce((a, b) => (b.count > a.count ? b : a), contributions[0]);
  if (!best || !best.count) return '—';
  const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  return days[new Date(best.date).getDay()];
}

function splitChars(text) {
  return text.split('').map((ch, i) => (
    <span key={i} className="inline-block translate-y-[80px] opacity-0 gh-char">
      {ch === ' ' ? '\u00A0' : ch}
    </span>
  ));
}

const FILTERS = [
  { label: 'Last 12 Months', y: 'last' },
  { label: '2025', y: '2025' },
  { label: '2024', y: '2024' },
  { label: '2023', y: '2023' },
];

// ─── Skeleton Grid (same dimensions as real grid — no layout shift) ────────

function GridSkeleton() {
  return (
    <div className="grid gap-[3px]" style={{ gridTemplateColumns: 'repeat(52, 10px)', gridTemplateRows: 'repeat(7, 10px)', width: 'max-content' }}>
      {Array.from({ length: 364 }).map((_, i) => (
        <div key={i} className="w-[10px] h-[10px]" style={{ background: i % 3 === 0 ? '#161614' : '#111110' }} />
      ))}
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────

export default function GitHubActivity() {
  const container  = useRef();
  const dataRef    = useRef();   // wraps just grid + stats for localized transitions
  const [activeFilter, setActiveFilter] = useState('last');
  const [contributions, setContributions] = useState([]);
  const [loading, setLoading] = useState(false); // false initially — we lazy load
  const [hasFetched, setHasFetched] = useState(false); // tracks first load
  const [error, setError] = useState(false);
  const [tooltip, setTooltip] = useState(null);

  useScrollReveal(container);

  // ── LAZY FETCH — Only fetch when section enters viewport ────────────────
  useEffect(() => {
    const section = container.current;
    if (!section) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setHasFetched(prev => {
            if (!prev) {
              // First time visible — trigger initial fetch
              setActiveFilter(f => { fetchData(f); return f; });
            }
            return true;
          });
          observer.disconnect(); // Only need to trigger once
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(section);
    return () => observer.disconnect();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Data fetching ──────────────────────────────────────────────────────

  const fetchData = useCallback(async (y) => {
    setLoading(true);
    if (dataRef.current) gsap.to(dataRef.current, { opacity: 0.5, duration: 0.25 });

    try {
      const res = await fetch(`https://github-contributions-api.jogruber.de/v4/wasiqtanveer?y=${y}`);
      const data = await res.json();
      setContributions(data.contributions || []);
      setError(false);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
      if (dataRef.current) gsap.to(dataRef.current, { opacity: 1, duration: 0.35 });
    }
  }, []);

  // Filter change — only fetch if section already loaded
  const handleFilter = useCallback((y) => {
    if (y === activeFilter) return;
    setActiveFilter(y);
    if (hasFetched) fetchData(y);
  }, [activeFilter, hasFetched, fetchData]);

  // ── Scroll Animations (headline once only) ─────────────────────────────

  useEffect(() => {
    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: container.current,
        start: 'top 85%',
        once: true,
        onEnter: () => {
          gsap.to('.gh-char', {
            y: 0, opacity: 1, duration: 0.8,
            stagger: 0.03, ease: 'power3.out'
          });
        }
      });
    }, container);
    return () => ctx.revert();
  }, []);

  // Wave animation on cells after load
  useEffect(() => {
    if (!loading && contributions.length > 0) {
      requestAnimationFrame(() => {
        gsap.fromTo('.gh-cell',
          { scale: 0.7, opacity: 0 },
          { scale: 1, opacity: 1, ease: 'power3.out', stagger: { amount: 0.7, from: 'start' }, duration: 0.3, overwrite: 'auto' }
        );
      });
    }
  }, [loading, contributions.length]);

  // ── Tooltip (delegated to the grid — one set of listeners, not 3×364) ──
  // Position updates are coalesced into a single rAF so dragging across the
  // grid doesn't fire a React re-render on every mousemove event.
  const tipRaf = useRef(0);
  const tipPos = useRef({ x: 0, y: 0 });

  const handleGridMouseOver = useCallback((e) => {
    const cell = e.target.closest('.gh-cell');
    if (!cell) return;
    setTooltip({
      date: cell.dataset.date,
      count: Number(cell.dataset.count),
      x: e.clientX,
      y: e.clientY,
    });
  }, []);

  const handleGridMouseMove = useCallback((e) => {
    tipPos.current = { x: e.clientX, y: e.clientY };
    if (tipRaf.current) return;
    tipRaf.current = requestAnimationFrame(() => {
      tipRaf.current = 0;
      setTooltip(t => (t ? { ...t, ...tipPos.current } : t));
    });
  }, []);

  useEffect(() => () => { if (tipRaf.current) cancelAnimationFrame(tipRaf.current); }, []);

  // ── Derived stats ──────────────────────────────────────────────────────

  const stats = useMemo(() => [
    { id: 'total',  value: contributions.reduce((s, d) => s + d.count, 0).toLocaleString(), label: 'Total Contributions' },
    { id: 'streak', value: calcStreak(contributions),                                         label: 'Longest Streak (days)' },
    { id: 'active', value: calcMostActiveDay(contributions),                                  label: 'Most Active Day' },
  ], [contributions]);

  // ══════════════════════════════════════════════════════════════════════════

  return (
    <section ref={container} className="relative w-full border-t border-border bg-transparent overflow-hidden" id="activity">

      {/* Static Header — NEVER re-renders on filter change */}
      <div className="px-6 md:px-16 pt-[80px] md:pt-[140px] pb-10 md:pb-14">
        <div className="font-mono text-[11px] text-muted tracking-[0.2em] uppercase mb-8">
          [ 03 — ACTIVITY ]
        </div>

        <h2 className="font-hero font-black text-[clamp(40px,7vw,80px)] leading-[1.1] m-0 overflow-hidden">
          <div className="overflow-hidden leading-[1.1] text-text">{splitChars('Always')}</div>
          <div className="overflow-hidden leading-[1.1] text-green">{splitChars('Building.')}</div>
        </h2>

        {/* Filter Pills */}
        <div className="flex justify-end gap-2 mt-8 flex-wrap">
          {FILTERS.map(f => (
            <button
              key={f.y}
              onClick={() => handleFilter(f.y)}
              className={`font-mono text-[10px] uppercase tracking-widest px-4 py-1.5 border transition-all duration-200 cursor-none outline-none ${
                activeFilter === f.y
                  ? 'bg-[rgba(57,255,20,0.08)] border-[rgba(57,255,20,0.3)] text-green'
                  : 'bg-surface border-border text-muted hover:border-[rgba(57,255,20,0.2)] hover:text-text'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Data Area — persistent containers, only values change */}
      <div ref={dataRef} className="px-6 md:px-16 pb-[80px] md:pb-[140px] flex flex-col gap-10">

        {error ? (
          <div className="text-center py-16">
            <a href="https://github.com/wasiqtanveer" target="_blank" rel="noopener noreferrer" className="font-mono text-[12px] text-muted hover:text-green transition-colors">
              [ unable to load activity — visit github.com/wasiqtanveer ]
            </a>
          </div>
        ) : (
          <>
            {/* Grid — permanent container, cells swap colors */}
            <div className="overflow-x-auto gh-grid relative">
              {tooltip && (
                <div
                  className="fixed z-50 font-mono text-[10px] bg-bg border border-border px-[10px] py-[6px] pointer-events-none whitespace-nowrap"
                  style={{ left: tooltip.x + 14, top: tooltip.y - 38 }}
                >
                  <span className="text-muted">{tooltip.date}:</span>&nbsp;
                  <span className="text-green font-bold">{tooltip.count}</span>&nbsp;
                  <span className="text-muted">contributions</span>
                </div>
              )}
              <div
                className="grid gap-[3px]"
                style={{ gridTemplateColumns: 'repeat(52, 10px)', gridTemplateRows: 'repeat(7, 10px)', width: 'max-content' }}
                onMouseOver={handleGridMouseOver}
                onMouseMove={handleGridMouseMove}
                onMouseLeave={() => setTooltip(null)}
              >
                {contributions.length > 0
                  ? contributions.map((day, i) => (
                    <div key={i} className="gh-cell w-[10px] h-[10px] cursor-default transition-colors duration-300"
                      data-date={day.date}
                      data-count={day.count}
                      style={{ background: getLevel(day.count) }}
                    />
                  ))
                  : <GridSkeleton />
                }
              </div>
            </div>

            {/* Stats — permanent cards, values fade with loading state */}
            <div className="gh-stats flex flex-col md:flex-row border border-border">
              {stats.map((s) => (
                <div key={s.id} className="flex-1 px-6 md:px-8 py-6 md:py-8 border-b md:border-b-0 md:border-r border-border last:border-0">
                  <div className={`font-hero font-black text-[clamp(32px,4vw,48px)] text-green leading-none mb-2 transition-all duration-300 ${loading ? 'opacity-30 scale-95' : 'opacity-100 scale-100'}`}>
                    {s.value}
                  </div>
                  <div className="font-mono text-[11px] text-muted uppercase tracking-widest">{s.label}</div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
