import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import useSound from '../hooks/useSound';

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

// Ordered to match the order the sections actually appear in on the page. The
// header previously listed Work before About while the page runs About first,
// so the nav and the scroll disagreed about the shape of the site. Activity was
// reachable from the footer but not from here.
const NAV_LINKS = [
  { label: 'About',    href: '#about'    },
  { label: 'Work',     href: '#projects' },
  { label: 'Activity', href: '#activity' },
  { label: 'Contact',  href: '#contact'  },
];

/** Speaker / muted glyph for the sound toggle. Drawn, not a unicode stand-in. */
function SoundIcon({ on }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M11 5 6 9H2v6h4l5 4V5z" />
      {on ? (
        <>
          <path d="M15.5 8.5a5 5 0 0 1 0 7" />
          <path d="M18.5 5.5a9 9 0 0 1 0 13" />
        </>
      ) : (
        <>
          <path d="M22 9l-6 6" />
          <path d="M16 9l6 6" />
        </>
      )}
    </svg>
  );
}

export default function Navigation() {
  const location = useLocation();
  const navigate = useNavigate();
  const isHome = location.pathname === '/';
  const [open, setOpen] = useState(false);
  const [soundOn, toggleSound] = useSound();
  const panelRef = useRef(null);
  const toggleRef = useRef(null);

  const handleNavClick = (e, target) => {
    e.preventDefault();
    setOpen(false);
    if (isHome) {
      lenisTo(target);
    } else {
      navigate('/');
      setTimeout(() => {
        lenisTo(target);
      }, 100); // Wait for Home page to mount before scrolling
    }
  };

  // Escape closes the mobile panel and returns focus to the control that
  // opened it, so a keyboard user is never stranded inside it.
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setOpen(false);
        toggleRef.current?.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

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

      <div className="w-24 flex items-center justify-end gap-4">
        {/* Sound switch. Three separate sources used to fire with no way to
            stop them; this is the one control that governs all of them. */}
        <button
          type="button"
          onClick={toggleSound}
          aria-pressed={soundOn}
          aria-label={soundOn ? 'Turn interface sound off' : 'Turn interface sound on'}
          title={soundOn ? 'Sound on' : 'Sound off'}
          className={`p-1.5 transition-colors ${soundOn ? 'text-green' : 'text-muted hover:text-text'}`}
          onMouseEnter={() => handleHover(true)}
          onMouseLeave={() => handleHover(false)}
        >
          <SoundIcon on={soundOn} />
        </button>

        {/* Mobile menu control. The nav list was `hidden md:flex` with no
            small-screen equivalent, so on a phone there was no way to reach
            any section except scrolling the entire page. */}
        <button
          ref={toggleRef}
          type="button"
          onClick={() => setOpen(o => !o)}
          aria-expanded={open}
          aria-controls="mobile-nav-panel"
          aria-label={open ? 'Close menu' : 'Open menu'}
          className="md:hidden flex flex-col justify-center gap-[5px] w-8 h-8 items-end"
        >
          <span aria-hidden="true" className={`block h-[1.5px] bg-text transition-all duration-300 ${open ? 'w-5 translate-y-[6.5px] rotate-45' : 'w-5'}`} />
          <span aria-hidden="true" className={`block h-[1.5px] bg-text transition-all duration-300 ${open ? 'opacity-0 w-5' : 'w-3.5'}`} />
          <span aria-hidden="true" className={`block h-[1.5px] bg-text transition-all duration-300 ${open ? 'w-5 -translate-y-[6.5px] -rotate-45' : 'w-5'}`} />
        </button>
      </div>

      {/* Panel. `inert` while closed keeps its links out of the tab order
          rather than leaving invisible controls focusable. */}
      <div
        id="mobile-nav-panel"
        ref={panelRef}
        inert={open ? undefined : ''}
        className={`md:hidden absolute top-full left-0 right-0 mx-6 border border-border bg-[rgba(14,14,14,0.96)] backdrop-blur-md transition-all duration-300 origin-top ${
          open ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 -translate-y-2 pointer-events-none'
        }`}
      >
        <ul className="list-none flex flex-col" role="list">
          {NAV_LINKS.map(link => (
            <li key={link.label} className="border-b border-border last:border-b-0">
              <Link
                to="/"
                className="block px-5 py-4 font-mono text-[12px] tracking-[0.18em] uppercase text-muted no-underline hover:text-green hover:bg-[rgba(57,255,20,0.04)] transition-colors"
                onClick={(e) => handleNavClick(e, link.href)}
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
