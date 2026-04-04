import React, { useRef, useEffect } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import Navigation from './Navigation';
import Marquee from './Marquee';

export default function Hero({ isReady }) {
  const container = useRef(null);
  const photoCard = useRef(null);
  const imgRef = useRef(null);
  const circleRef = useRef(null);   // SVG spinner
  const circleTweenRef = useRef(null); // persistent rotation tween
  const hoverTargets = useRef([]);

  const addToHover = (el) => {
    if (el && !hoverTargets.current.includes(el)) {
      hoverTargets.current.push(el);
    }
  };

  const handleHover = (hovered) => {
    window.dispatchEvent(new CustomEvent('cursor-hover', { detail: { hovered } }));
  };

  useGSAP(() => {
    // Set initial hidden state on photo img
    if (imgRef.current) {
      gsap.set(imgRef.current, {
        opacity: 0,
        scale: 1.08,
        filter: 'blur(8px) saturate(0)',
        clipPath: 'inset(100% 0% 0% 0%)'
      });
    }
  }, { scope: container });

  // Fire master timeline only when preloader is done
  useEffect(() => {
    if (!isReady) return;
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
      // Skip animation — show everything immediately
      gsap.set(['#main-nav','#portfolio-label','.name-part-1','.name-part-2',photoCard.current,'#circular-text-wrap','#marquee-wrapper'], { opacity: 1, y: 0, x: 0, rotation: -4 });
      if (imgRef.current) gsap.set(imgRef.current, { opacity: 1, scale: 1, filter: 'none', clipPath: 'inset(0% 0% 0% 0%)' });
      return;
    }

    const tl = gsap.timeline();

    // The Master Sequence
    tl.fromTo('#main-nav', { opacity: 0, y: -20 }, { opacity: 1, y: 0, duration: 0.6 }, 0)
      .fromTo('#portfolio-label', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5 }, 0.3)
      .fromTo('.name-part-1', { opacity: 0, y: 100 }, { opacity: 1, y: 0, duration: 0.9, ease: 'power4.out' }, 0.5)
      .fromTo('.name-part-2', { opacity: 0, y: 100 }, { opacity: 1, y: 0, duration: 0.9, ease: 'power4.out' }, 0.7)
      .fromTo(photoCard.current, { y: -80, opacity: 0, rotation: 0 }, { y: 0, opacity: 1, rotation: -4, duration: 1, ease: 'elastic.out(1, 0.6)' }, 1.3)
      // Photo cinematic reveal — overlaps card settle by 0.4s
      .to(imgRef.current, {
        opacity: 1,
        scale: 1,
        filter: 'blur(0px) saturate(1)',
        clipPath: 'inset(0% 0% 0% 0%)',
        duration: 1.2,
        ease: 'power2.out'
      }, '-=0.4')
      .fromTo('#circular-text-wrap', { opacity: 0 }, { opacity: 1, duration: 0.5 }, 1.5)
      .fromTo('#marquee-wrapper', { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.5 }, 1.6);

    // Parallax
    const maxShift = 12;
    const onMouseMove = (e) => {
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      const dx = (e.clientX - cx) / cx;
      const dy = (e.clientY - cy) / cy;

      gsap.to(photoCard.current, {
        x: -dx * maxShift,
        y: -dy * maxShift,
        duration: 0.8,
        ease: 'power2.out',
        overwrite: 'auto',
      });
    };

    window.addEventListener('mousemove', onMouseMove);
    return () => window.removeEventListener('mousemove', onMouseMove);
  }, [isReady]);

  // Persistent GSAP rotation for the Hire Me circle
  useEffect(() => {
    if (!circleRef.current) return;
    // Fast default speed — 1 full rotation every 6s
    circleTweenRef.current = gsap.to(circleRef.current, {
      rotation: 360,
      duration: 6,
      ease: 'none',
      repeat: -1,
      transformOrigin: '50% 50%',
    });
    return () => circleTweenRef.current?.kill();
  }, []);

  const handleCircleEnter = () => {
    if (!circleRef.current || !circleTweenRef.current) return;
    // Smoothly slow the spin to 40% speed and grow the whole badge
    gsap.to(circleTweenRef.current, { timeScale: 0.3, duration: 0.6, ease: 'power2.out' });
    gsap.to('#circular-text-wrap', { scale: 1.12, duration: 0.35, ease: 'power2.out' });
  };

  const handleCircleLeave = () => {
    if (!circleRef.current || !circleTweenRef.current) return;
    // Smoothly return to full speed and original size
    gsap.to(circleTweenRef.current, { timeScale: 1, duration: 0.5, ease: 'power2.inOut' });
    gsap.to('#circular-text-wrap', { scale: 1, duration: 0.35, ease: 'power2.inOut' });
  };

  // Typewriter
  useEffect(() => {
    const roles = [
      'Full Stack Developer',
      'Problem Solver',
      'Open Source Contributor',
      'UI/UX Enthusiast',
    ];
    let roleIdx = 0;
    let charIdx = 0;
    let deleting = false;
    let timeout;
    
    const typeEl = document.getElementById('typewriter-text');
    if (!typeEl) return;

    // Start with role wrapper faded in but empty
    gsap.set('#hero-role', { opacity: 1 });

    const typeWriter = () => {
      const current = roles[roleIdx];
      if (!deleting) {
        typeEl.textContent = current.slice(0, charIdx + 1);
        charIdx++;
        if (charIdx === current.length) {
          deleting = true;
          timeout = setTimeout(typeWriter, 2200);
          return;
        }
      } else {
        typeEl.textContent = current.slice(0, charIdx - 1);
        charIdx--;
        if (charIdx === 0) {
          deleting = false;
          roleIdx = (roleIdx + 1) % roles.length;
        }
      }
      timeout = setTimeout(typeWriter, deleting ? 38 : 68);
    };

    // Trigger typewriter precisely when the names are finishing in the timeline (1.1s)
    gsap.delayedCall(1.1, typeWriter);

    return () => {
      clearTimeout(timeout);
      gsap.killTweensOf(typeWriter);
    };
  }, []);

  return (
    <section className="relative w-full min-h-screen flex flex-col overflow-hidden isolate" id="hero" ref={container}>
      <div className="hero-glow" />

      <Navigation />

      <div className="relative z-10 flex-1 flex flex-col justify-center px-6 md:px-12">
        <div className="font-mono text-[11px] tracking-[0.18em] uppercase text-muted mb-5 opacity-0" id="portfolio-label">
          <span>[</span>&nbsp;Portfolio 2025&nbsp;<span>]</span>
        </div>

        <h1 className="font-hero font-black text-[clamp(52px,14vw,13vw)] md:text-[clamp(64px,12vw,13vw)] leading-[0.92] tracking-[-0.03em] text-text m-0 select-none overflow-visible min-h-[120px] md:min-h-[160px] pt-4 will-change-[transform] [transform:translateZ(0)]">
          <span className="block overflow-visible"><span className="inline-block name-part-1 opacity-0">Wasiq</span></span>
          <span className="block overflow-visible"><span className="inline-block name-part-2 opacity-0">Tanveer</span></span>
        </h1>

        <p className="mt-8 font-body font-light text-[clamp(16px,1.4vw,20px)] text-muted opacity-0 flex items-center gap-2 min-h-[28px]" id="hero-role">
          <span className="text-text font-light" id="typewriter-text"></span>
          <span className="inline-block w-[2px] h-[1.1em] bg-green ml-[2px] align-middle shadow-[0_0_6px_#39FF14] animate-[blink_0.75s_step-end_infinite]"></span>
        </p>
      </div>

      <div 
        ref={photoCard}
        className="opacity-0 relative md:absolute md:right-[clamp(40px,8vw,120px)] md:top-1/2 -rotate-4 md:-translate-y-[63%] md:translate-y-[-80px] w-[60vw] max-w-[220px] md:w-[clamp(180px,22vw,300px)] aspect-[3/4] bg-surface border border-border rounded-sm shadow-card z-20 overflow-hidden mx-auto mt-10 md:mt-0"
        id="photo-card"
        onMouseEnter={() => handleHover(true)}
        onMouseLeave={() => handleHover(false)}
      >
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg_viewBox=%270_0_256_256%27_xmlns=%27http://www.w3.org/2000/svg%27%3E%3Cfilter_id=%27noise%27%3E%3CfeTurbulence_type=%27fractalNoise%27_baseFrequency=%270.9%27_numOctaves=%274%27_stitchTiles=%27stitch%27/%3E%3C/filter%3E%3Crect_width=%27100%25%27_height=%27100%25%27_filter=%27url(%23noise)%27_opacity=%270.12%27/%3E%3C/svg%3E')] bg-[length:150px] opacity-55 z-[2] mix-blend-overlay pointer-events-none" />
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[rgba(57,255,20,0.3)] to-transparent z-[3]" />
        
        <div className="relative w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#181814] to-[#0f0f0d]">
          <img
            ref={imgRef}
            src="/src/assets/unnamed%20-%20Edited.png"
            alt="Wasiq Tanveer — Full Stack Developer"
            loading="eager"
            fetchpriority="high"
            className="absolute inset-0 w-full h-full object-cover object-top z-[1] will-change-[transform,filter,opacity]"
          />
          <div className="absolute z-[5] font-hero font-black text-[clamp(36px,5vw,72px)] text-text tracking-[-0.05em] select-none opacity-[0.08] pointer-events-none">WT</div>
        </div>
      </div>

      <div
        id="circular-text-wrap"
        className="absolute bottom-[68px] right-6 w-[100px] h-[100px] md:bottom-[100px] md:right-12 md:w-[130px] md:h-[130px] z-30 opacity-0 will-change-transform"
        onMouseEnter={() => { handleCircleEnter(); handleHover(true); }}
        onMouseLeave={() => { handleCircleLeave(); handleHover(false); }}
      >
        <svg ref={circleRef} className="w-full h-full" viewBox="0 0 130 130">
          <defs>
            <path id="circle-path" d="M 65,65 m -50,0 a 50,50 0 1,1 100,0 a 50,50 0 1,1 -100,0" />
          </defs>
          <text>
            <textPath href="#circle-path" startOffset="0%" className="font-mono text-[9.5px] tracking-[0.18em] fill-green uppercase">
              OPEN TO WORK · HIRE ME · LET'S BUILD · &nbsp;
            </textPath>
          </text>
        </svg>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center border border-border rounded-full bg-bg">
          <span className="text-green text-sm leading-none">→</span>
        </div>
      </div>

      <div id="marquee-wrapper" className="opacity-0 w-full mt-auto">
        <Marquee />
      </div>
    </section>
  );
}
