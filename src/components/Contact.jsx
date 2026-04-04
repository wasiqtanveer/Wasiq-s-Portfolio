import React, { useRef, useState, useEffect, useCallback } from 'react';
import emailjs from '@emailjs/browser';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import useScrollReveal from '../hooks/useScrollReveal';

gsap.registerPlugin(ScrollTrigger);

const handleHover = (hovered) =>
  window.dispatchEvent(new CustomEvent('cursor-hover', { detail: { hovered } }));

// ─── Shared Audio Context for Tactile Typing ───────────────────────────────

let typingAudioCtx = null;
const playTypingSound = () => {
  try {
    if (!typingAudioCtx) {
      typingAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (typingAudioCtx.state === 'suspended') typingAudioCtx.resume();
    
    const osc = typingAudioCtx.createOscillator();
    const gainNode = typingAudioCtx.createGain();
    
    // Very short, soft, high-pitched mechanical "tick"
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, typingAudioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, typingAudioCtx.currentTime + 0.03);
    
    // Very quiet (volume 0.03)
    gainNode.gain.setValueAtTime(0.03, typingAudioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, typingAudioCtx.currentTime + 0.03);
    
    osc.connect(gainNode);
    gainNode.connect(typingAudioCtx.destination);
    osc.start();
    osc.stop(typingAudioCtx.currentTime + 0.03);
  } catch (e) {
    // Silent fail if autoplay blocked
  }
};

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

const SOCIALS = [
  { name: 'GitHub',    handle: '@wasiqtanveer', url: 'https://github.com/wasiqtanveer', Icon: GithubIcon },
  { name: 'LinkedIn',  handle: '@wasiqtanveer', url: 'https://www.linkedin.com/in/wasiq-tanveer', Icon: LinkedInIcon },
  { name: 'Twitter/X', handle: '@wasiqtanveer', url: '#',                               Icon: TwitterIcon },
  { name: 'Instagram', handle: '@wasiqtanveer', url: '#',                               Icon: InstagramIcon },
];

const SUBJECTS = [
  'Freelance Project',
  'Full-time Opportunity',
  'Collaboration',
  'Just Saying Hi',
  'Other',
];

// ─── Custom Select ──────────────────────────────────────────────────────────

function CustomSelect({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const dropRef = useRef();
  const btnRef  = useRef();

  useEffect(() => {
    if (open) {
      gsap.fromTo(dropRef.current,
        { height: 0, opacity: 0 },
        { height: 'auto', opacity: 1, duration: 0.3, ease: 'power2.out' }
      );
    } else if (dropRef.current) {
      gsap.to(dropRef.current, { height: 0, opacity: 0, duration: 0.2, ease: 'power2.in' });
    }
  }, [open]);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (btnRef.current && !btnRef.current.contains(e.target) &&
          dropRef.current && !dropRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="relative">
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen(o => !o)}
        onMouseEnter={() => handleHover(true)}
        onMouseLeave={() => handleHover(false)}
        className="w-full flex items-center justify-between pb-3.5 pt-3.5 border-b border-border text-left bg-transparent outline-none cursor-none group"
      >
        <span className={`font-body text-[15px] transition-colors ${value ? 'text-text' : 'text-[#2a2a22]'}`}>
          {value || 'Select a subject…'}
        </span>
        <span className={`font-mono text-[12px] text-muted transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>↓</span>
        {/* Focus underline bar */}
        <span className={`absolute bottom-0 left-0 h-[1px] bg-green transition-all duration-300 ${open ? 'w-full' : 'w-0'}`} />
      </button>
      <div
        ref={dropRef}
        className="absolute top-full left-0 right-0 z-50 overflow-hidden bg-surface border border-border"
        style={{ height: 0, opacity: 0 }}
      >
        {SUBJECTS.map(s => (
          <button
            key={s}
            type="button"
            onClick={() => { onChange(s); setOpen(false); }}
            onMouseEnter={() => handleHover(true)}
            onMouseLeave={() => handleHover(false)}
            className="w-full text-left px-4 py-3 font-body text-[14px] text-muted hover:bg-[#161614] hover:text-text transition-colors duration-150 cursor-none"
          >
            {s}
          </button>
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
    gsap.to(name,   { color: '#E8E4DC', duration: 0.2, overwrite: 'auto' });
    gsap.to(handle, { color: '#4a4a42', duration: 0.2, overwrite: 'auto' });
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
      className="contact-social-row relative flex items-center justify-between py-4 px-4 border-b border-border no-underline hover:bg-[#0d0d0b] transition-colors duration-200 cursor-none"
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

export default function Contact() {
  const container = useRef();
  const formRef   = useRef();
  const rightCard = useRef();

  const [fields, setFields]     = useState({ name: '', email: '', message: '' });
  const [subject, setSubject]   = useState('');
  const [errors, setErrors]     = useState({});
  const [charCount, setCharCount] = useState(0);
  const [btnState, setBtnState] = useState('idle'); // idle | loading | success | error

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

  const shakeField = useCallback((selector) => {
    gsap.to(selector, { x: 6, duration: 0.05, repeat: 5, yoyo: true, ease: 'none',
      onComplete: () => gsap.set(selector, { x: 0 }) });
  }, []);

  const validate = useCallback(() => {
    const errs = {};
    if (!fields.name.trim())         errs.name    = 'Name is required';
    if (!isValidEmail(fields.email)) errs.email   = '[ invalid email format ]';
    if (!fields.message.trim())      errs.message = 'Message is required';
    return errs;
  }, [fields]);

  // ── Submit ───────────────────────────────────────────────────────────────

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      if (errs.name)    shakeField('.field-name');
      if (errs.email)   shakeField('.field-email');
      if (errs.message) shakeField('.field-message');
      return;
    }
    setErrors({});
    setBtnState('loading');

    try {
      await emailjs.sendForm(
        import.meta.env.VITE_EMAILJS_SERVICE_ID,
        import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
        formRef.current,
        { publicKey: import.meta.env.VITE_EMAILJS_PUBLIC_KEY }
      );
      setBtnState('success');
      // Celebration pulse
      gsap.fromTo('.submit-btn', { scale: 1 }, { scale: 1.05, duration: 0.15, yoyo: true, repeat: 1, ease: 'power2.out' });
      setTimeout(() => {
        setBtnState('idle');
        setFields({ name: '', email: '', message: '' });
        setSubject('');
        setCharCount(0);
      }, 3000);
    } catch {
      setBtnState('error');
      setTimeout(() => setBtnState('idle'), 3000);
    }
  };

  const inputBase = 'w-full bg-transparent border-b border-border pb-3.5 pt-3.5 font-body text-[15px] text-text outline-none placeholder:text-[#2a2a22] transition-colors duration-200 relative';

  const btnLabel = {
    idle:    'Send a Message →',
    loading: '[ SENDING... ]',
    success: '[ MESSAGE SENT ✓ ]',
    error:   '[ FAILED — TRY AGAIN ]',
  };
  const btnBg = {
    idle:    '#39FF14',
    loading: 'rgba(57,255,20,0.4)',
    success: '#39FF14',
    error:   '#ff3939',
  };
  const btnColor = {
    idle:    '#0a0a08',
    loading: '#0a0a08',
    success: '#0a0a08',
    error:   '#ffffff',
  };

  return (
    <section
      ref={container}
      className="relative w-full border-t border-border bg-bg overflow-hidden"
      id="contact"
    >
      <div className="px-6 md:px-16 py-[80px] md:py-[140px]">
        <div className="flex flex-col md:flex-row gap-12 md:gap-16 items-start">

          {/* ════════════════════ LEFT — FORM ════════════════════ */}
          <div className="w-full md:w-[55%] flex flex-col">
            {/* Label */}
            <div className="font-mono text-[11px] text-muted tracking-[0.2em] uppercase mb-8 contact-left-item" style={{ opacity: 0 }}>
              [ 04 — CONTACT ]
            </div>

            {/* Headline */}
            <h2 className="font-hero font-black text-[clamp(36px,5vw,64px)] leading-[1.05] m-0 mb-6 overflow-hidden">
              <div className="overflow-hidden leading-[1.1]">{splitChars('Got an idea?')}</div>
              <div className="overflow-hidden leading-[1.1]">
                {splitChars("Let's ")}
                {splitChars('build', 'text-green')}
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
                <label className="font-mono text-[10px] text-muted uppercase tracking-[0.2em]">[ YOUR NAME ]</label>
                <div className="relative group">
                  <input
                    name="from_name"
                    type="text"
                    placeholder="Wasiq Tanveer"
                    value={fields.name}
                    onChange={e => setFields(f => ({ ...f, name: e.target.value }))}
                    onKeyDown={playTypingSound}
                    onFocus={() => setErrors(er => ({ ...er, name: '' }))}
                    onMouseEnter={() => handleHover(true)}
                    onMouseLeave={() => handleHover(false)}
                    className={`${inputBase} ${errors.name ? 'border-b-[#ff3939]' : 'focus:border-b-green'}`}
                  />
                  {/* Focus green underline fill */}
                  <span className="absolute bottom-0 left-0 h-[1px] w-0 bg-green group-focus-within:w-full transition-all duration-300 ease-out" />
                </div>
                {errors.name && <span className="font-mono text-[10px] text-[#ff3939]">[ {errors.name} ]</span>}
              </div>

              {/* Email */}
              <div className="form-field field-email flex flex-col gap-2 relative z-10" style={{ opacity: 0 }}>
                <label className="font-mono text-[10px] text-muted uppercase tracking-[0.2em]">[ YOUR EMAIL ]</label>
                <div className="relative group">
                  <input
                    name="from_email"
                    type="email"
                    placeholder="hello@example.com"
                    value={fields.email}
                    onChange={e => setFields(f => ({ ...f, email: e.target.value }))}
                    onKeyDown={playTypingSound}
                    onBlur={() => {
                      if (fields.email && !isValidEmail(fields.email))
                        setErrors(er => ({ ...er, email: 'invalid email format' }));
                    }}
                    onFocus={() => setErrors(er => ({ ...er, email: '' }))}
                    onMouseEnter={() => handleHover(true)}
                    onMouseLeave={() => handleHover(false)}
                    className={`${inputBase} ${errors.email ? 'border-b-[#ff3939]' : 'focus:border-b-green'}`}
                  />
                  <span className="absolute bottom-0 left-0 h-[1px] w-0 bg-green group-focus-within:w-full transition-all duration-300 ease-out" />
                </div>
                {errors.email && <span className="font-mono text-[10px] text-[#ff3939]">[ {errors.email} ]</span>}
              </div>

              {/* Subject */}
              {/* Added relative z-20 so the expanded dropdown sits firmly over the textarea below it */}
              <div className="form-field flex flex-col gap-2 relative z-20" style={{ opacity: 0 }}>
                <label className="font-mono text-[10px] text-muted uppercase tracking-[0.2em]">[ WHAT IS THIS ABOUT ]</label>
                <input type="hidden" name="subject" value={subject} />
                <CustomSelect value={subject} onChange={setSubject} />
              </div>

              {/* Message */}
              <div className="form-field field-message flex flex-col gap-2 relative z-10" style={{ opacity: 0 }}>
                <label className="font-mono text-[10px] text-muted uppercase tracking-[0.2em]">[ YOUR MESSAGE ]</label>
                <div className="relative group">
                  <textarea
                    name="message"
                    placeholder="Tell me about your project..."
                    value={fields.message}
                    rows={6}
                    maxLength={500}
                    onChange={e => { setFields(f => ({ ...f, message: e.target.value })); setCharCount(e.target.value.length); }}
                    onKeyDown={playTypingSound}
                    onFocus={() => setErrors(er => ({ ...er, message: '' }))}
                    onMouseEnter={() => handleHover(true)}
                    onMouseLeave={() => handleHover(false)}
                    className={`w-full bg-transparent border font-body text-[15px] text-text p-4 outline-none placeholder:text-[#2a2a22] resize-vertical min-h-[140px] transition-all duration-200
                      ${errors.message ? 'border-[#ff3939]' : 'border-border focus:border-[rgba(57,255,20,0.3)] focus:bg-[rgba(57,255,20,0.02)]'}`}
                  />
                  <span className="absolute bottom-3 right-3 font-mono text-[10px] text-[#2a2a22] pointer-events-none">
                    {charCount} / 500
                  </span>
                </div>
                {errors.message && <span className="font-mono text-[10px] text-[#ff3939]">[ Message is required ]</span>}
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={btnState === 'loading'}
                className="submit-btn w-full py-[18px] font-hero font-bold text-[13px] uppercase tracking-wider transition-all duration-200 cursor-none outline-none disabled:opacity-70"
                style={{ background: btnBg[btnState], color: btnColor[btnState] }}
                onMouseEnter={() => handleHover(true)}
                onMouseLeave={() => handleHover(false)}
              >
                {btnState === 'loading'
                  ? <span className="inline-flex items-center gap-2">
                      {btnLabel.loading}
                      <span className="inline-block w-[2px] h-[1em] bg-current align-middle animate-[blink_0.75s_step-end_infinite]" />
                    </span>
                  : btnLabel[btnState]
                }
              </button>

            </form>
          </div>

          {/* ════════════════════ RIGHT — INFO CARD ════════════════════ */}
          <div
            ref={rightCard}
            className="w-full md:w-[45%] bg-surface border border-border p-8 md:p-12 flex flex-col self-stretch"
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

            {/* Info Rows — hidden on mobile */}
            <div className="hidden md:flex flex-col border-t border-border">
              {[
                { label: 'RESPONSE TIME',      value: 'Within 24 hours'  },
                { label: 'TIMEZONE',           value: 'PKT — UTC+5'      },
                { label: 'PREFERRED CONTACT',  value: 'mwasiqt@gmail.com' },
              ].map(row => (
                <div key={row.label} className="contact-info-row flex items-center justify-between py-[18px] border-b border-border" style={{ opacity: 0 }}>
                  <span className="font-mono text-[10px] text-muted tracking-[0.15em] uppercase">{row.label}</span>
                  <span className="font-body text-[14px] text-text">{row.value}</span>
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
            <blockquote className="mt-7 pl-4 border-l-2 border-[rgba(57,255,20,0.2)]">
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
