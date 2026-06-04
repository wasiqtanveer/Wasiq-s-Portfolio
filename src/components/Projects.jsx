import React, { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Link } from 'react-router-dom';
import useScrollReveal from '../hooks/useScrollReveal';
import useTilt from '../hooks/useTilt';

gsap.registerPlugin(ScrollTrigger);

const handleHoverGlobal = (hovered) => {
  window.dispatchEvent(new CustomEvent('cursor-hover', { detail: { hovered } }));
};

const projectsData = [
  {
    id: '01',
    title: 'Ads Acceleration',
    description: 'An Amazon PPC ad agency website. I built custom tools embedded directly into the site to power their ad management and analytics workflows.',
    tags: ['React', 'CSS', 'GSAP', 'Node'],
    initials: 'AA',
    url: 'https://adsacceleration.com',
    image: '/projects/ads%20acceleration.jpg'
  },
  {
    id: '02',
    title: 'CR Attendance App',
    description: 'An attendance app that class representatives use to manage their class attendance. Built for personal utility, then scaled into a full production tool.',
    tags: ['React', 'CSS', 'Framer Motion', 'Supabase'],
    initials: 'CR',
    url: 'https://crattendanceapp.vercel.app/login',
    image: '/projects/CR%20attendance%20app.jpg'
  },
  {
    id: '03',
    title: 'Paper Vault',
    description: 'A platform where students upload academic material so others can benefit from it. Built to solve an obvious, real need among students.',
    tags: ['React', 'Framer Motion', 'Supabase', 'Cloudflare R2'],
    initials: 'PV',
    url: 'https://paper-vault-ivory.vercel.app/',
    image: '/projects/Paper%20Vault.jpg'
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

const handleMouseEnterCard = (e) => {
  const card = e.currentTarget;
  const title = card.querySelector('.project-title');
  const tBorder = card.querySelector('.left-green-border');

  gsap.to(tBorder, { scaleY: 1, duration: 0.4, ease: 'power2.out', overwrite: 'auto' });

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

function ProjectCard({ project, isEven }) {
  const tiltRef = useTilt({ max: 6, scale: 1.015 });

  return (
    // perspective → tilt wrapper → card. The tilt (rotation/scale) lives on the
    // wrapper while the scroll-reveal tween animates `.project-card` (y/opacity).
    // They MUST be separate elements: GSAP caches transform state per element,
    // and the persistent ScrollTrigger reveal tween on the card was colliding
    // with the tilt's transform writes — which is why the tilt died after the
    // first hover. Separate elements = separate caches = works every time.
    <div className="[perspective:1400px]">
      <div ref={tiltRef} className="tilt-wrap" style={{ transformStyle: 'preserve-3d' }}>
      <div
        className="project-card relative w-full bg-surface border border-border p-[48px] md:p-[48px_56px] rounded-none group transition-colors duration-300 hover:bg-[rgba(34,32,28,0.82)] hover:border-[rgba(57,255,20,0.18)] flex flex-col md:flex-row items-stretch gap-12 md:gap-[64px]"
        style={{ transformStyle: 'preserve-3d' }}
        onMouseEnter={handleMouseEnterCard}
        onMouseLeave={handleMouseLeaveCard}
      >
        {/* Target for GSAP scaleY border animation */}
        <div className="left-green-border absolute left-0 top-0 bottom-0 w-[2px] bg-green origin-top scale-y-0" />

        {/* Content Side — lifted slightly in 3D */}
        <div
          className={`flex flex-col justify-center w-full md:w-1/2 order-2 md:mb-0 ${isEven ? 'md:order-2' : 'md:order-1'}`}
          style={{ transform: 'translateZ(30px)' }}
        >
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
              <span key={tag} className="bg-[rgba(57,255,20,0.05)] border border-[rgba(57,255,20,0.15)] text-green font-mono text-[10px] uppercase tracking-widest px-3 py-1">
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

        {/* Image Side — pops further forward in 3D (hidden on mobile) */}
        <div
          className={`hidden md:flex relative overflow-hidden w-full md:w-1/2 aspect-[16/9] bg-[rgba(255,255,255,0.02)] border border-border items-center justify-center transition-colors duration-300 group-hover:bg-[rgba(255,255,255,0.04)] group-hover:border-[rgba(57,255,20,0.12)] order-1 md:mb-0 ${isEven ? 'md:order-1' : 'md:order-2'}`}
          style={{ transform: 'translateZ(55px)' }}
        >
          {project.image ? (
            <img
              src={project.image}
              alt={project.title}
              loading="lazy"
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.04]"
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
          ) : (
            <div className="font-hero text-[64px] text-[#161614] group-hover:text-[rgba(57,255,20,0.06)] transition-colors duration-300 select-none">
              {project.initials}
            </div>
          )}
        </div>
      </div>
      </div>
    </div>
  );
}

export default function Projects() {
  const container = useRef();

  useScrollReveal(container);

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

  return (
    <section ref={container} className="relative w-full border-t border-border bg-transparent overflow-hidden" id="projects">
      
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
        {projectsData.map((project, index) => (
          <ProjectCard key={project.id} project={project} isEven={index % 2 !== 0} />
        ))}
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
