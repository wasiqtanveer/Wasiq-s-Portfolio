import React, { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Link } from 'react-router-dom';
import useScrollReveal from '../hooks/useScrollReveal';

gsap.registerPlugin(ScrollTrigger);

const projectsData = [
  {
    id: '01',
    title: 'Ads Acceleration',
    description: 'A premium marketing engine for high-performance ad management and analytics tracking.',
    tags: ['Next.js', 'Marketing Tech', 'Analytics'],
    initials: 'AA',
    url: 'https://adsacceleration.com'
  },
  {
    id: '02',
    title: 'Library Management System',
    description: 'A complete inventory and archival system built for school libraries to manage books and memberships.',
    tags: ['React', 'Database', 'CRUD'],
    initials: 'LM',
    url: 'https://wasiqtanveer.github.io/Library-Management-System-V-1.0/'
  },
  {
    id: '03',
    title: 'CR Attendance App',
    description: 'Mobile-first attendance tracking system for class representatives to manage students efficiently.',
    tags: ['React', 'Mobile UI', 'Production'],
    initials: 'CR',
    url: 'https://wasiqtanveer.github.io/CR-Attendance-App-V1.0-/'
  }
];

// Helper to manually split text for char-by-char animation
const splitTextToChars = (text) => {
  return text.split('').map((char, i) => (
    <span key={i} className="inline-block translate-y-[80px] opacity-0 char-elem">
      {char === ' ' ? '\u00A0' : char}
    </span>
  ));
};

export default function Projects() {
  const container = useRef();
  
  useScrollReveal(container);

  const handleHoverGlobal = (hovered) => {
    window.dispatchEvent(new CustomEvent('cursor-hover', { detail: { hovered } }));
  };

  useGSAP(() => {
    // 1. Headline Char Stagger
    ScrollTrigger.create({
      trigger: container.current,
      start: "top 85%",
      onEnter: () => {
        gsap.to('.char-elem', {
          y: 0,
          opacity: 1,
          duration: 0.8,
          stagger: 0.03,
          ease: 'power3.out',
          overwrite: 'auto'
        });
      }
    });

    // 2. Project Cards Scroll Animation (Unique individually triggered stacks)
    const cards = gsap.utils.toArray('.project-card');
    cards.forEach((card) => {
      // 1. Parent card slides up
      gsap.fromTo(card,
        { y: 60, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: card,
            start: "top 85%",
          }
        }
      );

      // 2. Inner staggered content delay-triggered
      const staggers = card.querySelectorAll('.stagger-link');
      gsap.fromTo(staggers,
        { y: 20, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          stagger: 0.08,
          delay: 0.2, // exactly mapped delay bounds per requirement
          ease: 'power3.out',
          scrollTrigger: {
            trigger: card,
            start: "top 85%"
          }
        }
      );
    });
  }, { scope: container });

  const handleMouseEnterCard = (e) => {
    const card = e.currentTarget;
    const title = card.querySelector('.project-title');
    const tBorder = card.querySelector('.left-green-border');

    // Left green border scaleY 0 -> 1
    gsap.to(tBorder, { scaleY: 1, duration: 0.4, ease: 'power2.out', overwrite: 'auto' });

    // Glitch animation on Title (One sequence strictly defined, overwrites required if re-hovered)
    const tl = gsap.timeline({ overwrite: 'auto' });
    tl.to(title, { x: 3, color: '#39FF14', duration: 0.05 })
      .to(title, { x: -2, duration: 0.05 })
      .to(title, { x: 1, color: '#39FF14', duration: 0.04 })
      .to(title, { x: 0, color: '#E8E4DC', duration: 0.05 });
  };

  const handleMouseLeaveCard = (e) => {
    const card = e.currentTarget;
    const title = card.querySelector('.project-title');
    const tBorder = card.querySelector('.left-green-border');

    gsap.to(tBorder, { scaleY: 0, duration: 0.4, ease: 'power2.inOut', overwrite: 'auto' });
    gsap.set(title, { x: 0, color: '#E8E4DC' });
  };

  return (
    <section ref={container} className="relative w-full border-t border-border bg-bg overflow-hidden" id="projects">
      
      {/* Header Area */}
      <div className="px-6 md:px-16 pt-[80px] md:pt-[140px] pb-12 md:pb-16">
        <div className="flex justify-between items-center w-full mb-8">
          <div className="font-mono text-[11px] text-muted tracking-[0.2em] uppercase">
            [ 02 — WORK ]
          </div>
          <div className="relative group cursor-none inline-block">
            <Link 
              to="/work"
              className="font-mono text-[11px] text-green uppercase no-underline transition-colors block"
              onMouseEnter={() => handleHoverGlobal(true)}
              onMouseLeave={() => handleHoverGlobal(false)}
            >
              View All →
            </Link>
            <div className="absolute left-0 bottom-[-2px] w-full h-[1px] bg-green origin-left scale-x-0 transition-transform duration-300 ease-out group-hover:scale-x-100" />
          </div>
        </div>
        
        <h2 className="font-hero font-black text-[clamp(40px,7vw,80px)] leading-[1.1] text-text m-0 overflow-hidden">
          <div className="overflow-hidden leading-[1.1]">{splitTextToChars('Selected')}</div>
          <div className="overflow-hidden leading-[1.1] text-green">{splitTextToChars('Projects.')}</div>
        </h2>
      </div>

      {/* Projects Container */}
      <div className="px-6 md:px-16 pb-[80px] md:pb-[140px] flex flex-col gap-16 md:gap-24">
        {projectsData.map((project, index) => {
          const isEven = index % 2 !== 0;

          return (
            <div 
              key={project.id}
              className="project-card relative w-full bg-surface border border-border p-[48px] md:p-[48px_56px] rounded-none group transition-colors duration-300 hover:bg-[#131311] flex flex-col md:flex-row items-stretch gap-12 md:gap-[64px]"
              onMouseEnter={handleMouseEnterCard}
              onMouseLeave={handleMouseLeaveCard}
            >
              {/* Target for GSAP scaleY border animation */}
              <div className="left-green-border absolute left-0 top-0 bottom-0 w-[2px] bg-green origin-top scale-y-0" />

              {/* Content Side */}
              <div className={`flex flex-col justify-center w-full md:w-1/2 order-2 md:mb-0 ${isEven ? 'md:order-2' : 'md:order-1'}`}>
                
                <div className="stagger-link font-mono text-[11px] text-green tracking-[0.2em] mb-5">
                  {project.id}
                </div>
                
                <h3 className="stagger-link project-title font-hero font-bold text-[22px] md:text-[28px] text-text mb-3">
                  {project.title}
                </h3>
                
                <p className="stagger-link font-body text-[13px] md:text-[14px] text-muted max-w-[380px] mb-7 leading-[1.8]">
                  {project.description}
                </p>
                
                <div className="stagger-link flex flex-wrap gap-2 mb-9">
                  {project.tags.map(tag => (
                    <span key={tag} className="bg-[rgba(57,255,20,0.05)] border border-[rgba(57,255,20,0.15)] text-green font-mono text-[10px] uppercase tracking-widest px-3 py-1 will-change-[transform,opacity]">
                      {tag}
                    </span>
                  ))}
                </div>
                
                <div className="stagger-link flex gap-4 mt-auto">
                  <a 
                    href={project.url} 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-[11px] text-[#4a4a42] border border-border px-[22px] py-[10px] transition-all duration-200 hover:border-green hover:text-green"
                    onMouseEnter={() => handleHoverGlobal(true)}
                    onMouseLeave={() => handleHoverGlobal(false)}
                  >
                    Live Site ↗
                  </a>
                </div>
              </div>

              {/* Image Side (Hidden on Mobile) */}
              <div className={`hidden md:flex w-full md:w-1/2 aspect-[16/9] bg-[#0d0d0b] border border-border items-center justify-center transition-colors duration-300 group-hover:bg-[#131311] group-hover:border-[rgba(57,255,20,0.12)] order-1 md:mb-0 ${isEven ? 'md:order-1' : 'md:order-2'}`}>
                <div className="font-hero text-[64px] text-[#161614] group-hover:text-[rgba(57,255,20,0.06)] transition-colors duration-300 select-none">
                  {project.initials}
                </div>
              </div>

            </div>
          );
        })}
      </div>

      {/* Bottom Bar */}
      <div className="w-full border-t border-border px-6 md:px-[56px] py-[28px] flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="font-body text-[14px] text-muted gs-reveal" style={{ opacity: 0 }}>
          Looking for more? View the complete archive.
        </div>
        <Link 
          to="/work"
          className="font-mono text-[11px] text-muted border border-border px-6 py-3 transition-colors duration-200 hover:border-green hover:text-green gs-reveal"
          onMouseEnter={() => handleHoverGlobal(true)}
          onMouseLeave={() => handleHoverGlobal(false)}
          style={{ opacity: 0 }}
        >
          View All Work →
        </Link>
      </div>

    </section>
  );
}
