import React, { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/**
 * Monospace text that types itself on, one character per frame.
 *
 * Implemented as a single clip-path tween with `steps(<character count>)`
 * rather than one tween per character. Because the font is monospace, every
 * step of the wipe lands exactly on a character boundary — so one tween on one
 * element produces a perfect typewriter, instead of N staggered tweens on N
 * wrapper spans. Fewer elements, no DOM surgery, and the stepping is exact
 * rather than approximated by a stagger.
 *
 * The trailing block cursor is a sibling so it can keep blinking on its own
 * beat without being part of the wipe.
 */
export default function SteppedType({
  text,
  className = '',
  /** Seconds per character. */
  rate = 0.045,
  /** Delay after the trigger fires. */
  delay = 0,
  cursor = false,
  as: tag = 'span',
}) {
  const Tag = tag;
  const ref = useRef(null);

  useGSAP(() => {
    const el = ref.current;
    if (!el) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      gsap.set(el, { clipPath: 'inset(0 0% 0 0)' });
      return;
    }

    gsap.fromTo(el,
      { clipPath: 'inset(0 100% 0 0)' },
      {
        clipPath: 'inset(0 0% 0 0)',
        duration: Math.max(0.2, text.length * rate),
        ease: `steps(${text.length})`,
        delay,
        scrollTrigger: { trigger: el, start: 'top 92%', once: true },
      }
    );
  }, { scope: ref, dependencies: [text, rate, delay] });

  return (
    <Tag className={className} style={{ display: 'inline-flex', alignItems: 'baseline' }}>
      <span ref={ref} style={{ clipPath: 'inset(0 100% 0 0)', whiteSpace: 'pre' }}>
        {text}
      </span>
      {cursor && (
        <span
          aria-hidden="true"
          className="paper-caret"
          style={{ marginLeft: '0.35em' }}
        />
      )}
    </Tag>
  );
}
