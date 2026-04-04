import React, { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import useScrollReveal from '../hooks/useScrollReveal';

gsap.registerPlugin(ScrollTrigger);

const handleHover = (hovered) => {
  window.dispatchEvent(new CustomEvent('cursor-hover', { detail: { hovered } }));
};

export default function About() {
  const container = useRef();
  
  useScrollReveal(container);

  useGSAP(() => {
    // 1. Neon green vertical line height anim
    ScrollTrigger.create({
      trigger: container.current,
      start: "top 90%",
      end: "bottom 10%",
      scrub: 1.5,
      onUpdate: (self) => {
        gsap.set('.about-line', { scaleY: self.progress });
      }
    });

    // 2. Left column staggered fade + slide up
    gsap.from('.gs-reveal', {
      scrollTrigger: {
        trigger: container.current,
        start: 'top 75%'
      },
      y: 40,
      opacity: 0,
      duration: 0.8,
      stagger: 0.15,
      ease: 'power3.out'
    });

    // 3. Skill pills scale + fade
    gsap.from('.skill-pill', {
      scrollTrigger: {
        trigger: container.current,
        start: 'top 75%'
      },
      scale: 0.7,
      opacity: 0,
      duration: 0.6,
      stagger: 0.04,
      ease: 'back.out(1.5)'
    });

    // 4. Stat counters count up
    ScrollTrigger.create({
      trigger: container.current,
      start: 'top 75%',
      once: true,
      onEnter: () => {
        const counters = document.querySelectorAll('.counter');
        counters.forEach(counter => {
          const target = +counter.getAttribute('data-target');
          gsap.to(counter, {
            innerHTML: target,
            duration: 1.5,
            snap: { innerHTML: 1 },
            ease: 'power2.out'
          });
        });
      }
    });

  }, { scope: container });

  return (
    <section ref={container} className="relative overflow-visible w-full min-h-screen px-6 md:px-16 py-16 md:py-20 border-t border-border flex flex-col md:flex-row items-center justify-center gap-10 md:gap-16 bg-bg" id="about">
      <div className="about-line absolute left-0 top-0 w-[2px] h-full bg-green origin-top scale-y-0" />
      
      {/* Left Column */}
      <div className="flex-none md:flex-[0_0_55%] flex flex-col">
        <div className="font-mono text-[11px] tracking-[0.2em] text-muted mb-6 uppercase gs-reveal">
          [ 01 — ABOUT ]
        </div>
        <h2 className="font-hero font-black text-[clamp(32px,4vw,52px)] leading-[1.1] text-text mb-8 gs-reveal">
          I build things that live on the<br/>
          <span className="inline-block font-style-italic text-green translate-y-2">internet.</span>
        </h2>
        <div className="flex flex-col gap-4 mb-10 gs-reveal">
          <p className="font-body text-[15px] leading-[1.9] text-[#6b6b62]">
            I'm a full-stack developer with a passion for writing clean, scalable code and building robust systems. I thrive in crafting experiences that not only look visually stunning but function seamlessly under the hood.
          </p>
          <p className="font-body text-[15px] leading-[1.9] text-[#6b6b62]">
            With a strong foundation in modern web technologies and open source contributions, I focus on delivering end-to-end solutions that drive real results. Always learning, building, and solving problems.
          </p>
        </div>
        <div className="flex flex-col md:flex-row gap-4 gs-reveal">
          <a
            href="/MUHAMMAD WASIQ TANVEER CV 2.docx"
            download
            className="font-hero font-black text-[12px] uppercase tracking-wider px-9 py-4 bg-green text-bg no-underline text-center transition-all duration-200 hover:bg-[#CCFF00] hover:shadow-[0_0_20px_rgba(57,255,20,0.35)] w-full md:w-auto"
            onMouseEnter={() => handleHover(true)}
            onMouseLeave={() => handleHover(false)}
          >
            Download CV ↓
          </a>
          <a
            href="#work"
            className="font-hero font-black text-[12px] uppercase tracking-wider px-9 py-4 bg-transparent text-muted border border-border no-underline text-center transition-all duration-200 hover:border-green hover:text-green w-full md:w-auto"
            onMouseEnter={() => handleHover(true)}
            onMouseLeave={() => handleHover(false)}
          >
            View My Work →
          </a>
        </div>
      </div>

      {/* Right Column */}
      <div className="w-full md:flex-1 bg-surface border border-border p-6 md:p-8 flex flex-col rounded-none">
        <div className="font-mono text-[11px] tracking-[0.2em] text-muted mb-5 uppercase">
          [ STACK ]
        </div>
        
        <div className="flex flex-wrap gap-2 mb-8">
          {['React','Next.js','Node.js','TypeScript','Python','PostgreSQL','MongoDB','AWS','Docker','Git','REST APIs','GraphQL','Linux','Redis'].map(skill => (
            <div key={skill} className="skill-pill bg-[rgba(57,255,20,0.05)] border border-[rgba(57,255,20,0.15)] text-green font-mono text-[10px] uppercase tracking-[0.12em] px-3.5 py-1.5 will-change-[transform,opacity]">
              {skill}
            </div>
          ))}
        </div>
        
        <div className="w-full h-[1px] bg-border" />
        
        <div className="flex justify-between items-center py-4 border-b border-border">
          <div className="font-hero text-4xl text-green font-black leading-none">
            <span className="counter" data-target="3">0</span>+
          </div>
          <div className="font-mono text-[10px] text-muted uppercase">Years of Experience</div>
        </div>
        
        <div className="flex justify-between items-center py-4 border-b border-border">
          <div className="font-hero text-4xl text-green font-black leading-none">
            <span className="counter" data-target="20">0</span>+
          </div>
          <div className="font-mono text-[10px] text-muted uppercase">Projects Shipped</div>
        </div>
        
        <div className="flex justify-between items-center pt-4">
          <div className="font-hero text-4xl text-green font-black leading-none">
            <span className="counter" data-target="10">0</span>+
          </div>
          <div className="font-mono text-[10px] text-muted uppercase">Happy Clients</div>
        </div>
      </div>
    </section>
  );
}
