import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

const handleHover = (hovered) =>
  window.dispatchEvent(new CustomEvent('cursor-hover', { detail: { hovered } }));

export default function WorkArchive() {
  const container = useRef();
  
  useGSAP(() => {
    gsap.fromTo('.archive-row', 
      { opacity: 0, y: 20 }, 
      { opacity: 1, y: 0, duration: 0.6, stagger: 0.05, ease: 'power3.out', delay: 0.2 }
    );
    gsap.fromTo('.archive-title', 
      { opacity: 0, y: 30 }, 
      { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' }
    );
  }, { scope: container });

  const projects = [
    { year: 2025, title: 'E-Commerce Platform', type: 'Full Stack', tech: ['Next.js', 'PostgreSQL', 'Stripe'], link: '#' },
    { year: 2024, title: 'Financial Dashboard', type: 'Frontend', tech: ['TypeScript', 'Recharts', 'WebSockets'], link: '#' },
    { year: 2024, title: 'Authentication Microservice', type: 'Backend', tech: ['Node.js', 'Redis', 'Docker'], link: '#' },
    { year: 2023, title: 'Real-time Chat App', type: 'Full Stack', tech: ['React', 'Socket.io', 'MongoDB'], link: '#' },
    { year: 2023, title: 'Weather Inference Engine', type: 'Core', tech: ['Python', 'TensorFlow', 'FastAPI'], link: '#' },
    { year: 2022, title: 'Portfolio v1', type: 'Design', tech: ['Vue.js', 'Tailwind', 'GSAP'], link: '#' },
  ];

  return (
    <div ref={container} className="min-h-screen bg-bg pt-8 pb-32 px-6 md:px-16" id="work-page">
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
          <div key={i} className="archive-row grid grid-cols-1 md:grid-cols-[100px_4fr_2fr_3fr_100px] gap-2 md:gap-4 py-6 md:py-8 border-b border-border hover:bg-[rgba(57,255,20,0.02)] transition-colors group">
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
