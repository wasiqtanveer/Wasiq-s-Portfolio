import React, { useRef, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

const handleHover = (hovered) =>
  window.dispatchEvent(new CustomEvent('cursor-hover', { detail: { hovered } }));

// Cached AudioContext (reused across hovers to avoid leaks)
let globalAudioCtx = null;
const playTick = () => {
  if (typeof window === 'undefined') return;
  try {
    if (!globalAudioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      globalAudioCtx = new AudioContext();
    }
    const ctx = globalAudioCtx;
    if (ctx.state === 'suspended') ctx.resume();

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    // Short, dry click — high freq, very fast decay = a crisp "tick"
    osc.type = 'square';
    osc.frequency.setValueAtTime(1800, ctx.currentTime);
    gain.gain.setValueAtTime(0.05, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.025);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.03);
  } catch { /* autoplay blocked until first user gesture */ }
};

export default function WorkArchive() {
  // Per-route SEO: unique title while on /work, restored on unmount
  useEffect(() => {
    const prevTitle = document.title;
    document.title = 'All Projects — Wasiq Tanveer';
    return () => { document.title = prevTitle; };
  }, []);

  const container = useRef();
  const previewRef = useRef();
  const previewImgRef = useRef();
  const xTo = useRef(null);
  const yTo = useRef(null);
  const [activeImage, setActiveImage] = useState(null);
  // Index of the currently expanded row; only one open at a time.
  const [openRow, setOpenRow] = useState(null);

  const toggleRow = (i) => {
    playTick();
    setOpenRow((cur) => (cur === i ? null : i));
  };

  useGSAP(() => {
    gsap.fromTo('.archive-row',
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.6, stagger: 0.05, ease: 'power3.out', delay: 0.2 }
    );
    gsap.fromTo('.archive-title',
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' }
    );

    // Snappy quickTo movers for the floating preview. Shorter duration + a
    // tight ease so the card tracks the cursor almost 1:1 but still glides.
    xTo.current = gsap.quickTo(previewRef.current, 'x', { duration: 0.28, ease: 'power2.out' });
    yTo.current = gsap.quickTo(previewRef.current, 'y', { duration: 0.28, ease: 'power2.out' });
  }, { scope: container });

  const projects = [
    {
      year: 2025, title: 'Ads Acceleration', type: 'Full Stack', tech: ['React', 'CSS', 'GSAP', 'Node'], link: 'https://adsacceleration.com', image: '/projects/ads%20acceleration.jpg',
      tagline: 'An Amazon PPC agency site with custom ad-management tools built directly into it.',
      detail: 'A production marketing site for an Amazon PPC ad agency, with bespoke tools embedded into the site to power their ad management and analytics workflows.',
      highlights: ['Custom in-site tooling', 'Ad management workflows', 'GSAP-driven motion', 'Node backend'],
    },
    {
      year: 2025, title: 'Paper Vault', type: 'Full Stack', tech: ['React', 'Framer Motion', 'Supabase', 'Cloudflare R2'], link: 'https://paper-vault-ivory.vercel.app/', image: '/projects/Paper%20Vault.jpg',
      tagline: 'A platform where students upload academic material so others can benefit from it.',
      detail: 'Built to solve a real need among students — a shared library for uploading and discovering academic material, with file storage on Cloudflare R2 and auth/data on Supabase.',
      highlights: ['File uploads to Cloudflare R2', 'Supabase auth & database', 'Student-driven content', 'Framer Motion UI'],
    },
    {
      year: 2024, title: 'CR Attendance App', type: 'Full Stack', tech: ['React', 'CSS', 'Framer Motion', 'Supabase'], link: 'https://crattendanceapp.vercel.app/login', image: '/projects/CR%20attendance%20app.jpg',
      tagline: 'An attendance app class reps use to manage their class attendance.',
      detail: 'Started as a personal utility, then scaled into a full production tool that class representatives use to record and manage attendance for their classes.',
      highlights: ['Built for real daily use', 'Scaled from utility to product', 'Supabase backend', 'Framer Motion UI'],
    },
    {
      year: 2025, title: 'Amazon SQP Intelligence Dashboard', type: 'Tooling', tech: ['JavaScript', 'Shadow DOM', 'Chart.js', 'Supabase'], link: 'https://github.com/wasiqtanveer',
      tagline: "Rebuilds Amazon's clunky Search Query report into a fast, interactive share-of-market dashboard.",
      detail: "Amazon's native Search Query Performance page is slow and locked to a single period view. This tool scrapes the report automatically and rebuilds it into an interactive dashboard that splits every keyword into total market vs. your ASIN's share.",
      highlights: ['Scrapes shadow-DOM web components', 'Market vs. ASIN share analysis', 'Period-over-period trends', 'One-click CSV export'],
    },
    {
      year: 2025, title: 'Placement & Ad Group History Chart', type: 'Tooling', tech: ['JavaScript', 'Chart.js', 'Amazon Ads API'], link: 'https://github.com/wasiqtanveer', image: '/projects/Adgroup%20chart.jpg',
      tagline: "Injects a historical performance chart into Amazon Ads that the platform doesn't provide.",
      detail: "A tool injected directly into Amazon Ads Campaign Manager that adds an ad-group-level history graph with change-event markers — letting you correlate performance shifts with the bid/placement edits that caused them.",
      highlights: ['9 toggleable metrics on one graph', 'Change-event markers on the timeline', 'Inline placement-bid badges', 'Token-sniffing auth bridge'],
    },
    {
      year: 2025, title: 'WhatsApp Group Moderation Bot', type: 'Automation', tech: ['Node.js', 'whatsapp-web.js', 'dotenv'], link: 'https://github.com/wasiqtanveer', image: '/projects/whats%20app%20bot.jpeg',
      tagline: 'Auto-moderates groups with a pluggable rule engine and a progressive strike system.',
      detail: 'A WhatsApp group moderation bot that monitors messages in real time, enforces configurable rules, and applies progressive discipline — warnings, strikes, then automatic removal — with no admin online 24/7.',
      highlights: ['Real-time message monitoring', 'Warnings → strikes → auto-kick', 'Admin immunity', 'Session persistence across restarts'],
    },
    {
      year: 2025, title: 'Amazon BSR Tracker — Slack', type: 'Automation', tech: ['Python', 'Keepa API', 'GitHub Actions', 'Slack'], link: 'https://github.com/wasiqtanveer', image: '/projects/slack%20bsr.png',
      tagline: 'Pushes a daily Amazon rank report to Slack — serverless, no database.',
      detail: "Every morning it pulls a product's Best Sellers Rank via the Keepa API, diffs it against yesterday's snapshot, and posts a formatted trend report to Slack. Runs on a GitHub Actions cron with a committed JSON file as its state store.",
      highlights: ['Keepa API rank data', 'Day-over-day trend arrows', 'GitHub Actions cron scheduling', 'JSON file as a database'],
    },
    {
      year: 2025, title: 'Amazon BSR Tracker — Sheets Dashboard', type: 'Automation', tech: ['Python', 'Keepa API', 'gspread', 'GitHub Actions'], link: 'https://github.com/wasiqtanveer',
      tagline: 'Logs Amazon metrics into a visual Google Sheets dashboard every day.',
      detail: 'A multi-client version that writes BSR, rating, reviews, and Buy Box status into a formatted Google Sheet — one worksheet per marketplace, a new dated column each day, and embedded product images. Detects listing hijackers automatically.',
      highlights: ['Buy Box hijacker detection', 'Embedded product images in-sheet', 'Running daily history columns', 'Multi-marketplace, multi-client'],
    },
    {
      year: 2024, title: 'Library Management System', type: 'Frontend', tech: ['React', 'Database', 'CRUD'], link: 'https://wasiqtanveer.github.io/Library-Management-System-V-1.0/',
      tagline: 'A CRUD library management interface for tracking books and records.',
      detail: 'An early React project implementing full create/read/update/delete flows over a book catalogue — a foundation for learning state management and data modelling.',
      highlights: ['Full CRUD operations', 'React state management', 'Catalogue data modelling'],
    },
  ];

  // Track the pointer so the preview floats next to the cursor. Coalesced into
  // one rAF flush per frame so rapid mousemove bursts never queue extra work.
  const ptr = useRef({ x: 0, y: 0 });
  const moveRaf = useRef(0);

  const flushMove = () => {
    moveRaf.current = 0;
    if (!xTo.current) return;
    // Offset so the card sits to the upper-right of the cursor
    xTo.current(ptr.current.x + 24);
    yTo.current(ptr.current.y - 80);
  };

  const handleMouseMove = (e) => {
    ptr.current.x = e.clientX;
    ptr.current.y = e.clientY;
    if (!moveRaf.current) moveRaf.current = requestAnimationFrame(flushMove);
  };

  useEffect(() => () => { if (moveRaf.current) cancelAnimationFrame(moveRaf.current); }, []);

  const handleRowEnter = (project) => {
    handleHover(true);
    playTick();
    if (!project.image) return;
    setActiveImage(project.image);
    // Snap the preview to the cursor immediately so it never flies in from a
    // stale position, then pop it in tight.
    if (xTo.current) { xTo.current(ptr.current.x + 24); yTo.current(ptr.current.y - 80); }
    gsap.to(previewRef.current, {
      autoAlpha: 1,
      scale: 1,
      duration: 0.25,
      ease: 'power3.out',
      overwrite: 'auto',
    });
  };

  const handleRowLeave = () => {
    handleHover(false);
    gsap.to(previewRef.current, {
      autoAlpha: 0,
      scale: 0.92,
      duration: 0.22,
      ease: 'power2.out',
      overwrite: 'auto',
    });
  };

  return (
    <div
      ref={container}
      className="min-h-screen bg-transparent pt-8 pb-32 px-6 md:px-16"
      id="work-page"
      onMouseMove={handleMouseMove}
    >
      {/* Floating cursor-following preview (desktop only) */}
      <div
        ref={previewRef}
        className="pointer-events-none fixed top-0 left-0 z-[60] hidden md:block w-[280px] aspect-[16/10] rounded-md overflow-hidden border border-[rgba(57,255,20,0.25)] bg-surface shadow-[0_20px_60px_-10px_rgba(0,0,0,0.7)]"
        style={{ opacity: 0, visibility: 'hidden', transform: 'scale(0.92)', willChange: 'transform, opacity' }}
      >
        {activeImage && (
          <img
            ref={previewImgRef}
            src={activeImage}
            alt="Project preview"
            className="w-full h-full object-cover"
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
        )}
        {/* Subtle scanline / glow overlay to match the cyberpunk theme */}
        <div className="absolute inset-0 bg-gradient-to-tr from-[rgba(57,255,20,0.06)] to-transparent" />
      </div>

      <div className="flex justify-between items-center mb-[100px] md:mb-[160px] archive-title mt-4">
        <Link
          to="/"
          onClick={() => { if(window.__lenis) window.__lenis.scrollTo(0, {immediate: true}) }}
          className="font-mono text-[11px] text-muted tracking-widest uppercase hover:text-green transition-colors cursor-none"
          onMouseEnter={() => handleHover(true)}
          onMouseLeave={() => handleHover(false)}
        >
          ← Back to Main
        </Link>
        <span className="font-mono text-[11px] text-muted tracking-widest uppercase">[ WORK ARCHIVE ]</span>
      </div>

      <h1 className="font-hero font-black text-[clamp(40px,6vw,80px)] text-text mb-16 archive-title">All Projects.</h1>

      <div className="w-full border-t border-border">
        {/* Table Header */}
        <div className="hidden md:grid grid-cols-[100px_4fr_2fr_3fr_100px] gap-4 py-4 border-b border-border font-mono text-[10px] text-muted uppercase tracking-widest">
          <span>Year</span>
          <span>Project</span>
          <span>Role</span>
          <span>Tech Stack</span>
          <span className="text-right">Link</span>
        </div>

        {/* Table Body */}
        {projects.map((p, i) => {
          const isOpen = openRow === i;
          return (
          <div className={`archive-row border-b border-border transition-all duration-500 ${isOpen ? 'bg-[rgba(57,255,20,0.035)] border-l-2 border-l-green shadow-[inset_0_0_40px_-20px_rgba(57,255,20,0.4)]' : 'border-l-2 border-l-transparent'}`} key={i}>
            {/* Original row — now the click target for expand */}
            <div
              role="button"
              tabIndex={0}
              aria-expanded={isOpen}
              onClick={() => toggleRow(i)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleRow(i); } }}
              className={`grid grid-cols-1 md:grid-cols-[100px_4fr_2fr_3fr_100px] gap-2 md:gap-4 py-6 md:py-8 px-0 md:px-6 transition-colors group cursor-none ${isOpen ? '' : 'hover:bg-[rgba(57,255,20,0.02)]'}`}
              onMouseEnter={() => handleRowEnter(p)}
              onMouseLeave={handleRowLeave}
            >
              <div className={`font-mono text-[12px] md:mt-1 transition-colors ${isOpen ? 'text-green' : 'text-[#565656]'}`}>{p.year}</div>
              <div className={`font-hero font-bold text-[18px] md:text-[20px] transition-colors flex items-baseline gap-3 ${isOpen ? 'text-green' : 'text-text group-hover:text-green'}`}>
                {p.title}
                {/* Subtle hint — fades in on hover, hides once open */}
                <span className={`font-mono text-[10px] tracking-widest uppercase text-green/50 transition-opacity duration-300 ${isOpen ? 'opacity-0' : 'opacity-0 group-hover:opacity-100'}`}>
                  click to expand
                </span>
              </div>
              <div className="font-body text-[14px] text-muted md:mt-1">{p.type}</div>
              <div className="font-mono text-[11px] text-muted flex items-center md:items-start pt-1 gap-x-2 flex-wrap">
                {p.tech.map((t, idx) => (
                  <span key={t}>
                    {t}{idx < p.tech.length - 1 && <span className="text-[#2e2e2e] ml-2">·</span>}
                  </span>
                ))}
              </div>
              <div className="md:text-right mt-4 md:mt-1">
                <a
                  href={p.link}
                  target="_blank"
                  rel="noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="font-mono text-[11px] text-muted hover:text-green transition-colors inline-flex items-center gap-1 cursor-none"
                  onMouseEnter={() => handleHover(true)}
                  onMouseLeave={() => handleHover(false)}
                >
                  Visit ↗
                </a>
              </div>
            </div>

            {/* Expandable detail panel — single-open accordion */}
            <div
              className="grid transition-[grid-template-rows] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
              style={{ gridTemplateRows: isOpen ? '1fr' : '0fr' }}
            >
              <div className="overflow-hidden">
                <div className={`md:pl-[124px] md:pr-6 pb-10 transition-all duration-500 ${isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-1'}`}>
                  <div className="border-l border-[rgba(57,255,20,0.25)] pl-6">
                    <p className="font-body text-[14px] text-text/75 leading-[1.85] max-w-[620px] mb-6">{p.detail}</p>
                    {p.highlights && (
                      <ul className="flex flex-wrap gap-x-8 gap-y-2.5">
                        {p.highlights.map((h) => (
                          <li key={h} className="font-mono text-[11px] text-muted flex items-center gap-2.5">
                            <span className="text-green/70 text-[9px]">●</span>{h}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
          );
        })}
      </div>
    </div>
  );
}
