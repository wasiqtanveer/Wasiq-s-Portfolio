import React, { useRef, useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import TornEdge from './TornEdge';
import SteppedType from './SteppedType';
import useSteppedTilt from './useSteppedTilt';
import { tornTileClip, tornRightClip } from './tornPath';
import photoAsset from '../../assets/unnamed - Edited.png';
import './paper.css';

const hover = (hovered) =>
  window.dispatchEvent(new CustomEvent('cursor-hover', { detail: { hovered } }));

// Same roles, same order, same marquee stack as the live hero — only the
// treatment changes.
const ROLES = [
  'Undergrad Student',
  'Full Stack Developer',
  'Automation Engineer',
  'Builds Tools That Work',
  'Open Source Contributor',
  'Turning Ideas Into Products',
  'Backend-First Thinker',
  'Ships Real Products',
];

const LONGEST_ROLE = ROLES.reduce((a, b) => (b.length > a.length ? b : a));

const STACK = [
  'React', 'Node.js', 'TypeScript', 'Python', 'AWS', 'PostgreSQL',
  'Docker', 'Git', 'Next.js', 'MongoDB', 'Redis', 'GraphQL',
];

const NAV = [
  { label: 'Work', href: '#projects' },
  { label: 'About', href: '#about' },
  { label: 'Contact', href: '#contact' },
];

/**
 * Cut-out letter tiles, ransom-note style.
 *
 * Every value here is derived from a hash of the letter's position, never from
 * Math.random(): the tiles must look scattered but land identically on every
 * render, or React would re-roll all of them on each state change and the whole
 * headline would twitch every time the role text ticks over.
 */
function tileSpecs(word, salt) {
  return [...word].map((ch, i) => {
    const h = (i * 2654435761 + salt * 40503) >>> 0;
    const r = (n) => ((h >>> n) & 0xff) / 255;
    return {
      ch,
      // Rotation stays under ±2.6° — cut-out type gets illegible fast, and the
      // scatter reads better from the uneven vertical offsets anyway.
      rot: (r(0) - 0.5) * 5.2,
      // Vertical scatter is in em, not px: a fixed pixel offset that looks
      // like a light scatter at 70px type is half a line-height at 36px, and
      // the two name rows collide on a phone.
      dy: (r(8) - 0.5) * 0.16,
      clip: tornTileClip(h % 100000, { depth: 5 }),
      tone: r(16) > 0.62 ? 'paper-sheet--hi' : '',
      // Negative delay desynchronises the shared jitter loop, so the tiles
      // never breathe in unison.
      delay: `-${(r(24) * 0.66).toFixed(2)}s`,
    };
  });
}

const FIRST = tileSpecs('Wasiq', 7);
const LAST = tileSpecs('Tanveer', 31);
const MASTHEAD_CLIP = tornRightClip(4519, { depth: 18, segments: 22 });
const CAPTION_CLIP = tornRightClip(8123, { depth: 12, segments: 14 });

export default function PaperHero() {
  const root = useRef(null);
  const roleRef = useRef(null);
  const [roleIdx, setRoleIdx] = useState(0);
  const board = useSteppedTilt({ max: 1.5, steps: 5 });
  const navigate = useNavigate();

  const goHome = (e, hash) => {
    e.preventDefault();
    navigate('/');
    // Home has to mount before the target section exists to scroll to.
    setTimeout(() => window.__lenis?.scrollTo(hash, { duration: 1.2 }), 120);
  };

  // ── Entrance ─────────────────────────────────────────────────────────────
  useGSAP(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const tiles = gsap.utils.toArray('.ph-tile');

    if (reduce) {
      gsap.set(['.ph-fade', ...tiles], { opacity: 1, y: 0, scale: 1 });
      return;
    }

    gsap.timeline({ defaults: { force3D: true } })
      .fromTo('.ph-masthead',
        { opacity: 0, y: -18 },
        { opacity: 1, y: 0, duration: 0.24, ease: 'steps(3)' }
      )
      // Letters get slapped down one at a time, each in 3 hard frames — the
      // pace of someone actually pasting them onto the board.
      .fromTo(tiles,
        { opacity: 0, scale: 1.35, y: -22 },
        { opacity: 1, scale: 1, y: 0, duration: 0.18, stagger: 0.055, ease: 'steps(3)' },
        0.16
      )
      .fromTo('.ph-fade',
        { opacity: 0, y: 16 },
        { opacity: 1, y: 0, duration: 0.26, stagger: 0.1, ease: 'steps(4)' },
        '>-0.15'
      );
  }, { scope: root });

  // ── Role cycling ─────────────────────────────────────────────────────────
  // Typed on with a stepped clip wipe, held, wiped off, then the next one.
  // Monospace means each step of the wipe lands exactly on one character.
  useEffect(() => {
    const el = roleRef.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      gsap.set(el, { clipPath: 'inset(0% 0% 0% 0%)' });
      return;
    }

    const text = ROLES[roleIdx];
    const tl = gsap.timeline();
    tl.fromTo(el,
      { clipPath: 'inset(0% 100% 0% 0%)' },
      {
        clipPath: 'inset(0% 0% 0% 0%)',
        duration: Math.max(0.25, text.length * 0.042),
        ease: `steps(${text.length})`,
      }
    )
      .to(el,
        { clipPath: 'inset(0% 0% 0% 100%)', duration: 0.22, ease: 'steps(6)' },
        '+=2.1'
      )
      .call(() => setRoleIdx((i) => (i + 1) % ROLES.length));

    return () => tl.kill();
  }, [roleIdx]);

  return (
    <section
      ref={root}
      className="paper-lab relative flex w-full items-center overflow-hidden bg-[var(--ink)] py-[70px] md:min-h-screen md:py-[96px]"
      aria-label="Introduction"
    >
      <div className="relative mx-auto w-full max-w-[1180px] px-5 md:px-8" style={{ perspective: '2200px' }}>
        <span aria-hidden="true" className="paper-cast" style={{ left: 24, right: 24, top: 40, bottom: 40 }} />

        {/* ── The board ─────────────────────────────────────────────────── */}
        <div
          ref={board}
          // pb clears the bottom tear: the torn edge is drawn INSIDE the sheet,
          // so without a gutter it slices straight through the marquee text.
          className="paper-sheet paper-sheet--board relative z-[1] px-5 pb-[32px] pt-[64px] md:px-12 md:pt-[76px]"
        >
          <TornEdge seed={2609} side="top" height={28} />
          <TornEdge seed={6871} side="bottom" height={28} />

          {/* Printer's registration marks — the detail that says "press sheet"
              rather than "web page". Static, four hairline crosses. */}
          {[
            { top: 34, left: 22 }, { top: 34, right: 22 },
            { bottom: 9, left: 22 }, { bottom: 9, right: 22 },
          ].map((pos, i) => (
            <svg key={i} aria-hidden="true" className="absolute z-[7] hidden md:block" style={{ ...pos, width: 15, height: 15 }} viewBox="0 0 15 15">
              <path d="M7.5 0v15M0 7.5h15" stroke="var(--spot-2-soft)" strokeWidth="0.9" opacity="0.65" />
              <circle cx="7.5" cy="7.5" r="3.4" fill="none" stroke="var(--spot-2-soft)" strokeWidth="0.9" opacity="0.65" />
            </svg>
          ))}

          {/* ── Masthead ─────────────────────────────────────────────────── */}
          <div
            className="ph-masthead paper-sheet--spot paper-strip-shadow relative z-[8] -mx-5 flex flex-wrap items-center justify-between gap-x-6 gap-y-3 py-3 pl-5 pr-9 md:-mx-12 md:pl-12"
            style={{ opacity: 0, clipPath: MASTHEAD_CLIP }}
          >
            <Link
              to="/"
              onClick={(e) => goHome(e, 0)}
              onMouseEnter={() => hover(true)}
              onMouseLeave={() => hover(false)}
              className="font-hero text-[19px] font-black leading-none tracking-[-0.03em] text-[var(--paper-hi)] no-underline"
              style={{ cursor: 'none' }}
              aria-label="Wasiq Tanveer — home"
            >
              WT<span className="opacity-45">.</span>
            </Link>

            <nav aria-label="Main navigation" className="flex items-center gap-5 md:gap-8">
              {NAV.map((l) => (
                <Link
                  key={l.label}
                  to="/"
                  onClick={(e) => goHome(e, l.href)}
                  onMouseEnter={() => hover(true)}
                  onMouseLeave={() => hover(false)}
                  className="font-mono text-[10px] uppercase tracking-[0.2em] no-underline decoration-2 underline-offset-4 hover:underline"
                  style={{ cursor: 'none' }}
                >
                  {l.label}
                </Link>
              ))}
            </nav>

            <span className="font-mono text-[10px] uppercase tracking-[0.24em] opacity-80">
              [ Portfolio 2025 ]
            </span>
          </div>

          {/* ── Body ─────────────────────────────────────────────────────── */}
          <div className="relative z-[7] grid grid-cols-1 items-center gap-10 pb-[62px] pt-10 md:grid-cols-[1.5fr_1fr] md:gap-12 md:pb-[64px] md:pt-11">

            {/* ── Left: cut-out name + role ──────────────────────────────── */}
            <div className="min-w-0">
              <SteppedType
                text="[ CUT & PASTED BY HAND ]"
                className="font-mono text-[9.5px] uppercase tracking-[0.3em] text-[var(--grey)]"
              />

              {/* Sized so the longest word ("Tanveer", 7 tiles) still fits the
                  column on one line — cut-out type that wraps mid-name stops
                  reading as a name at all. */}
              <h1 className="mt-6 font-hero text-[clamp(36px,5.9vw,70px)] font-black leading-none tracking-[-0.04em]">
                <span className="sr-only">Wasiq Tanveer</span>
                {[FIRST, LAST].map((word, w) => (
                  <span key={w} aria-hidden="true" className="mb-[0.32em] flex flex-wrap items-end gap-x-[0.07em] gap-y-2">
                    {word.map((t, i) => {
                      // The live hero splits the "i" of Wasiq green-over-white.
                      // Same idea, moved from the glyph to the scrap it is
                      // pasted on — the tile is spot ink down to 30%, paper below.
                      const isSplit = w === 0 && t.ch === 'i';
                      const isDark = w === 1 && i === 0;
                      return (
                        <span
                          key={`${w}-${i}`}
                          className={`ph-tile paper-jitter paper-sheet ${t.tone} inline-block px-[0.12em] pb-[0.09em] pt-[0.05em] ${isDark ? 'paper-sheet--dark' : ''}`}
                          style={{
                            opacity: 0,
                            clipPath: t.clip,
                            marginTop: `${t.dy.toFixed(3)}em`,
                            animationDelay: t.delay,
                            '--tilt': `${t.rot.toFixed(2)}deg`,
                            ...(isSplit && {
                              background:
                                'linear-gradient(to bottom, var(--spot) 0%, var(--spot) 30%, var(--paper-hi) 30%, var(--paper-hi) 100%)',
                            }),
                          }}
                        >
                          {t.ch}
                        </span>
                      );
                    })}
                  </span>
                ))}
              </h1>

              {/* Role — a label-maker strip with a live typewriter on it.
                  An invisible sizer holding the LONGEST role fixes the strip's
                  width: without it the black strip would resize every 2.3s as
                  the roles cycle, and the wipe would clip against a box that
                  flex had already shrunk below the text. */}
              <div className="ph-fade mt-7 inline-flex items-center gap-3 bg-[var(--ink)] px-4 py-2.5" style={{ opacity: 0 }}>
                <span aria-hidden="true" className="h-[9px] w-[9px] shrink-0 bg-[var(--spot-lift)]" />
                <span className="relative block shrink-0 whitespace-pre font-mono text-[10.5px] uppercase tracking-[0.16em] text-[var(--paper-hi)] md:text-[12.5px]">
                  <span aria-hidden="true" className="invisible">{LONGEST_ROLE}&nbsp;&nbsp;</span>
                  {/* The caret lives INSIDE the wiped span so it travels with
                      the last character. Parked outside it would sit at the end
                      of the reserved width — a blinking block floating in space
                      several words past the text. */}
                  <span
                    ref={roleRef}
                    className="absolute left-0 top-0 inline-flex items-baseline whitespace-pre"
                    style={{ clipPath: 'inset(0% 100% 0% 0%)' }}
                  >
                    {ROLES[roleIdx]}
                    <span aria-hidden="true" className="paper-caret ml-[0.4em] text-[var(--spot-lift)]" />
                  </span>
                </span>
              </div>

              <p className="ph-fade mt-7 max-w-[44ch] font-body text-[13.5px] leading-[1.85] text-[var(--ink-soft)] md:text-[14.5px]" style={{ opacity: 0 }}>
                Full-stack developer in Pakistan. I build web apps, Chrome
                extensions and automation that runs without anyone watching it.
              </p>

              <div className="ph-fade mt-7 flex flex-wrap gap-3" style={{ opacity: 0 }}>
                <a
                  href="/Wasiq_CV_v2.pdf"
                  download
                  onMouseEnter={() => hover(true)}
                  onMouseLeave={() => hover(false)}
                  className="paper-sheet--spot px-7 py-3 font-hero text-[11px] font-black uppercase tracking-[0.08em] no-underline"
                  style={{ cursor: 'none', clipPath: tornTileClip(661, { depth: 3 }) }}
                >
                  Download CV ↓
                </a>
                <Link
                  to="/"
                  onClick={(e) => goHome(e, '#projects')}
                  onMouseEnter={() => hover(true)}
                  onMouseLeave={() => hover(false)}
                  className="border-2 border-[var(--ink)] px-6 py-3 font-hero text-[11px] font-black uppercase tracking-[0.08em] text-[var(--ink)] no-underline"
                  style={{ cursor: 'none' }}
                >
                  View My Work →
                </Link>
              </div>
            </div>

            {/* ── Right: taped print + sticker ───────────────────────────── */}
            <div className="ph-fade relative mx-auto w-full max-w-[280px] md:ml-auto md:mr-0 md:max-w-[330px]" style={{ opacity: 0 }}>
              <div className="paper-jitter relative" style={{ '--tilt': '-3.2deg', animationDelay: '-0.31s' }}>
                {/* Photo print: paper border, contact-sheet caption, taped down */}
                <div className="paper-sheet paper-sheet--hi paper-shadow relative p-3 pb-0">
                  <div className="relative aspect-[3/4] w-full overflow-hidden bg-[var(--ink)]">
                    <img
                      src={photoAsset}
                      alt="Wasiq Tanveer"
                      loading="eager"
                      fetchpriority="high"
                      className="absolute inset-0 h-full w-full object-cover object-top"
                      style={{ filter: 'grayscale(1) contrast(1.06)' }}
                    />
                    {/* Two passes over the print so it belongs to the paper
                        world rather than sitting on top of it: a screen-angle
                        line halftone, then a wash of spot 2. The wash is what
                        makes it read as INK on a press sheet — a photo printed
                        in neutral black is the one thing on the board that
                        wouldn't have come off the same machine. */}
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-0 mix-blend-multiply"
                      style={{
                        background:
                          'repeating-linear-gradient(63deg, rgba(23,18,14,0.13) 0 1px, transparent 1px 3px)',
                      }}
                    />
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-0 mix-blend-color"
                      style={{ background: 'var(--spot)', opacity: 0.22 }}
                    />
                  </div>
                  <div className="flex items-baseline justify-between py-3">
                    <span className="font-mono text-[8.5px] uppercase tracking-[0.2em] text-[var(--grey)]">
                      WT / Portrait
                    </span>
                    <span className="font-mono text-[8.5px] uppercase tracking-[0.2em] text-[var(--grey)]">
                      Frame 01
                    </span>
                  </div>
                </div>

                <span className="paper-tape" style={{ width: 108, height: 30, top: -14, left: -22, transform: 'rotate(-31deg)', zIndex: 6 }} />
                <span className="paper-tape" style={{ width: 96, height: 28, bottom: 6, right: -20, transform: 'rotate(-28deg)', zIndex: 6 }} />
              </div>

              {/* Rotating sticker — 24 held positions per turn, not a sweep */}
              <a
                href="https://www.linkedin.com/in/wasiq-tanveer"
                target="_blank"
                rel="noopener noreferrer"
                onMouseEnter={() => hover(true)}
                onMouseLeave={() => hover(false)}
                aria-label="Open to work — connect on LinkedIn"
                className="absolute -bottom-10 -left-7 z-[9] block h-[104px] w-[104px] md:-bottom-14 md:-left-14 md:h-[124px] md:w-[124px]"
                style={{ cursor: 'none' }}
              >
                <span
                  className="paper-sheet--spot absolute inset-0 block rounded-full"
                  style={{ boxShadow: '0 8px 18px -6px rgba(0,0,0,0.8)' }}
                />
                <svg className="paper-spin-stepped absolute inset-0 h-full w-full" viewBox="0 0 130 130" aria-hidden="true">
                  <defs>
                    <path id="ph-badge-path" d="M 65,65 m -46,0 a 46,46 0 1,1 92,0 a 46,46 0 1,1 -92,0" />
                  </defs>
                  <text>
                    <textPath href="#ph-badge-path" startOffset="0%" className="font-mono text-[9.5px] uppercase tracking-[0.2em]" fill="var(--paper-hi)">
                      OPEN TO WORK · HIRE ME · LET&apos;S BUILD · &nbsp;
                    </textPath>
                  </text>
                </svg>
                <span className="absolute left-1/2 top-1/2 flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-[var(--ink)] text-[15px] leading-none text-[var(--spot-lift)]">
                  →
                </span>
              </a>

              {/* Margin note — keeps the prototype's own explanation on the board */}
              <div
                className="paper-jitter paper-sheet paper-sheet--hi paper-strip-shadow absolute -right-2 -top-8 hidden w-[164px] px-3 py-2.5 lg:block"
                style={{ '--tilt': '4.4deg', animationDelay: '-0.5s', clipPath: CAPTION_CLIP }}
              >
                <p className="font-mono text-[8.5px] uppercase leading-[1.7] tracking-[0.14em] text-[var(--ink-soft)]">
                  Everything on this page animates on twos — 12&nbsp;fps, no easing.
                </p>
              </div>
            </div>
          </div>

          {/* ── Stack marquee ────────────────────────────────────────────── */}
          <div className="relative -mx-5 overflow-hidden border-t-2 border-[rgba(11,11,11,0.14)] bg-[var(--paper)] py-3.5 md:-mx-12">
            <div className="paper-marquee-track inline-flex w-max whitespace-nowrap">
              {/* Two identical runs — the track travels exactly -50%, so the
                  seam always lands where the copies meet. */}
              {[0, 1].map((run) => (
                <span key={run} aria-hidden={run === 1} className="inline-flex">
                  {STACK.map((tech) => (
                    <span key={`${run}-${tech}`} className="inline-flex items-center">
                      <span className="px-6 font-mono text-[11px] uppercase tracking-[0.2em] text-[var(--ink-soft)]">
                        {tech}
                      </span>
                      <span className="text-[var(--spot-ink)]">◆</span>
                    </span>
                  ))}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
