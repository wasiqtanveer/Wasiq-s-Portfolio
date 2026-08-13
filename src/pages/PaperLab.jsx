import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import PaperCursor from '../components/paper/PaperCursor';
import PaperHero from '../components/paper/PaperHero';
import PaperProcess from '../components/paper/PaperProcess';
import PaperNote from '../components/paper/PaperNote';
import SteppedType from '../components/paper/SteppedType';
import '../components/paper/paper.css';

// A hand-drawn underline: two passes of the same wobbly stroke, the way anyone
// underlines something in pen — the second pass never lands on the first.
const UNDERLINE_A = 'M4 15 C 60 6, 128 20, 196 10 S 322 18, 402 7 S 470 16, 496 11';
const UNDERLINE_B = 'M10 21 C 74 13, 140 25, 210 16 S 330 24, 408 14 S 468 21, 490 18';

const hover = (hovered) =>
  window.dispatchEvent(new CustomEvent('cursor-hover', { detail: { hovered } }));

/**
 * Preview route for the torn-paper / stop-motion direction.
 *
 * Deliberately a separate page rather than an append to the home route: it can
 * be judged without touching anything that currently ships, and either section
 * is a single import away from being dropped into Home (above <Footer />) once
 * the direction is settled.
 */
export default function PaperLab() {
  const intro = useRef(null);

  useGSAP(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const lines = gsap.utils.toArray('.pl-line');
    const strokes = gsap.utils.toArray('.pl-underline path');

    if (reduce) {
      gsap.set(lines, { opacity: 1, y: 0 });
      gsap.set(strokes, { strokeDashoffset: 0, opacity: 1 });
      return;
    }

    const tl = gsap.timeline({ defaults: { force3D: true } });

    // Headline lines drop in on 4 frames each, a beat apart.
    tl.fromTo(lines,
      { opacity: 0, y: 26 },
      { opacity: 1, y: 0, duration: 0.3, stagger: 0.12, ease: 'steps(4)' }
    );

    // Then the pen goes over it. strokeDashoffset with a stepped ease is the
    // whole trick: the line appears in chunks, exactly like a stroke being
    // inked one drawn frame at a time.
    strokes.forEach((p, i) => {
      const len = p.getTotalLength();
      gsap.set(p, { strokeDasharray: len, strokeDashoffset: len, opacity: 1 });
      tl.to(p,
        { strokeDashoffset: 0, duration: 0.34, ease: 'steps(7)' },
        i === 0 ? '-=0.05' : '-=0.22'
      );
    });
  }, { scope: intro });

  useEffect(() => {
    const prev = document.title;
    document.title = 'Paper Lab — Wasiq Tanveer';
    // This page is a design prototype, not content anyone should land on from
    // search — keep it out of the index while it is being reviewed.
    const meta = document.createElement('meta');
    meta.name = 'robots';
    meta.content = 'noindex, nofollow';
    document.head.appendChild(meta);

    // Lets paper.css hide the app-shell cursor so <PaperCursor> can stand in
    // for it. Cleared on unmount, so no other route is affected.
    document.body.dataset.paper = '1';

    return () => {
      document.title = prev;
      meta.remove();
      delete document.body.dataset.paper;
    };
  }, []);

  return (
    <div className="paper-lab min-h-screen bg-[var(--ink)]">

      {/* Stands in for the app shell's cursor while this route is mounted. */}
      <PaperCursor />

      {/* The hero carries its own masthead (logo + nav), so there is no
          separate page header — a second nav above it would just be a
          duplicate. Back-to-main lives in the strip below the hero. */}
      <PaperHero />

      <div ref={intro} className="mx-auto w-full max-w-[1180px] px-5 pb-4 pt-[90px] md:px-8 md:pt-[120px]">
        <div className="mb-9 flex flex-wrap items-center justify-between gap-4">
          <Link
            to="/"
            onClick={() => window.__lenis?.scrollTo(0, { immediate: true })}
            onMouseEnter={() => hover(true)}
            onMouseLeave={() => hover(false)}
            className="font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--grey)] transition-colors hover:text-[var(--spot)]"
            style={{ cursor: 'none' }}
          >
            ← Back to Main
          </Link>
          <SteppedType
            text="[ PAPER LAB — PROTOTYPE ]"
            className="font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--grey)]"
          />
        </div>

        <h1 className="font-hero text-[clamp(30px,5vw,58px)] font-black leading-[1.05] tracking-[-0.03em] text-[var(--paper)]">
          <span className="pl-line block" style={{ opacity: 0 }}>Torn paper,</span>
          <span className="pl-line relative block w-fit text-[var(--spot-lift)]" style={{ opacity: 0 }}>
            shot on twos.
            {/* Two passes of a wobbly stroke, inked in steps once the words land. */}
            <svg
              aria-hidden="true"
              className="pl-underline pointer-events-none absolute left-0 w-full"
              style={{ top: '100%', height: '0.34em', overflow: 'visible' }}
              viewBox="0 0 500 28"
              preserveAspectRatio="none"
            >
              <path d={UNDERLINE_A} fill="none" stroke="var(--spot-lift)" strokeWidth="5" strokeLinecap="round" opacity="0" vectorEffect="non-scaling-stroke" />
              <path d={UNDERLINE_B} fill="none" stroke="var(--spot-lift)" strokeWidth="2.5" strokeLinecap="round" opacity="0" strokeOpacity="0.55" vectorEffect="non-scaling-stroke" />
            </svg>
          </span>
        </h1>
        <p className="mt-9 max-w-[58ch] font-body text-[14px] leading-[1.9] text-[var(--grey-light)] md:text-[15px]">
          Two takes on the same motion language: hand-cut edges that boil on a
          12&nbsp;fps flipbook, and movement that lands on discrete frames instead
          of easing between them. Section&nbsp;01 plays on a timeline when it
          scrolls into view; Section&nbsp;02 is driven by your scroll position,
          quantized to ten poses.
        </p>
        <p className="mt-4 max-w-[58ch] font-mono text-[10.5px] uppercase leading-[1.9] tracking-[0.18em] text-[var(--grey)] opacity-70">
          Both respect prefers-reduced-motion — with it on, everything resolves
          to its final frame and nothing loops.
        </p>
      </div>

      <PaperProcess />
      <PaperNote />
    </div>
  );
}
