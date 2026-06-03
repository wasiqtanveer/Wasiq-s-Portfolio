import React, { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

const handleHover = (hovered) =>
  window.dispatchEvent(new CustomEvent('cursor-hover', { detail: { hovered } }));

export default function WorkArchive() {
  const container = useRef();
  const previewRef = useRef();
  const previewImgRef = useRef();
  const xTo = useRef(null);
  const yTo = useRef(null);
  const [activeImage, setActiveImage] = useState(null);

  useGSAP(() => {
    gsap.fromTo('.archive-row',
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.6, stagger: 0.05, ease: 'power3.out', delay: 0.2 }
    );
    gsap.fromTo('.archive-title',
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' }
    );

    // Snappy quickTo movers for the floating preview
    xTo.current = gsap.quickTo(previewRef.current, 'x', { duration: 0.4, ease: 'power3.out' });
    yTo.current = gsap.quickTo(previewRef.current, 'y', { duration: 0.4, ease: 'power3.out' });
  }, { scope: container });

  const projects = [
    { year: 2025, title: 'Ads Acceleration', type: 'Full Stack', tech: ['React', 'CSS', 'GSAP', 'Node'], link: 'https://adsacceleration.com', image: '/projects/ads%20acceleration.jpg' },
    { year: 2025, title: 'Paper Vault', type: 'Full Stack', tech: ['React', 'Framer Motion', 'Supabase', 'Cloudflare R2'], link: 'https://paper-vault-ivory.vercel.app/', image: '/projects/Paper%20Vault.jpg' },
    { year: 2024, title: 'CR Attendance App', type: 'Full Stack', tech: ['React', 'CSS', 'Framer Motion', 'Supabase'], link: 'https://crattendanceapp.vercel.app/login', image: '/projects/CR%20attendance%20app.jpg' },
    { year: 2024, title: 'Library Management System', type: 'Frontend', tech: ['React', 'Database', 'CRUD'], link: 'https://wasiqtanveer.github.io/Library-Management-System-V-1.0/' },
  ];

  // Track the pointer so the preview floats next to the cursor
  const handleMouseMove = (e) => {
    if (!xTo.current) return;
    // Offset so the card sits to the upper-right of the cursor
    xTo.current(e.clientX + 24);
    yTo.current(e.clientY - 80);
  };

  const handleRowEnter = (project) => {
    handleHover(true);
    if (!project.image) return;
    setActiveImage(project.image);
    gsap.to(previewRef.current, {
      autoAlpha: 1,
      scale: 1,
      duration: 0.35,
      ease: 'power3.out',
      overwrite: 'auto',
    });
  };

  const handleRowLeave = () => {
    handleHover(false);
    gsap.to(previewRef.current, {
      autoAlpha: 0,
      scale: 0.92,
      duration: 0.3,
      ease: 'power2.inOut',
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
        {projects.map((p, i) => (
          <div
            key={i}
            className="archive-row grid grid-cols-1 md:grid-cols-[100px_4fr_2fr_3fr_100px] gap-2 md:gap-4 py-6 md:py-8 border-b border-border hover:bg-[rgba(57,255,20,0.02)] transition-colors group"
            onMouseEnter={() => handleRowEnter(p)}
            onMouseLeave={handleRowLeave}
          >
            <div className="font-mono text-[12px] text-[#4a4a42] md:mt-1">{p.year}</div>
            <div className="font-hero font-bold text-[18px] md:text-[20px] text-text group-hover:text-green transition-colors">{p.title}</div>
            <div className="font-body text-[14px] text-muted md:mt-1">{p.type}</div>
            <div className="font-mono text-[11px] text-muted flex items-center md:items-start pt-1 gap-x-2 flex-wrap">
              {p.tech.map((t, idx) => (
                <span key={t}>
                  {t}{idx < p.tech.length - 1 && <span className="text-[#2a2a22] ml-2">·</span>}
                </span>
              ))}
            </div>
            <div className="md:text-right mt-4 md:mt-1">
              <a
                href={p.link}
                target="_blank"
                rel="noreferrer"
                className="font-mono text-[11px] text-muted hover:text-green transition-colors inline-flex items-center gap-1 cursor-none"
                onMouseEnter={() => handleHover(true)}
                onMouseLeave={() => handleHover(false)}
              >
                Visit ↗
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
