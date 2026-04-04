import React from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';

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
  { label: 'Work',    href: '#projects'  },
  { label: 'About',   href: '#about'     },
  { label: 'Contact', href: '#contact'   },
];

export default function Navigation() {
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
      }, 100); // Wait for Home page to mount before scrolling
    }
  };

  return (
    <nav
      className="relative z-[100] flex items-center justify-between px-6 md:px-12 py-8 opacity-0"
      id="main-nav"
      aria-label="Main navigation"
    >
      <Link
        to="/"
        className="font-hero font-black text-[1.1rem] text-text tracking-[-0.02em] no-underline hover:text-green transition-colors"
        onClick={(e) => handleNavClick(e, 0)}
        onMouseEnter={() => handleHover(true)}
        onMouseLeave={() => handleHover(false)}
        aria-label="Wasiq Tanveer — back to top"
      >
        WT.
      </Link>

      <ul className="hidden md:flex gap-9 list-none" role="list">
        {NAV_LINKS.map(link => (
          <li key={link.label}>
            <Link
              to="/"
              className="font-mono text-[11px] tracking-[0.18em] uppercase text-muted no-underline hover:text-text transition-colors"
              onClick={(e) => handleNavClick(e, link.href)}
              onMouseEnter={() => handleHover(true)}
              onMouseLeave={() => handleHover(false)}
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>

      <div className="flex items-center gap-2 font-mono text-[11px] tracking-[0.18em] uppercase text-muted">
        <div
          className="w-[8px] h-[8px] rounded-full bg-green shadow-[0_0_6px_#39FF14,0_0_12px_rgba(57,255,20,0.5)] animate-[pulse-dot_2s_ease-in-out_infinite]"
          aria-hidden="true"
        />
        <span>Available</span>
      </div>
    </nav>
  );
}
