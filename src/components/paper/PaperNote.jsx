import React, { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import TornEdge from './TornEdge';
import { tornRightClip } from './tornPath';
import './paper.css';

gsap.registerPlugin(ScrollTrigger);

const hover = (hovered) =>
  window.dispatchEvent(new CustomEvent('cursor-hover', { detail: { hovered } }));

// How many discrete poses the fold passes through. 10 is the sweet spot: few
// enough that every jump is legible as a frame, many enough that the paper
// still reads as rotating rather than teleporting.
const FOLD_FRAMES = 10;

// Folded start angle. Slightly past 90° so each panel is fully edge-on — at
// exactly 90° some browsers still paint a 1px sliver.
const FOLDED_DEG = -96;

const SPOT_STRIP_CLIP = tornRightClip(2287, { depth: 14, segments: 16 });

export default function PaperNote() {
  const root = useRef(null);
  const stage = useRef(null);
  const panel2 = useRef(null);
  const panel3 = useRef(null);
  const shade2 = useRef(null);
  const shade3 = useRef(null);
  const cast = useRef(null);
  const counter = useRef(null);

  useGSAP(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Pin the hinge before anything reads the transform: each panel rotates
    // about the crease it shares with its parent, which is its own top edge.
    gsap.set([panel2.current, panel3.current], {
      transformOrigin: 'top center',
      force3D: true,
    });
    gsap.set(cast.current, { transformOrigin: 'top center', z: -1 });

    // quickSetters write straight to the element's style with no tween object,
    // no allocation, no easing lookup — the right tool when *we* are deciding
    // the value and just need it applied.
    const setRot2 = gsap.quickSetter(panel2.current, 'rotationX', 'deg');
    const setRot3 = gsap.quickSetter(panel3.current, 'rotationX', 'deg');
    const setSh2 = gsap.quickSetter(shade2.current, 'opacity');
    const setSh3 = gsap.quickSetter(shade3.current, 'opacity');
    const setCast = gsap.quickSetter(cast.current, 'scaleY');

    const applyFold = (p) => {
      // Panel 3 trails panel 2 slightly, so the note opens outward in sequence
      // instead of both creases moving in lockstep.
      const p2 = gsap.utils.clamp(0, 1, p / 0.72);
      const p3 = gsap.utils.clamp(0, 1, (p - 0.28) / 0.72);
      setRot2(FOLDED_DEG * (1 - p2));
      setRot3(FOLDED_DEG * (1 - p3));
      setSh2(0.85 * (1 - p2));
      setSh3(0.85 * (1 - p3));
      // The box is three panels tall, so a third of it ≈ the folded footprint.
      setCast(0.34 + 0.66 * ((p2 + p3) / 2));
    };

    if (reduce) {
      applyFold(1);
      gsap.set(['.pn-stamp', '.pn-sign'], { opacity: 1, scale: 1 });
      gsap.set('.paper-marker-ink', { scaleX: 1 });
      root.current?.querySelector('.pn-stamp')?.classList.add('is-inked');
      return;
    }

    applyFold(0);

    // ── Scroll-driven, but quantized ────────────────────────────────────────
    // A normal `scrub` writes a new rotation on every single scroll tick. Here
    // the raw progress is rounded to one of 11 stages and the DOM is only
    // touched when that stage actually changes — so the whole unfold costs ~11
    // style writes instead of a few hundred. The stepping IS the aesthetic, and
    // it happens to be the cheap option; that is the whole idea behind doing
    // stop motion on the web rather than fighting for 60fps.
    let lastFrame = -1;
    let stamped = false;

    // The range is tied to the NOTE, not the section, and runs from "just
    // entering" to "bottom clear of the fold" — so the paper is still opening
    // while it is centred and readable. Anchoring to the section's top instead
    // finished the unfold before the note had properly arrived on screen.
    const st = ScrollTrigger.create({
      trigger: stage.current,
      start: 'top 88%',
      end: 'bottom 78%',
      onUpdate: (self) => {
        const frame = Math.round(self.progress * FOLD_FRAMES);
        if (frame === lastFrame) return;
        lastFrame = frame;

        applyFold(frame / FOLD_FRAMES);
        if (counter.current) {
          counter.current.textContent = `FOLD ${String(frame).padStart(2, '0')} / ${FOLD_FRAMES}`;
        }

        // Once flat, the stamp lands — overshoot then settle, 3 hard frames.
        if (frame === FOLD_FRAMES && !stamped) {
          stamped = true;
          gsap.timeline({ defaults: { force3D: true } })
            .fromTo('.pn-stamp',
              { opacity: 0, scale: 1.85, rotate: -14 },
              {
                opacity: 1, scale: 1, rotate: -8.5, duration: 0.21, ease: 'steps(3)',
                // The ink keeps spreading for a beat after the stamp lifts —
                // handed to CSS so the bleed can't start before the impression.
                onComplete: () =>
                  root.current?.querySelector('.pn-stamp')?.classList.add('is-inked'),
              }
            )
            .fromTo('.paper-marker-ink',
              { scaleX: 0 },
              { scaleX: 1, duration: 0.28, ease: 'steps(8)' },
              '-=0.1'
            )
            .fromTo('.pn-sign',
              { opacity: 0, x: -10 },
              { opacity: 1, x: 0, duration: 0.24, ease: 'steps(4)' },
              '-=0.06'
            );
        }
      },
    });

    return () => st.kill();
  }, { scope: root });

  return (
    <section
      ref={root}
      className="paper-lab relative w-full overflow-hidden bg-[var(--ink)] pb-[130px] pt-[90px] md:pb-[190px] md:pt-[130px]"
      id="paper-note"
      aria-labelledby="pn-heading"
    >
      {/* Section label sits outside the note, on the black */}
      <div className="mx-auto mb-10 flex w-full max-w-[720px] items-baseline justify-between px-5 md:mb-14 md:px-8">
        <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-[var(--grey)]">
          [ Contact ]
        </span>
        <span
          ref={counter}
          className="font-mono text-[10px] uppercase tracking-[0.32em] text-[var(--spot-lift)]"
        >
          FOLD 00 / {FOLD_FRAMES}
        </span>
      </div>

      <div ref={stage} className="pn-stage mx-auto w-full max-w-[720px] px-5 md:px-8">
        {/* --ph is the panel height and therefore the crease spacing. It has to
            comfortably clear the tallest panel's content at every width: the
            panels can't use overflow:hidden, because each one's nested child
            sits entirely outside its box at top:100% and would be clipped away. */}
        <div
          className="pn-note"
          style={{ '--ph': 'clamp(212px, 27vw, 244px)' }}
        >
          {/* Cast shadow — a sibling behind the note, inset past both tears and
              pushed back a hair in Z so the 3D context can never sort it in
              front of a panel. Its scaleY tracks the fold: a folded letter only
              casts a one-panel shadow, so a full-height one sitting under empty
              black would read as a bug. */}
          <span
            ref={cast}
            aria-hidden="true"
            className="paper-cast"
            style={{ left: 8, right: 8, top: 26, bottom: 26 }}
          />

          {/* ── Panel 1 — letterhead. Static; the fold hangs off it. ───────── */}
          <div className="pn-panel paper-sheet relative z-[1] flex flex-col justify-between px-6 py-6 md:px-10 md:py-8">
            <TornEdge seed={7703} side="top" height={22} />

            <span className="paper-tape hidden md:block" style={{ width: 120, height: 30, top: -11, left: '50%', transform: 'translateX(-50%) rotate(2.5deg)', zIndex: 6 }} />

            <div className="relative z-[7] flex items-start justify-between">
              <span className="font-hero text-[26px] font-black leading-none tracking-[-0.03em] md:text-[30px]">
                WT<span className="text-[var(--spot-ink)]">.</span>
              </span>
              <span className="pt-1 text-right font-mono text-[9.5px] uppercase leading-[1.7] tracking-[0.22em] text-[var(--grey)]">
                Memo no. 002
                <br />
                Re: new work
              </span>
            </div>

            <div className="relative z-[7] mt-5 h-px w-full bg-[rgba(11,11,11,0.14)]" />

            <dl className="relative z-[7] mt-5 grid grid-cols-2 gap-y-2.5 font-mono text-[9.5px] uppercase tracking-[0.18em] sm:grid-cols-3">
              {[
                ['Status', 'Open'],
                ['Lead time', '~1 week'],
                ['Scope', 'Web · tooling'],
              ].map(([k, v]) => (
                <div key={k}>
                  <dt className="text-[var(--grey)]">{k}</dt>
                  <dd className="mt-1 text-[var(--ink)]">{v}</dd>
                </div>
              ))}
            </dl>

            <p className="relative z-[7] mt-auto pt-4 font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--grey)]">
              Scroll to unfold ↓
            </p>

            {/* ── Panel 2 — the message ──────────────────────────────────── */}
            <div
              ref={panel2}
              className="pn-panel paper-sheet paper-grid px-6 py-6 md:px-10 md:py-8"
            >
              <span className="paper-crease" style={{ top: 0, zIndex: 5 }} />
              <span ref={shade2} className="pn-shade" />

              <h2
                id="pn-heading"
                className="relative z-[3] font-hero text-[clamp(26px,4.4vw,44px)] font-black leading-[1.04] tracking-[-0.03em]"
              >
                <span className="paper-marker">
                  <span className="paper-marker-ink" style={{ transform: 'rotate(-0.7deg) scaleX(0)' }} />
                  <span className="paper-marker-text">Available</span>
                </span>{' '}
                for work.
              </h2>

              <p className="relative z-[3] mt-4 max-w-[42ch] font-body text-[13.5px] leading-[1.8] text-[var(--ink-soft)] md:text-[14.5px]">
                Freelance builds, product work, or the awkward internal tool
                nobody else wants to own.
              </p>

              <ul className="relative z-[3] mt-5 flex flex-wrap gap-x-5 gap-y-2 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--ink-soft)]">
                {['Full stack web', 'Automation & bots', 'Chrome extensions', 'Dashboards'].map((t) => (
                  <li key={t} className="flex items-center gap-2">
                    <span aria-hidden="true" className="inline-block h-[7px] w-[7px] bg-[var(--spot-2-soft)]" />
                    {t}
                  </li>
                ))}
              </ul>

              {/* ── Panel 3 — sign-off ───────────────────────────────────── */}
              <div
                ref={panel3}
                className="pn-panel paper-sheet flex flex-col justify-between px-6 py-6 md:px-10 md:py-8"
              >
                <span className="paper-crease" style={{ top: 0, zIndex: 5 }} />
                <span ref={shade3} className="pn-shade" />

                <div className="relative z-[3] flex flex-wrap items-start justify-between gap-5">
                  <div className="pn-sign" style={{ opacity: 0 }}>
                    <a
                      href="mailto:databaseamazon1@gmail.com"
                      onMouseEnter={() => hover(true)}
                      onMouseLeave={() => hover(false)}
                      className="font-mono text-[12px] tracking-[0.06em] text-[var(--ink)] underline decoration-[var(--spot-ink)] decoration-2 underline-offset-4 md:text-[13px]"
                      style={{ cursor: 'none' }}
                    >
                      databaseamazon1@gmail.com
                    </a>
                    <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--grey)]">
                      Reply within 24h · Pakistan (UTC+5)
                    </p>
                  </div>

                  <div
                    className="pn-stamp paper-stamp shrink-0 text-center"
                    style={{ opacity: 0, transform: 'rotate(-8.5deg)' }}
                  >
                    <span className="block font-hero text-[11px] font-black uppercase leading-none tracking-[0.1em]">
                      Open for
                    </span>
                    <span className="mt-1 block font-hero text-[11px] font-black uppercase leading-none tracking-[0.1em]">
                      briefs
                    </span>
                  </div>
                </div>

                {/* A pink strip across the foot — the one loud element,
                    and it lands right where the eye stops. */}
                <div className="relative z-[3] mt-auto pt-6">
                  <div
                    className="paper-sheet--spot paper-strip-shadow relative inline-block py-2 pl-4 pr-7"
                    style={{ clipPath: SPOT_STRIP_CLIP }}
                  >
                    <span className="font-mono text-[10px] font-medium uppercase tracking-[0.2em]">
                      Currently taking work for Q4
                    </span>
                  </div>
                </div>

                <TornEdge seed={9151} side="bottom" height={24} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
