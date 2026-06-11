import React, { useRef, useEffect } from 'react';
import gsap from 'gsap';

export default function Marquee() {
  const trackRef = useRef(null);
  const tweenRef = useRef(null);
  const prefersReduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  useEffect(() => {
    if (prefersReduced) return;
    tweenRef.current = gsap.to(trackRef.current, {
      x: '-50%',
      duration: 25,
      ease: 'none',
      repeat: -1,
    });

    // Premium touch: the marquee accelerates with scroll velocity and eases
    // back to cruise speed when you stop. Lenis mounts in a parent effect
    // (after this child effect), so attach lazily via a short rAF retry.
    let speedTo = null;
    let lenis = null;
    let tries = 0;
    let rafId = 0;
    const onScroll = (e) => {
      if (!speedTo && tweenRef.current) {
        speedTo = gsap.quickTo(tweenRef.current, 'timeScale', { duration: 0.6, ease: 'power2.out' });
      }
      if (speedTo) speedTo(1 + Math.min(Math.abs(e.velocity) * 0.05, 2.5));
    };
    const attach = () => {
      lenis = window.__lenis;
      if (lenis) { lenis.on('scroll', onScroll); return; }
      if (tries++ < 120) rafId = requestAnimationFrame(attach);
    };
    attach();

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      if (lenis) lenis.off('scroll', onScroll);
      tweenRef.current?.kill();
    };
  }, [prefersReduced]);

  const items = [
    'React', 'Node.js', 'TypeScript', 'Python', 'AWS',
    'PostgreSQL', 'Docker', 'Git', 'Next.js', 'MongoDB',
    'Redis', 'GraphQL'
  ];

  return (
    <div
      className="relative z-10 overflow-hidden w-full whitespace-nowrap border-t border-[#202020] py-4 mt-auto"
      role="marquee"
      aria-label="Tech stack"
      onMouseEnter={() => tweenRef.current?.pause()}
      onMouseLeave={() => tweenRef.current?.resume()}
    >
      <div className="inline-flex" ref={trackRef}>
        {Array(2).fill(0).map((_, gi) => (
          <React.Fragment key={gi}>
            {items.map((tech, idx) => (
              <React.Fragment key={`${gi}-${idx}`}>
                <span className="font-mono text-[11px] uppercase tracking-widest text-[#565656] px-7">{tech}</span>
                <span className="inline-block text-[#39FF14]">·</span>
              </React.Fragment>
            ))}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
