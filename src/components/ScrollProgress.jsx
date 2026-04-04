import React, { useRef, useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export default function ScrollProgress() {
  const barRef = useRef(null);

  useEffect(() => {
    const st = ScrollTrigger.create({
      trigger: document.body,
      start: 'top top',
      end: 'bottom bottom',
      scrub: 0.3,
      onUpdate: (self) => {
        if (barRef.current) {
          gsap.set(barRef.current, { width: `${self.progress * 100}%` });
        }
      }
    });
    return () => st.kill();
  }, []);

  return (
    <div
      ref={barRef}
      role="progressbar"
      aria-label="Page scroll progress"
      aria-valuemin={0}
      aria-valuemax={100}
      className="fixed top-0 left-0 h-[2px] bg-[#39FF14] z-[99998] w-0 pointer-events-none shadow-[4px_0_12px_rgba(57,255,20,0.6)]"
    />
  );
}
