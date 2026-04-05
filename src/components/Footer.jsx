import React, { useRef, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const handleHover = (hovered) =>
  window.dispatchEvent(new CustomEvent('cursor-hover', { detail: { hovered } }));

const lenisTo = (target) => {
  if (window.__lenis) {
    window.__lenis.scrollTo(target, { duration: 1.2 });
  } else {
    const el = typeof target === 'string' ? document.querySelector(target) : target;
    el?.scrollIntoView({ behavior: 'smooth' });
  }
};

const NAV_LINKS = [
  { label: 'Work',     href: '#projects'  },
  { label: 'About',    href: '#about'     },
  { label: 'Activity', href: '#activity'  },
  { label: 'Contact',  href: '#contact'   },
];

function FooterMarquee() {
  const trackRef = useRef();
  const prefersReduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  useEffect(() => {
    if (prefersReduced) return;
    const tween = gsap.to(trackRef.current, {
      x: '-50%', duration: 35, ease: 'none', repeat: -1,
    });
    return () => tween.kill();
  }, [prefersReduced]);

  const items = ["Available for work", "Let's collaborate", "Based in Pakistan", "Open to remote"];
  const segment = items.map((item, i) => (
    <span key={i} className="inline-flex items-center gap-5 mx-5">
      <span className="font-mono text-[11px] uppercase tracking-widest text-[#2a2a22]">{item}</span>
      <span className="font-mono text-[11px] text-green opacity-30" aria-hidden="true">·</span>
    </span>
  ));

  return (
    <div
      className="w-full overflow-hidden border-t border-b border-border py-4 whitespace-nowrap"
      role="marquee"
      aria-label="Availability and location info"
    >
      <div ref={trackRef} className="inline-flex">
        <span className="inline-flex">{segment}{segment}{segment}{segment}</span>
        <span className="inline-flex">{segment}{segment}{segment}{segment}</span>
      </div>
    </div>
  );
}

export default function Footer() {
  const container = useRef();
  const location = useLocation();
  const navigate = useNavigate();
  const isHome = location.pathname === '/';

  const handleNavClick = (e, target) => {
    e.preventDefault();
    if (isHome) {
      lenisTo(target);
    } else {
      navigate('/');
      setTimeout(() => {
        lenisTo(target);
      }, 100);
    }
  };

  useEffect(() => {
    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: container.current,
        start: 'top 95%',
        once: true,
        onEnter: () => {
          gsap.fromTo('.footer-logo',
            { y: 20, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.6, ease: 'power3.out' }
          );
          gsap.fromTo('.footer-nav-link',
            { opacity: 0 },
            { opacity: 1, duration: 0.5, stagger: 0.08, ease: 'power3.out', delay: 0.1 }
          );
          gsap.fromTo('.footer-top-btn',
            { y: 20, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.5, ease: 'power3.out', delay: 0.2 }
          );
          gsap.fromTo('.footer-copy',
            { opacity: 0 },
            { opacity: 1, duration: 0.5, ease: 'power3.out', delay: 0.4 }
          );
        }
      });
    }, container);
    return () => ctx.revert();
  }, []);

  return (
    <footer ref={container} className="relative w-full border-t border-border bg-transparent">

      {/* Top Row */}
      <div className="px-6 md:px-16 py-10 flex flex-col md:flex-row items-center justify-between gap-6 border-b border-border">
        <Link
          to="/"
          className="footer-logo font-hero font-black text-[24px] text-text no-underline hover:text-green transition-colors duration-200 opacity-0"
          onClick={(e) => handleNavClick(e, 0)}
          onMouseEnter={() => handleHover(true)}
          onMouseLeave={() => handleHover(false)}
          aria-label="Wasiq Tanveer — scroll to top"
        >
          WT<span className="text-green">.</span>
        </Link>

        <nav className="hidden md:flex items-center gap-8" aria-label="Footer navigation">
          {NAV_LINKS.map(link => (
            <Link
              key={link.label}
              to="/"
              className="footer-nav-link font-mono text-[11px] uppercase tracking-[0.15em] text-muted no-underline hover:text-text transition-colors duration-200 opacity-0"
              onClick={(e) => handleNavClick(e, link.href)}
              onMouseEnter={() => handleHover(true)}
              onMouseLeave={() => handleHover(false)}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <button
          onClick={() => lenisTo(0)}
          className="footer-top-btn font-mono text-[11px] uppercase tracking-[0.15em] text-muted hover:text-green transition-colors duration-200 cursor-none outline-none opacity-0"
          aria-label="Back to top"
          onMouseEnter={() => handleHover(true)}
          onMouseLeave={() => handleHover(false)}
        >
          Back to top ↑
        </button>
      </div>

      {/* Marquee Strip */}
      <FooterMarquee />

      {/* Bottom Row */}
      <div className="px-6 md:px-16 py-5 flex flex-col md:flex-row items-center justify-between gap-2 text-center md:text-left">
        <p className="footer-copy font-body text-[12px] text-[#2a2a22] opacity-0">
          © 2025 Wasiq Tanveer — Built with React + GSAP
        </p>
        <p className="footer-copy font-body text-[12px] text-[#2a2a22] opacity-0">
          Designed &amp; Developed by Wasiq Tanveer
        </p>
      </div>

    </footer>
  );
}
