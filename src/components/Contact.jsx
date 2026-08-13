import React, { useRef, useState, useEffect, useCallback, useId } from 'react';
import emailjs from '@emailjs/browser';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import useScrollReveal from '../hooks/useScrollReveal';
import { playTick } from '../hooks/useSound';
import { CONTACT_EMAIL, CONTACT_MAILTO, RESPONSE_TIME, TIMEZONE, SOCIAL_LINKS } from '../siteConfig';

gsap.registerPlugin(ScrollTrigger);

const handleHover = (hovered) =>
  window.dispatchEvent(new CustomEvent('cursor-hover', { detail: { hovered } }));

// Typing feedback now routes through the shared sound preference, so it is
// silent unless the visitor asked for sound.
const playTypingSound = () => playTick();

// ─── SVG Icons ─────────────────────────────────────────────────────────────

const GithubIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
  </svg>
);
const LinkedInIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
  </svg>
);
const TwitterIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L1.254 2.25H8.08l4.259 5.631 5.905-5.631zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);
const InstagramIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/>
  </svg>
);

const SOCIAL_ICONS = {
  GitHub: GithubIcon,
  LinkedIn: LinkedInIcon,
  'Twitter/X': TwitterIcon,
  Instagram: InstagramIcon,
};

// Sourced from siteConfig so a dead profile can't be reintroduced here alone.
const SOCIALS = SOCIAL_LINKS.map(s => ({ ...s, Icon: SOCIAL_ICONS[s.name] }));

const SUBJECTS = [
  'Freelance Project',
  'Full-time Opportunity',
  'Collaboration',
  'Just Saying Hi',
  'Other',
];

// ─── Custom Select ──────────────────────────────────────────────────────────

/**
 * Subject picker.
 *
 * Previously this looked like a select but announced as nothing: the trigger
 * carried no combobox role or expanded state, and — worse — the five option
 * buttons stayed in the tab order while the panel was collapsed to height:0, so
 * tabbing past Subject walked a keyboard user through five invisible controls.
 * It also had no Escape and no arrow keys.
 *
 * Now it implements the listbox pattern properly: roles and `aria-activedescendant`
 * on the trigger, options that leave the tab order when closed (`inert` plus
 * `visibility: hidden`, which is what actually removes them), Escape to dismiss,
 * arrows/Home/End to move, Enter/Space to commit, and focus returned to the
 * trigger on close.
 */
function CustomSelect({ value, onChange, labelId, describedBy, invalid }) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const dropRef = useRef();
  const btnRef  = useRef();
  const listboxId = useId();

  const close = useCallback((refocus = true) => {
    setOpen(false);
    setActiveIndex(-1);
    if (refocus) btnRef.current?.focus();
  }, []);

  const commit = useCallback((subject) => {
    onChange(subject);
    close();
  }, [onChange, close]);

  useEffect(() => {
    if (!dropRef.current) return;
    if (open) {
      gsap.fromTo(dropRef.current,
        { height: 0, opacity: 0 },
        { height: 'auto', opacity: 1, duration: 0.3, ease: 'power2.out' }
      );
    } else {
      gsap.to(dropRef.current, { height: 0, opacity: 0, duration: 0.2, ease: 'power2.in' });
    }
  }, [open]);

  // Close on outside interaction. Bound to pointerdown, not mousedown, so a
  // touch outside the panel dismisses it too.
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (btnRef.current && !btnRef.current.contains(e.target) &&
          dropRef.current && !dropRef.current.contains(e.target)) {
        close(false);
      }
    };
    document.addEventListener('pointerdown', handler);
    return () => document.removeEventListener('pointerdown', handler);
  }, [open, close]);

  const onKeyDown = (e) => {
    switch (e.key) {
      case 'Escape':
        if (open) { e.preventDefault(); close(); }
        break;
      case 'ArrowDown':
      case 'ArrowUp': {
        e.preventDefault();
        if (!open) {
          setOpen(true);
          setActiveIndex(Math.max(0, SUBJECTS.indexOf(value)));
          return;
        }
        const step = e.key === 'ArrowDown' ? 1 : -1;
        setActiveIndex(i => (i + step + SUBJECTS.length) % SUBJECTS.length);
        break;
      }
      case 'Home':
        if (open) { e.preventDefault(); setActiveIndex(0); }
        break;
      case 'End':
        if (open) { e.preventDefault(); setActiveIndex(SUBJECTS.length - 1); }
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (open && activeIndex >= 0) commit(SUBJECTS[activeIndex]);
        else setOpen(o => !o);
        break;
      default:
        break;
    }
  };

  return (
    <div className="relative">
      <button
        ref={btnRef}
        type="button"
        role="combobox"
        aria-controls={listboxId}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-labelledby={labelId}
        aria-describedby={describedBy}
        aria-invalid={invalid || undefined}
        aria-activedescendant={open && activeIndex >= 0 ? `${listboxId}-opt-${activeIndex}` : undefined}
        onClick={() => setOpen(o => !o)}
        onKeyDown={onKeyDown}
        onMouseEnter={() => handleHover(true)}
        onMouseLeave={() => handleHover(false)}
        className={`w-full flex items-center justify-between pb-3.5 pt-3.5 border-b text-left bg-transparent group ${invalid ? 'border-[#ff3939]' : 'border-border'}`}
      >
        <span className={`font-body text-[15px] transition-colors ${value ? 'text-text' : 'text-faint'}`}>
          {value || 'Select a subject…'}
        </span>
        <span aria-hidden="true" className={`font-mono text-[12px] text-muted transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>↓</span>
        {/* Focus underline bar */}
        <span aria-hidden="true" className={`absolute bottom-0 left-0 h-[1px] bg-green transition-all duration-300 ${open ? 'w-full' : 'w-0'}`} />
      </button>
      <div
        ref={dropRef}
        id={listboxId}
        role="listbox"
        aria-labelledby={labelId}
        // `inert` removes the whole subtree from the tab order and the
        // accessibility tree; `visibility` is what actually stops a
        // height:0-with-overflow-hidden child from staying focusable.
        inert={open ? undefined : ''}
        className="absolute top-full left-0 right-0 z-50 overflow-hidden bg-surface border border-border"
        style={{ height: 0, opacity: 0, visibility: open ? 'visible' : 'hidden' }}
      >
        {SUBJECTS.map((s, i) => (
          <div
            key={s}
            id={`${listboxId}-opt-${i}`}
            role="option"
            aria-selected={value === s}
            onClick={() => commit(s)}
            onMouseEnter={() => { setActiveIndex(i); handleHover(true); }}
            onMouseLeave={() => handleHover(false)}
            className={`w-full text-left px-4 py-3 font-body text-[14px] transition-colors duration-150
              ${activeIndex === i ? 'bg-[rgba(255,255,255,0.04)] text-text' : 'text-muted'}
              ${value === s ? 'text-green' : ''}`}
          >
            {s}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Social Row ─────────────────────────────────────────────────────────────

function SocialRow({ social }) {
  const rowRef = useRef();

  const onEnter = () => {
    const el     = rowRef.current;
    const border = el.querySelector('.social-border');
    const name   = el.querySelector('.social-name');
    const handle = el.querySelector('.social-handle');
    const arrow  = el.querySelector('.social-arrow');
    gsap.to(border, { scaleY: 1, duration: 0.25, ease: 'power2.out', overwrite: 'auto' });
    gsap.to([name, handle], { color: '#39FF14', duration: 0.2, overwrite: 'auto' });
    gsap.to(arrow, { x: 3, y: -3, duration: 0.2, ease: 'power2.out', overwrite: 'auto' });
    handleHover(true);
  };
  const onLeave = () => {
    const el     = rowRef.current;
    const border = el.querySelector('.social-border');
    const name   = el.querySelector('.social-name');
    const handle = el.querySelector('.social-handle');
    const arrow  = el.querySelector('.social-arrow');
    gsap.to(border, { scaleY: 0, duration: 0.25, ease: 'power2.inOut', overwrite: 'auto' });
    gsap.to(name,   { color: '#EAEAE6', duration: 0.2, overwrite: 'auto' });
    gsap.to(handle, { color: '#8A8A85', duration: 0.2, overwrite: 'auto' });
    gsap.to(arrow,  { x: 0, y: 0, duration: 0.2, ease: 'power2.out', overwrite: 'auto' });
    handleHover(false);
  };

  return (
    <a
      ref={rowRef}
      href={social.url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${social.name} profile`}
      className="contact-social-row relative flex items-center justify-between py-4 px-4 border-b border-border no-underline hover:bg-[rgba(255,255,255,0.04)] transition-colors duration-200 cursor-none"
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      style={{ opacity: 0 }}
    >
      <div className="social-border absolute left-0 top-0 bottom-0 w-[2px] bg-green origin-top scale-y-0" />
      <div className="flex items-center gap-3">
        <span className="text-muted"><social.Icon /></span>
        <span className="social-name font-hero font-bold text-[15px] text-text">{social.name}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="social-handle font-mono text-[11px] text-muted">{social.handle}</span>
        <span className="social-arrow font-mono text-[13px] text-muted inline-block">↗</span>
      </div>
    </a>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

function splitChars(text, cls = 'text-text') {
  return text.split('').map((ch, i) => (
    <span key={i} className={`inline-block opacity-0 contact-char translate-y-[80px] ${cls}`}>
      {ch === ' ' ? '\u00A0' : ch}
    </span>
  ));
}

const isValidEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

/** Per-field error text. Renders nothing when the field is valid. */
function FieldError({ id, message }) {
  if (!message) return null;
  return (
    <p id={id} className="font-mono text-[10px] text-danger leading-[1.5] mt-1">
      {message}
    </p>
  );
}

export default function Contact() {
  const container = useRef();
  const formRef   = useRef();
  const rightCard = useRef();

  const nameRef = useRef();
  const emailRef = useRef();
  const messageRef = useRef();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [charCount, setCharCount] = useState(0);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState('idle'); // idle | loading | success | error

  // Stable, collision-free ids so every label can actually point at its input.
  const uid = useId();
  const ids = {
    name:    `${uid}-name`,
    email:   `${uid}-email`,
    subject: `${uid}-subject`,
    message: `${uid}-message`,
  };

  /** Drops one field's error without disturbing the others. */
  const clearError = useCallback((field) => {
    setErrors(prev => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }, []);

  useScrollReveal(container);

  // ── Scroll animations ────────────────────────────────────────────────────
  useGSAP(() => {
    ScrollTrigger.create({
      trigger: container.current,
      start: 'top 85%',
      once: true,
      onEnter: () => {
        // Headline chars
        gsap.to('.contact-char', {
          y: 0, opacity: 1, duration: 0.8, stagger: 0.03, ease: 'power3.out'
        });
        // Left col items
        gsap.fromTo('.contact-left-item',
          { y: 30, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.7, stagger: 0.1, ease: 'power3.out', delay: 0.25 }
        );
        // Form fields
        gsap.fromTo('.form-field',
          { y: 30, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.6, stagger: 0.1, ease: 'power3.out', delay: 0.3 }
        );
        // Submit button
        gsap.fromTo('.submit-btn',
          { y: 20, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.5, ease: 'power3.out', delay: 0.8 }
        );
        // Right card
        gsap.fromTo(rightCard.current,
          { x: 60, opacity: 0 },
          { x: 0, opacity: 1, duration: 0.9, ease: 'power3.out', delay: 0.2 }
        );
        // Info rows
        gsap.fromTo('.contact-info-row',
          { x: 20, opacity: 0 },
          { x: 0, opacity: 1, duration: 0.5, stagger: 0.08, ease: 'power3.out', delay: 0.6 }
        );
        // Social rows
        gsap.fromTo('.contact-social-row',
          { x: 20, opacity: 0 },
          { x: 0, opacity: 1, duration: 0.5, stagger: 0.06, ease: 'power3.out', delay: 0.75 }
        );
      }
    });
  }, { scope: container });

  // ── Field helpers ────────────────────────────────────────────────────────

  const shakeField = useCallback((ref) => {
    if (ref) gsap.to(ref, { x: 6, duration: 0.05, repeat: 5, yoyo: true, ease: 'none',
      onComplete: () => gsap.set(ref, { x: 0 }) });
  }, []);

  /**
   * Returns a message per invalid field, not a boolean.
   *
   * The old version set flags, and name/message failures rendered as a shake
   * and a red border with no words at all — meaning conveyed by colour and
   * motion alone (WCAG 1.4.1) with no error identification (3.3.1). A visitor
   * who can't see the border, or who doesn't read red-as-error, was simply
   * told "no" with no reason.
   */
  const validate = useCallback(() => {
    const errs = {};
    if (!name.trim()) errs.name = "Add your name so I know who I'm replying to.";
    if (!email.trim()) errs.email = 'Add an email address, or I have no way to reply.';
    else if (!isValidEmail(email)) errs.email = 'That address is missing an @ or a domain — check the spelling.';
    if (!subject) errs.subject = 'Pick what this is about.';
    if (!message.trim()) errs.message = 'Tell me a bit about what you need.';
    return errs;
  }, [name, email, subject, message]);

  // ── Submit ───────────────────────────────────────────────────────────────

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length) {
      if (errs.name) shakeField(nameRef.current);
      if (errs.email) shakeField(emailRef.current);
      if (errs.message) shakeField(messageRef.current);
      // Move focus to the first field that failed, so a keyboard or screen
      // reader user lands on the problem instead of hunting for it.
      const firstBad = errs.name ? nameRef : errs.email ? emailRef : errs.message ? messageRef : null;
      firstBad?.current?.focus();
      return;
    }

    setStatus('loading');
    try {
      await emailjs.sendForm(
        import.meta.env.VITE_EMAILJS_SERVICE_ID,
        import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
        formRef.current,
        import.meta.env.VITE_EMAILJS_PUBLIC_KEY
      );
      setStatus('success');
      // Celebration pulse
      gsap.fromTo('.submit-btn', { scale: 1 }, { scale: 1.05, duration: 0.15, yoyo: true, repeat: 1, ease: 'power2.out' });
      setName(''); setEmail(''); setSubject(''); setMessage(''); setCharCount(0);
      // Success stays put. It used to revert to idle after 3s with the form
      // already cleared, which left no evidence anything had been sent.
    } catch {
      setStatus('error');
      // Error stays until the visitor acts on it too — a failure that erases
      // itself after 3 seconds is a failure the visitor never gets to read.
    }
  };

  const inputBase = 'w-full bg-transparent border-b border-border pb-3.5 pt-3.5 font-body text-[15px] text-text placeholder:text-faint transition-colors duration-200 relative';

  return (
    <section
      ref={container}
      className="relative w-full border-t border-border bg-transparent overflow-hidden"
      id="contact"
    >
      <div className="px-6 md:px-16 py-[80px] md:py-[140px]">
        <div className="flex flex-col md:flex-row gap-12 md:gap-16 items-start">

          {/* ════════════════════ LEFT — FORM ════════════════════ */}
          <div className="w-full md:w-[55%] flex flex-col">
            {/* Label */}
            <div className="font-mono text-[11px] text-muted tracking-[0.2em] uppercase mb-8 contact-left-item" style={{ opacity: 0 }}>
              [ <span className="text-green">04</span> — CONTACT ]
            </div>

            {/* Headline */}
            <h2 className="font-hero font-black text-[clamp(36px,5vw,64px)] leading-[1.05] m-0 mb-6 overflow-hidden">
              <div className="overflow-hidden leading-[1.1]">{splitChars('Got an idea?')}</div>
              <div className="overflow-hidden leading-[1.1]">
                {splitChars("Let's ")}
                {splitChars('build', 'text-green neon-text')}
                {splitChars(' it.')}
              </div>
            </h2>

            {/* Subtext */}
            <p className="font-body text-[15px] text-muted mb-12 contact-left-item" style={{ opacity: 0 }}>
              Drop a message and I'll get back within 24 hours.
            </p>

            {/* ── Form ── */}
            <form ref={formRef} onSubmit={handleSubmit} noValidate className="flex flex-col gap-8">

              {/* Name */}
              <div className="form-field field-name flex flex-col gap-2 relative z-10" style={{ opacity: 0 }}>
                <label htmlFor={ids.name} className="font-mono text-[10px] text-muted uppercase tracking-[0.2em]">[ YOUR NAME ]</label>
                <div className="relative group">
                  <input
                    ref={nameRef}
                    id={ids.name}
                    name="from_name"
                    type="text"
                    autoComplete="name"
                    placeholder="Wasiq Tanveer"
                    value={name}
                    aria-invalid={errors.name ? true : undefined}
                    aria-describedby={errors.name ? `${ids.name}-err` : undefined}
                    onChange={e => setName(e.target.value)}
                    onKeyDown={playTypingSound}
                    onFocus={() => clearError('name')}
                    onMouseEnter={() => handleHover(true)}
                    onMouseLeave={() => handleHover(false)}
                    className={`${inputBase} ${errors.name ? 'border-b-danger' : 'focus:border-b-green'}`}
                  />
                  {/* Focus green underline fill */}
                  <span aria-hidden="true" className="absolute bottom-0 left-0 h-[1px] w-0 bg-green group-focus-within:w-full transition-all duration-300 ease-out" />
                </div>
                <FieldError id={`${ids.name}-err`} message={errors.name} />
              </div>

              {/* Email */}
              <div className="form-field field-email flex flex-col gap-2 relative z-10" style={{ opacity: 0 }}>
                <label htmlFor={ids.email} className="font-mono text-[10px] text-muted uppercase tracking-[0.2em]">[ YOUR EMAIL ]</label>
                <div className="relative group">
                  <input
                    ref={emailRef}
                    id={ids.email}
                    name="from_email"
                    type="email"
                    autoComplete="email"
                    placeholder="hello@example.com"
                    value={email}
                    aria-invalid={errors.email ? true : undefined}
                    aria-describedby={errors.email ? `${ids.email}-err` : undefined}
                    onChange={e => { setEmail(e.target.value); clearError('email'); }}
                    onKeyDown={playTypingSound}
                    onFocus={() => clearError('email')}
                    onMouseEnter={() => handleHover(true)}
                    onMouseLeave={() => handleHover(false)}
                    className={`${inputBase} ${errors.email ? 'border-b-danger' : 'focus:border-b-green'}`}
                  />
                  <span aria-hidden="true" className="absolute bottom-0 left-0 h-[1px] w-0 bg-green group-focus-within:w-full transition-all duration-300 ease-out" />
                </div>
                <FieldError id={`${ids.email}-err`} message={errors.email} />
              </div>

              {/* Subject */}
              {/* Added relative z-20 so the expanded dropdown sits firmly over the textarea below it */}
              <div className="form-field flex flex-col gap-2 relative z-20" style={{ opacity: 0 }}>
                <span id={ids.subject} className="font-mono text-[10px] text-muted uppercase tracking-[0.2em]">[ WHAT IS THIS ABOUT ]</span>
                <input type="hidden" name="subject" value={subject} />
                <CustomSelect
                  value={subject}
                  onChange={s => { setSubject(s); clearError('subject'); }}
                  labelId={ids.subject}
                  describedBy={errors.subject ? `${ids.subject}-err` : undefined}
                  invalid={Boolean(errors.subject)}
                />
                <FieldError id={`${ids.subject}-err`} message={errors.subject} />
              </div>

              {/* Message */}
              <div className="form-field field-message flex flex-col gap-2 relative z-10" style={{ opacity: 0 }}>
                <label htmlFor={ids.message} className="font-mono text-[10px] text-muted uppercase tracking-[0.2em]">[ YOUR MESSAGE ]</label>
                <div className="relative group">
                  <textarea
                    ref={messageRef}
                    id={ids.message}
                    name="message"
                    placeholder="Tell me about your project..."
                    value={message}
                    rows={6}
                    maxLength={500}
                    aria-invalid={errors.message ? true : undefined}
                    aria-describedby={`${ids.message}-count${errors.message ? ` ${ids.message}-err` : ''}`}
                    onChange={e => { setMessage(e.target.value); setCharCount(e.target.value.length); }}
                    onKeyDown={playTypingSound}
                    onFocus={() => clearError('message')}
                    onMouseEnter={() => handleHover(true)}
                    onMouseLeave={() => handleHover(false)}
                    className={`w-full bg-transparent border font-body text-[15px] text-text p-4 placeholder:text-faint resize-vertical min-h-[140px] transition-all duration-200
                      ${errors.message ? 'border-danger' : 'border-border focus:border-[rgba(57,255,20,0.3)] focus:bg-[rgba(57,255,20,0.02)]'}`}
                  />
                  <span id={`${ids.message}-count`} className="absolute bottom-3 right-3 font-mono text-[10px] text-faint pointer-events-none">
                    {charCount} / 500
                  </span>
                </div>
                <FieldError id={`${ids.message}-err`} message={errors.message} />
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={status === 'loading' || status === 'success'}
                className="submit-btn w-full py-[18px] font-hero font-bold text-[13px] uppercase tracking-wider transition-all duration-200 disabled:opacity-70"
                style={{
                  background: status === 'error' ? '#ff5c5c' : '#39FF14',
                  opacity: status === 'loading' ? 0.5 : 1,
                  cursor: status === 'loading' ? 'not-allowed' : 'pointer',
                  color: '#0a0a0a'
                }}
                onMouseEnter={() => handleHover(true)}
                onMouseLeave={() => handleHover(false)}
              >
                {status === 'idle' && 'Send a Message →'}
                {status === 'loading' && <span className="inline-flex items-center gap-2">[ SENDING... ]<span aria-hidden="true" className="inline-block w-[2px] h-[1em] bg-current align-middle animate-[blink_0.75s_step-end_infinite]" /></span>}
                {status === 'success' && '[ MESSAGE SENT ✓ ]'}
                {status === 'error' && '[ FAILED — TRY AGAIN ]'}
              </button>

              {/* Status region — the loading/success/error transitions were
                  previously visible only as a change of button label, which is
                  silent to assistive tech. This announces them, and carries the
                  fallback address so a failed send is never a dead end. */}
              <div role="status" aria-live="polite" className="min-h-[1.25rem]">
                {status === 'success' && (
                  <p className="font-mono text-[11px] text-green">
                    Message sent. I&apos;ll reply within 24 hours.
                  </p>
                )}
                {status === 'error' && (
                  <p className="font-mono text-[11px] text-danger">
                    That didn&apos;t send — the mail service didn&apos;t respond. Try again, or email me directly at{' '}
                    <a href={CONTACT_MAILTO} className="underline underline-offset-2 text-danger">{CONTACT_EMAIL}</a>.
                  </p>
                )}
              </div>

            </form>
          </div>

          {/* ════════════════════ RIGHT — INFO CARD ════════════════════ */}
          <div
            ref={rightCard}
            className="liquid-glass w-full md:w-[45%] p-8 md:p-12 flex flex-col self-stretch"
            style={{ opacity: 0 }}
          >
            {/* Availability Badge */}
            <div className="flex items-center justify-between w-full border border-[rgba(57,255,20,0.15)] bg-[rgba(57,255,20,0.06)] px-5 py-3.5 mb-8">
              <div className="flex items-center gap-2">
                <span className="w-[8px] h-[8px] rounded-full bg-green animate-[contact-pulse_2s_ease-in-out_infinite]" />
                <span className="font-mono text-[11px] text-green tracking-[0.1em]">Currently Available</span>
              </div>
              <span className="font-mono text-[10px] text-muted">Open to work</span>
            </div>

            {/* Info rows.
                These used to be `hidden md:flex`, which meant the response
                time, the timezone, and — critically — the email address did
                not exist anywhere in the mobile DOM. A phone visitor who
                didn't want to use the form had no way to reach anyone. They
                stack on narrow screens now instead of disappearing. */}
            <div className="flex flex-col border-t border-border">
              {[
                { label: 'RESPONSE TIME',     value: RESPONSE_TIME },
                { label: 'TIMEZONE',          value: TIMEZONE },
                { label: 'PREFERRED CONTACT', value: CONTACT_EMAIL, href: CONTACT_MAILTO },
              ].map(row => (
                <div
                  key={row.label}
                  className="contact-info-row flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between py-[18px] border-b border-border"
                  style={{ opacity: 0 }}
                >
                  <span className="font-mono text-[10px] text-muted tracking-[0.15em] uppercase">{row.label}</span>
                  {row.href ? (
                    <a
                      href={row.href}
                      onMouseEnter={() => handleHover(true)}
                      onMouseLeave={() => handleHover(false)}
                      className="font-body text-[14px] text-text break-all underline underline-offset-4 decoration-border hover:decoration-green transition-colors"
                    >
                      {row.value}
                    </a>
                  ) : (
                    <span className="font-body text-[14px] text-text">{row.value}</span>
                  )}
                </div>
              ))}
            </div>

            {/* Social Links */}
            <div className="mt-7 md:mt-7">
              <div className="font-mono text-[10px] text-muted tracking-[0.2em] uppercase mb-4">
                [ FIND ME ON ]
              </div>
              <div className="flex flex-col border-t border-border">
                {SOCIALS.map(s => <SocialRow key={s.name} social={s} />)}
              </div>
            </div>

            {/* Personal Note */}
            <blockquote className="mt-7 pl-4 border-l border-[rgba(57,255,20,0.25)]">
              <p className="font-body text-[14px] italic text-muted leading-[1.7]">
                "I reply to every message personally — no bots, no templates."
              </p>
            </blockquote>
          </div>

        </div>
      </div>
    </section>
  );
}
