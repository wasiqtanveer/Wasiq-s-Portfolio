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
    return () => tweenRef.current?.kill();
  }, [prefersReduced]);

  const items = [
    'React', 'Node.js', 'TypeScript', 'Python', 'AWS',
    'PostgreSQL', 'Docker', 'Git', 'Next.js', 'MongoDB',
    'Redis', 'GraphQL'
  ];

  return (
    <div
      className="relative z-10 overflow-hidden w-full whitespace-nowrap border-t border-[#1e1e18] py-4 mt-auto"
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
                <span className="font-mono text-[11px] uppercase tracking-widest text-[#4a4a42] px-7">{tech}</span>
                <span className="inline-block text-[#39FF14]">·</span>
              </React.Fragment>
            ))}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
