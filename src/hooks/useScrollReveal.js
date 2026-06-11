import { useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export default function useScrollReveal(ref) {
  useEffect(() => {
    if (!ref.current) return;

    // Respect prefers-reduced-motion — just show element immediately
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      gsap.set(ref.current, { opacity: 1, y: 0, clipPath: 'inset(0% 0% 0% 0%)' });
      return;
    }

    const ctx = gsap.context(() => {
      const el = ref.current;
      // Sections tilt up out of the page (subtle rotateX through a perspective)
      // for a 3D entrance instead of a flat slide. Transform-only = GPU-cheap.
      gsap.fromTo(el,
        { opacity: 0, y: 60, rotateX: 6, transformPerspective: 900, transformOrigin: 'center top', clipPath: 'inset(8% 0% 0% 0%)' },
        {
          opacity: 1, y: 0, rotateX: 0, clipPath: 'inset(0% 0% 0% 0%)',
          duration: 1.0, ease: 'power3.out',
          scrollTrigger: { trigger: el, start: 'top 88%' },
          onComplete: () => gsap.set(el, { clearProps: 'transform,clipPath' }),
        }
      );
    }, ref);

    return () => ctx.revert();
  }, [ref]);
}
