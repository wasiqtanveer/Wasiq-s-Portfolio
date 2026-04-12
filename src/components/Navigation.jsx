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
      <div className="w-24">
        <Link
          to="/"
          className="font-hero font-black text-[1.1rem] text-text tracking-[-0.02em] no-underline hover:text-green transition-colors"
          onClick={(e) => handleNavClick(e, 0)}
          onMouseEnter={() => handleHover(true)}
          onMouseLeave={() => handleHover(false)}
          aria-label="Wasiq Tanveer — back to top"
        >
          WT<span className="text-green">.</span>
        </Link>
      </div>

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
      
      {/* Balances the flex layout since 'Available' was removed */}
      <div className="w-24 hidden md:block"></div>
    </nav>
  );
}
