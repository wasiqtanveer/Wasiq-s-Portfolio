import React, { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import TornEdge from './TornEdge';
import SteppedType from './SteppedType';
import useSteppedTilt from './useSteppedTilt';
import { tornRightClip } from './tornPath';
import './paper.css';

gsap.registerPlugin(ScrollTrigger);

const hover = (hovered) =>
  window.dispatchEvent(new CustomEvent('cursor-hover', { detail: { hovered } }));

// `clip` is generated once at module load — a torn right edge unique to each
// strip, so no two look die-cut from the same template.
const STEPS = [
  {
    n: '01',
    title: 'Understand',
    body: 'Before a line of code: what breaks today, who feels it, and what "done" actually looks like. Most of the work is deciding what not to build.',
    note: 'notes, not specs',
    tone: 'hi',
    tilt: -0.5,
    clip: tornRightClip(3121),
  },
  {
    n: '02',
    title: 'Sketch',
    body: 'Low fidelity, fast. Structure and flow get settled on paper while they are still cheap to change — styling comes last, on purpose.',
    note: 'pen + paper',
    tone: 'paper',
    tilt: 0.6,
    clip: tornRightClip(5087),
  },
  {
    n: '03',
    title: 'Build',
    body: 'Small shippable slices against real data from day one, so the ugly problems surface while there is still time to fix them properly.',
    note: 'real data early',
    tone: 'spot',
    tilt: -0.35,
    clip: tornRightClip(7433),
  },
  {
    n: '04',
    title: 'Ship',
    body: 'Deployed, measured, handed over with notes someone else can actually read. Then iterated on what the numbers say — not what I assumed.',
    note: 'then measure',
    tone: 'spot2',
    tilt: 0.45,
    clip: tornRightClip(9209),
  },
];

export default function PaperProcess() {
  const root = useRef(null);
  const sheet = useRef(null);
  // Tilt goes on the inner sheet, entrance on the outer wrapper — two elements
  // so neither transform ever overwrites the other.
  const tilt = useSteppedTilt({ max: 2.1, steps: 5 });

  useGSAP(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const strips = gsap.utils.toArray('.pp-strip');
    const ink = root.current.querySelector('.paper-marker-ink');

    if (reduce) {
      gsap.set([sheet.current, ...strips], { opacity: 1, y: 0, rotate: 0 });
      gsap.set(ink, { scaleX: 1 });
      return;
    }

    // ── Everything below is stepped on purpose ──────────────────────────────
    // GSAP's `steps(n)` easing holds a value then jumps, so a tween lands on n
    // discrete poses instead of sweeping through hundreds. Two things follow:
    // the motion reads as frame-by-frame animation, and each tween writes ~n
    // style changes instead of one per frame at 60fps.
    const tl = gsap.timeline({
      defaults: { force3D: true },
      scrollTrigger: { trigger: root.current, start: 'top 72%', once: true },
    });

    // The sheet drops onto the surface in 5 frames — like a cel being laid down.
    tl.fromTo(sheet.current,
      { y: 34, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.42, ease: 'steps(5)' }
    );

    // Marker swipe: 9 steps across the word ≈ the speed of a real hand.
    tl.fromTo(ink,
      { scaleX: 0 },
      { scaleX: 1, duration: 0.3, ease: 'steps(9)' },
      '+=0.06'
    );

    // Strips flip in individually. Each keeps its resting tilt as the tween's
    // end value so it settles crooked, the way a torn strip lies.
    strips.forEach((strip, i) => {
      const tilt = Number(strip.dataset.tilt || 0);
      tl.fromTo(strip,
        { y: 26, opacity: 0, rotate: tilt - 1.6 },
        { y: 0, opacity: 1, rotate: tilt, duration: 0.28, ease: 'steps(4)' },
        0.5 + i * 0.13
      );
    });

    // The "shot on 12s" tag thwacks in like a stamp: overshoot, then settle,
    // in 3 hard frames.
    tl.fromTo('.pp-tag',
      { scale: 1.7, opacity: 0, rotate: -11 },
      { scale: 1, opacity: 1, rotate: -7, duration: 0.24, ease: 'steps(3)' },
      '>-0.1'
    );
  }, { scope: root });

  return (
    <section
      ref={root}
      className="paper-lab relative w-full overflow-hidden bg-[var(--ink)] py-[100px] md:py-[150px]"
      id="paper-process"
      aria-labelledby="pp-heading"
    >
      <div className="relative mx-auto w-full max-w-[1180px] px-5 md:px-8">

        {/* ── The backing board ─────────────────────────────────────────────
            Tone `--paper-2`, a shade greyer than the strips that lie on it.
            Identical whites would flatten the whole collage into one surface —
            the strips only read as separate pieces because the board disagrees
            with them slightly.

            The cast shadow is a sibling behind the sheet, inset past both
            tears: a box-shadow on the sheet itself is drawn from its
            rectangular border box and would trace a straight line right across
            each torn edge. */}
        <div
          ref={sheet}
          className="relative"
          style={{ opacity: 0, perspective: '2000px' }}
        >
          <span aria-hidden="true" className="paper-cast" style={{ left: 10, right: 10, top: 34, bottom: 34 }} />

          <div ref={tilt} className="paper-sheet paper-sheet--board paper-ruled relative z-[1] px-6 py-[86px] md:px-16 md:py-[112px]">
          <TornEdge seed={1187} side="top" height={30} />
          <TornEdge seed={4021} side="bottom" height={30} />

          {/* Tape holding the sheet down, overhanging the torn top edge */}
          <span className="paper-tape hidden md:block" style={{ width: 132, height: 34, top: -14, left: '11%', transform: 'rotate(-4deg)', zIndex: 6 }} />
          <span className="paper-tape hidden md:block" style={{ width: 118, height: 32, top: -12, right: '14%', transform: 'rotate(5.5deg)', zIndex: 6 }} />

          {/* ── Header ────────────────────────────────────────────────────── */}
          <div className="relative z-[7] flex flex-wrap items-baseline justify-between gap-4">
            <SteppedType
              text="[ PROCESS ]"
              cursor
              className="font-mono text-[10px] uppercase tracking-[0.32em] text-[var(--grey)]"
            />
            <SteppedType
              text="SHEET 01 / 02"
              delay={0.35}
              className="font-mono text-[10px] uppercase tracking-[0.32em] text-[var(--grey)]"
            />
          </div>

          <h2
            id="pp-heading"
            className="relative z-[7] mt-7 font-hero text-[clamp(34px,5.4vw,68px)] font-black leading-[1.02] tracking-[-0.03em] text-[var(--ink)]"
          >
            How I{' '}
            <span className="paper-marker">
              <span className="paper-marker-ink" style={{ transform: 'rotate(-0.7deg) scaleX(0)' }} />
              <span className="paper-marker-text">actually</span>
            </span>{' '}
            work.
          </h2>

          <p className="relative z-[7] mt-6 max-w-[54ch] font-body text-[14px] leading-[1.85] text-[var(--ink-soft)] md:text-[15px]">
            Four steps, in order, every time. The boring consistency is the point —
            it is what makes the estimates honest.
          </p>

          {/* ── Strips ────────────────────────────────────────────────────── */}
          <ol className="relative z-[7] mt-12 flex flex-col gap-3.5 md:mt-16 md:gap-4">
            {STEPS.map((s) => {
              const surface =
                s.tone === 'spot' ? 'paper-sheet--spot'
                : s.tone === 'spot2' ? 'paper-sheet--spot2'
                : s.tone === 'hi' ? 'paper-sheet--hi'
                : '';
              const numTone =
                s.tone === 'spot2' ? 'bg-[var(--spot)] text-[var(--paper-hi)]'
                : 'bg-[var(--ink)] text-[var(--paper-hi)]';
              const onDark = s.tone === 'spot2' || s.tone === 'spot';
              const bodyTone = onDark ? 'text-[rgba(247,242,231,0.82)]' : 'text-[var(--ink-soft)]';
              const noteTone = onDark ? 'text-[rgba(247,242,231,0.6)]' : 'text-[var(--ink)]/45';

              return (
                // Two elements on purpose. GSAP owns the <li>'s transform for
                // the entrance; CSS owns the face's transform for the hover
                // lift. Putting both on one element means the CSS transition
                // re-animates every value GSAP writes, and the stepped entrance
                // turns to mush.
                <li
                  key={s.n}
                  data-tilt={s.tilt}
                  className="pp-strip relative"
                  style={{ opacity: 0, transform: `rotate(${s.tilt}deg)` }}
                >
                  <div
                    className={`pp-strip-face paper-sheet ${surface} paper-strip-shadow relative flex flex-col gap-3 py-6 pl-5 pr-12 md:flex-row md:items-start md:gap-8 md:py-7 md:pl-7 md:pr-20`}
                    style={{ clipPath: s.clip }}
                    onMouseEnter={() => hover(true)}
                    onMouseLeave={() => hover(false)}
                  >
                    {/* self-start matters: the strip is a flex COLUMN on mobile,
                        and the default `stretch` would blow this tab out to the
                        full strip width. */}
                    <span className={`${numTone} inline-flex h-8 shrink-0 items-center self-start px-3 font-mono text-[11px] font-medium tracking-[0.22em]`}>
                      {s.n}
                    </span>

                    <div className="min-w-0 flex-1">
                      <h3 className="font-hero text-[17px] font-black uppercase tracking-[0.06em] md:text-[19px]">
                        {s.title}
                      </h3>
                      <p className={`mt-2 max-w-[62ch] font-body text-[13.5px] leading-[1.8] ${bodyTone}`}>
                        {s.body}
                      </p>
                    </div>

                    <span className={`shrink-0 font-mono text-[10px] uppercase tracking-[0.2em] md:pt-1.5 ${noteTone}`}>
                      {s.note}
                    </span>
                  </div>

                  {/* Corner curl — the shadow it throws, then the reverse of
                      the sheet on top of it. */}
                  <span aria-hidden="true" className="pp-curl-shadow" />
                  <span aria-hidden="true" className="pp-curl" />
                </li>
              );
            })}
          </ol>

          {/* ── The tag that explains the aesthetic ─────────────────────────
              Same split as the strips: the outer element is GSAP's (the stamp
              thwack), the inner one carries the looping CSS jitter. A CSS
              animation always beats an inline style in the cascade, so sharing
              one element would let the jitter simply erase GSAP's transform. */}
          <div
            className="pp-tag absolute z-[8]"
            style={{ opacity: 0, right: '4%', bottom: 34, transform: 'rotate(-7deg)' }}
          >
            <div className="paper-sheet--spot paper-jitter px-4 py-3 text-center">
              {/* "On twos" = two frames per exposure = 12fps, the rate this
                  whole section is animated at. Keep the wording consistent with
                  the 12fps beat in paper.css. */}
              <span className="block font-hero text-[13px] font-black uppercase leading-none tracking-[0.05em]">
                Shot on twos
              </span>
              <span className="mt-1.5 block font-mono text-[8.5px] uppercase tracking-[0.24em] opacity-70">
                12 fps · hand-cut
              </span>
            </div>
          </div>
          </div>
        </div>
      </div>
    </section>
  );
}
