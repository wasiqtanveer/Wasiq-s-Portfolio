import { lazy, Suspense, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import emailjs from '@emailjs/browser';
import CursorPortrait from './CursorPortrait';
import { CONTACT_EMAIL, CONTACT_MAILTO, SOCIAL_LINKS } from '../../siteConfig';
import { projects, experiments } from './projects';
import KnotMark from './KnotMark';
import { createSpring, heroRig, pageCurtain } from './motion';
import { sound } from './sfx';

const Sculpture = lazy(() => import('./Sculpture'));
gsap.registerPlugin(ScrollTrigger, useGSAP);
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

function Arrow({ diagonal = true }) {
  return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d={diagonal ? 'M5 19 19 5M5 5h14v14' : 'M3 12h18m-7-7 7 7-7 7'} stroke="currentColor" strokeWidth="1.5" /></svg>;
}

function MagneticLink({ children, className = '', ...props }) {
  const ref = useRef(null);
  useGSAP(() => {
    const element = ref.current;
    const media = gsap.matchMedia();
    media.add('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)', () => {
      const setX = gsap.quickSetter(element, 'x', 'px');
      const setY = gsap.quickSetter(element, 'y', 'px');
      // Some mass: it leans after the pointer, and swings back past centre when released.
      const spring = createSpring({ x: 0, y: 0 }, { stiffness: 100, damping: 10, mass: 1.4, precision: 0.05 }, ({ x, y }) => { setX(x); setY(y); });
      const move = (event) => {
        const bounds = element.getBoundingClientRect();
        spring.set({
          x: (event.clientX - bounds.left - bounds.width / 2 + spring.value.x) * 0.28,
          y: (event.clientY - bounds.top - bounds.height / 2 + spring.value.y) * 0.28,
        });
      };
      const leave = () => spring.set({ x: 0, y: 0 });
      element.addEventListener('pointermove', move);
      element.addEventListener('pointerleave', leave);
      return () => { spring.stop(); setX(0); setY(0); element.removeEventListener('pointermove', move); element.removeEventListener('pointerleave', leave); };
    });
    return () => media.revert();
  }, { scope: ref });
  return <a ref={ref} className={`exp-magnetic ${className}`} {...props}>{children}</a>;
}

// The knot rests in the room the type leaves open: under "A LITTLE", left of
// "DIFFERENT", on the floor above the closing copy. On phones it leans on the
// portrait. Measured from the real layout, so it never collides with either.
function useKnotSlot(hero) {
  useLayoutEffect(() => {
    const element = hero.current;
    const place = () => {
      const width = element.clientWidth;
      if (!width) return;
      const title = element.querySelector('.exp-hero-title');
      const firstLine = title.querySelector('.exp-title-line');
      const firstLetter = title.querySelector('.exp-title-second .exp-letter');
      const bottom = element.querySelector('.exp-hero-bottom');
      const copy = bottom.querySelector('p');
      const portrait = element.querySelector('.exp-hero-portrait');
      let x, y, size, labelX, labelY;
      if (width >= 800) {
        const pad = parseFloat(getComputedStyle(element).paddingLeft) || 0;
        // The title sits in .exp-hero-titlebox (with its outline copy), so offsets go through the box.
        const titleBox = title.parentElement;
        const ceiling = titleBox.offsetTop + title.offsetTop + firstLine.offsetTop + firstLine.offsetHeight * 0.82;
        const wall = titleBox.offsetLeft + title.offsetLeft + firstLetter.offsetLeft - 12;
        const floor = bottom.offsetTop + copy.offsetTop - 18;
        const room = Math.max(180, wall - pad);
        size = clamp(Math.min(room * 1.12, (floor - ceiling) * 1.05), 200, 620);
        x = pad + room / 2;
        y = Math.max(ceiling + size / 2, floor - size / 2);
        labelX = x + size * 0.16;
        labelY = y + size / 2 + 6;
      } else {
        const mat = portrait.querySelector('.exp-hero-portrait-mat');
        size = clamp(portrait.offsetWidth * 0.66, 120, 230);
        x = portrait.offsetLeft + size * 0.12;
        y = portrait.offsetTop + mat.offsetHeight * 0.74;
        labelX = Math.max(14, x - size * 0.42);
        labelY = Math.max(y + size / 2 + 14, portrait.offsetTop + portrait.offsetHeight + 16);
      }
      element.style.setProperty('--knot-x', `${Math.round(x)}px`);
      element.style.setProperty('--knot-y', `${Math.round(y)}px`);
      element.style.setProperty('--knot-size', `${Math.round(size)}px`);
      element.style.setProperty('--orbit-x', `${Math.round(labelX)}px`);
      element.style.setProperty('--orbit-y', `${Math.round(labelY)}px`);
      heroRig.slot = { x, y, size };
      heroRig.version += 1;
    };
    place();
    const observer = new ResizeObserver(place);
    observer.observe(element);
    let alive = true;
    document.fonts.ready.then(() => { if (alive) place(); });
    return () => { alive = false; observer.disconnect(); };
  }, [hero]);
}

function Hero() {
  const hero = useRef(null);
  useKnotSlot(hero);
  return <section ref={hero} className="exp-hero" id="hero" data-tone="paper" aria-labelledby="hero-title">
    <div className="exp-hero-topline exp-label"><span>Wasiq Tanveer<br />Developer & creative problem solver</span><span>Based in Pakistan<br />Building for everywhere ↗</span></div>
    <div className="exp-hero-titlebox"><h1 id="hero-title" className="exp-hero-title" aria-label="A little different."><span className="exp-title-line" aria-hidden="true">{'A LITTLE'.split('').map((char, index) => <span className="exp-letter" key={index}>{char === ' ' ? '\u00a0' : char}</span>)}</span><span className="exp-title-line exp-title-second" aria-hidden="true">{'DIFFERENT'.split('').map((char, index) => <span className="exp-letter" key={index}>{char}</span>)}<span className="exp-title-dot exp-letter">.</span></span></h1><div className="exp-hero-title-ghost" aria-hidden="true"><span className="exp-ghost-line">{'A LITTLE'.split('').map((char, index) => <span className="exp-ghost-letter" key={index}>{char === ' ' ? ' ' : char}</span>)}</span><span className="exp-ghost-line exp-ghost-second">{'DIFFERENT'.split('').map((char, index) => <span className="exp-ghost-letter" key={index}>{char}</span>)}<span className="exp-ghost-letter">.</span></span></div></div>
    {/* The green arch sits behind the title; the cut-out of Wasiq sits in front of it, so the letters pass behind his head. Both share the portrait classes so one set of tweens drives them. */}
    <div className="exp-hero-portraits">
      <div className="exp-hero-portrait exp-hero-portrait-back"><figure className="exp-hero-portrait-reveal"><div className="exp-hero-portrait-mat" aria-hidden="true" /><figcaption className="exp-label">The human behind the work. <span aria-hidden="true">↗</span></figcaption></figure></div>
      <div className="exp-hero-portrait exp-hero-portrait-front"><figure className="exp-hero-portrait-reveal"><CursorPortrait /><figcaption className="exp-label" aria-hidden="true" style={{ visibility: 'hidden' }}>The human behind the work. <span>↗</span></figcaption></figure></div>
    </div>
    <div className="exp-hero-stage" aria-hidden="true"><Suspense fallback={null}><Sculpture /></Suspense></div>
    <div className="exp-hero-object" aria-hidden="true"><div className="exp-sculpture-fallback"><i /><i /><i /></div></div>
    <span className="exp-orbit-label exp-label" aria-hidden="true">Logic, with a little magic.</span>
    <div className="exp-hero-wipe" aria-hidden="true"><div className="exp-hero-outro"><span className="exp-label">Less scrolling past. More getting into it.</span><p>LET’S<br /><em>get into it.</em></p><span className="exp-outro-arrow">↓</span></div></div>
    <div className="exp-hero-bottom"><a href="#work" className="exp-scroll-cue"><span className="exp-circle-arrow">↓</span><span>SCROLL TO<br />EXPLORE THE GOOD STUFF</span></a><p>I turn complex ideas into<br />websites, tools, and experiences<br />that feel a little more human.</p><span className="exp-edition exp-label">Independent by nature.<br />Curious by default.</span></div>
  </section>;
}

function Portal() {
  return <section className="exp-portal" data-tone="ink" aria-label="A scroll journey through selected projects">
    <div className="exp-portal-top exp-label"><span>Small details. Bigger possibilities.</span><span>Keep going ↓</span></div>
    <div className="exp-portal-grid" aria-hidden="true">
      <div className="exp-portal-tile exp-portal-one"><img src={projects[1].image} alt="" loading="lazy" /></div>
      <div className="exp-portal-tile exp-portal-two"><span>Made<br /><em>to move.</em></span><i><KnotMark /></i></div>
      <div className="exp-portal-tile exp-portal-three"><img src="/projects/Adgroup%20chart.jpg" alt="" loading="lazy" /></div>
      <div className="exp-portal-tile exp-portal-center"><img src={projects[0].image} alt="" loading="eager" /><div className="exp-portal-center-label"><span>01 / ADS ACCELERATION</span><Arrow /></div></div>
      <div className="exp-portal-tile exp-portal-four"><img src={projects[2].image} alt="" loading="lazy" /></div>
      <div className="exp-portal-tile exp-portal-five"><span>Good code.<br />Great feeling.</span><i>↗</i></div>
      <div className="exp-portal-tile exp-portal-six"><img src="/projects/slack%20bsr.png" alt="" loading="lazy" /></div>
    </div>
    <div className="exp-portal-caption"><span className="exp-label">A closer look at what I do</span><p>Ideas into<br /><em>real things.</em></p></div>
    <div className="exp-portal-meter" aria-hidden="true"><span /></div>
  </section>;
}

function Project({ project, index }) {
  const root = useRef(null);
  useGSAP(() => {
    const media = gsap.matchMedia();
    media.add('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)', () => {
      const surface = root.current.querySelector('.exp-project-visual');
      const tilt = root.current.querySelector('.exp-project-tilt');
      const shadow = root.current.querySelector('.exp-browser-shadow');
      // The screen is a heavy slab: it lifts toward you with a deeper shadow,
      // leans after the pointer, sinks when pressed, and rocks past level on exit.
      const spring = createSpring({ rx: 0, ry: 0, lift: 0 }, { stiffness: 150, damping: 13, mass: 1.3, precision: 0.005 }, ({ rx, ry, lift }) => {
        tilt.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg) translateZ(${lift * 36}px)`;
        shadow.style.opacity = String(clamp(lift, 0, 1));
      });
      let held = false;
      const move = (event) => {
        const box = surface.getBoundingClientRect();
        spring.set({ rx: -((event.clientY - box.top) / box.height - 0.5) * 16, ry: ((event.clientX - box.left) / box.width - 0.5) * 20, lift: held ? 0.3 : 1 });
      };
      const leave = () => { held = false; spring.set({ rx: 0, ry: 0, lift: 0 }); };
      const down = () => { held = true; spring.set({ lift: 0.3 }); };
      const up = () => { if (!held) return; held = false; spring.set({ lift: 1 }); };
      surface.addEventListener('pointermove', move);
      surface.addEventListener('pointerleave', leave);
      surface.addEventListener('pointerdown', down);
      window.addEventListener('pointerup', up);
      return () => {
        spring.stop(); tilt.style.transform = ''; shadow.style.opacity = '';
        surface.removeEventListener('pointermove', move); surface.removeEventListener('pointerleave', leave);
        surface.removeEventListener('pointerdown', down); window.removeEventListener('pointerup', up);
      };
    });
    return () => media.revert();
  }, { scope: root });
  return <article ref={root} className={`exp-project exp-project-${index + 1}`}>
    <a className="exp-project-visual" href={project.url} target="_blank" rel="noopener noreferrer" style={{ '--project-color': project.color }} aria-label={`Visit ${project.title} (opens in a new tab)`}>
      <div className="exp-project-art-label"><span>{project.name}</span><span>{project.mark}</span></div>
      <div className="exp-project-tilt"><div className="exp-browser-lift"><i className="exp-browser-shadow" aria-hidden="true" /><div className="exp-browser"><div className="exp-browser-bar"><i /><i /><i /><span>{new URL(project.url).hostname}</span></div><img src={project.image} alt={`${project.title} website interface`} loading="lazy" width="1366" height="650" /></div></div></div>
      <span className="exp-visual-meta exp-label">Thoughtfully built. Ready to use.</span><span className="exp-visit-bubble">View<br />project <Arrow /></span>
    </a>
    <div className="exp-project-info"><span className="exp-project-number exp-label">0{index + 1} / {project.year}</span><div><span className="exp-label">{project.category}</span><h3><a href={project.url} target="_blank" rel="noopener noreferrer">{project.title} <Arrow /></a></h3><p>{project.description}</p><div className="exp-project-tags">{project.tags.map((tag) => <span key={tag}>{tag}</span>)}</div></div></div>
  </article>;
}

function SelectedWork() {
  return <section className="exp-work exp-section-pad" id="work" data-tone="ink" aria-labelledby="work-title">
    <div className="exp-section-kicker exp-label"><span>01 / Work & experiments</span><span>Nine projects. Different possibilities.</span></div>
    <div className="exp-work-heading"><h2 id="work-title" data-reveal><span className="exp-line-mask"><span>Less ordinary.</span></span><span className="exp-line-mask"><em>More considered.</em></span></h2><span className="exp-work-count">(09)</span></div>
    <div className="exp-featured-stage"><div className="exp-rail-status exp-label" aria-hidden="true"><span>SELECTED WORK / <b>01</b> — 03</span><span>SCROLL TO BROWSE <span>⟶</span></span></div><div className="exp-projects exp-featured-rail">{projects.map((project, index) => <Project key={project.title} project={project} index={index} />)}</div><div className="exp-rail-progress" aria-hidden="true"><span /></div></div>
    <a href="#more-work" className="exp-all-work"><span>Three featured. Six more to explore.</span><span>Keep going <span aria-hidden="true">↓</span></span></a>
  </section>;
}

function MoreWork() {
  const words = [['SEARCH', 'ANALYZE', 'COMPARE'], ['CHART', 'TRACK', 'UNDERSTAND'], ['MODERATE', 'AUTOMATE', 'SIMPLIFY'], ['RANK', 'TRACK', 'NOTIFY'], ['TRACK', 'SYNC', 'REPEAT'], ['BORROW', 'RETURN', 'ORGANIZE']];
  return <section id="more-work" className="exp-more-work exp-work exp-section-pad" data-tone="ink" aria-labelledby="more-work-title">
    <div className="exp-section-kicker exp-label"><span>04 — 09 / The rest of the collection</span><span>Small tools. Real usefulness.</span></div>
    <h2 id="more-work-title" data-reveal><span className="exp-line-mask"><span>More of the</span></span><span className="exp-line-mask"><em>good stuff.</em></span></h2>
    <div className="exp-lab-grid">{experiments.map((project, index) => <article className="exp-lab-card" key={project.title}>
      <a className={`exp-lab-art exp-lab-art-${index}`} href={project.url || SOCIAL_LINKS.find(link => link.name === 'GitHub')?.url || 'https://github.com/wasiqtanveer'} target="_blank" rel="noopener noreferrer" aria-label={project.url ? `Visit ${project.title} (opens in a new tab)` : `Explore ${project.title} on Wasiq’s GitHub (opens in a new tab)`}>
        <span className="exp-lab-art-top exp-label"><span>0{index + 4} / {project.type}</span><span>↗</span></span>
        {project.image ? <div className="exp-lab-image"><img src={project.image} alt={`${project.title} interface`} loading="lazy" /></div> : <div className="exp-lab-type" aria-hidden="true">{words[index].map(word => <span key={word}>{word}<i>↗</i></span>)}</div>}
        <span className="exp-lab-art-bottom exp-label">{project.url ? 'Open the project' : 'Explore my GitHub'} <span>↗</span></span>
      </a>
      <div className="exp-lab-copy"><span className="exp-label">{project.type}</span><h3>{project.title}</h3><p>{project.description}</p></div>
    </article>)}</div>
    <Link to="/work" className="exp-all-work"><span>The whole collection, in one place.</span><span>View the project index <Arrow /></span></Link>
  </section>;
}

function MotionRibbon() {
  return <div className="exp-ribbon" data-tone="soft" aria-hidden="true"><div className="exp-ribbon-track">{[0, 1, 2].map((item) => <span key={item}>CURIOUS BY DEFAULT <i><KnotMark /></i> DIFFERENT BY DESIGN <i>↗</i> </span>)}</div></div>;
}

function About() {
  return <section className="exp-about exp-section-pad" id="about" data-tone="paper" aria-labelledby="about-title">
    <div className="exp-section-kicker exp-label"><span>02 / The person behind the pixels</span><span>A developer. And then some.</span></div>
    <div className="exp-about-grid">
      <div className="exp-portrait-wrap"><div className="exp-portrait"><img src="/portrait-sprites/neutral.webp" alt="Wasiq Tanveer" loading="lazy" width="1024" height="1536" /><span className="exp-portrait-star" aria-hidden="true"><KnotMark /></span></div><span className="exp-label">Hello from Pakistan <span aria-hidden="true">↗</span></span></div>
      <div className="exp-about-copy"><h2 id="about-title" data-reveal><span className="exp-line-mask"><span>Curiosity,</span></span><span className="exp-line-mask"><em>put to work.</em></span></h2><p>I’m Wasiq. I build the parts you see, the systems you don’t, and the little details that make everything click.</p><p>Sometimes that’s a full-stack web app. Sometimes it’s a Chrome extension or an automation that quietly saves someone hours. I like making useful things feel effortless.</p><MagneticLink href="/Wasiq_CV_v2.pdf" download className="exp-text-link">A little more about me — my CV <span>↓</span></MagneticLink></div>
    </div>
    <div className="exp-capabilities"><div className="exp-capability-intro"><span className="exp-label">Different disciplines.<br />One connected experience.</span><span className="exp-asterisk" aria-hidden="true"><KnotMark /></span></div><div className="exp-capability-list">
      <details open><summary><span>01</span>Creative development<i>+</i></summary><div><p>Distinctive websites with thoughtful interaction, expressive motion, and a strong point of view.</p><span>React / Next.js / GSAP / Three.js</span></div></details>
      <details><summary><span>02</span>Full-stack products<i>+</i></summary><div><p>From the first interface to the database behind it. Complete web applications, built to be used.</p><span>Node.js / TypeScript / PostgreSQL / Supabase</span></div></details>
      <details><summary><span>03</span>Tools & automation<i>+</i></summary><div><p>Custom extensions, integrations, and workflows that take repetitive work off your hands.</p><span>Python / Chrome Extensions / APIs / GitHub Actions</span></div></details>
    </div></div>
  </section>;
}

// Sending folds the paper card into a plane and throws it off the top right.
// Whatever the outcome, the card then drops back into its place carrying the
// result, so success and failure both arrive with the same weight.
function foldAndFly(card) {
  const away = window.innerWidth * 0.95;
  const up = -window.innerHeight * 0.8;
  return new Promise((resolve) => {
    gsap.timeline({ onComplete: resolve })
      .set(card, { transformOrigin: '50% 50%' })
      .to(card.children, { opacity: 0, duration: 0.16, ease: 'none' }, 0)
      .fromTo(card, { clipPath: 'polygon(0% 0%, 100% 0%, 100% 50%, 100% 100%, 0% 100%)' }, { clipPath: 'polygon(0% 24%, 64% 41%, 100% 50%, 0% 76%, 30% 50%)', duration: 0.42, ease: 'power3.inOut' }, 0.04)
      .to(card, { scale: 0.42, rotation: -6, duration: 0.42, ease: 'power3.inOut' }, 0.04)
      .to(card, { x: away, duration: 0.85, ease: 'power2.in' }, 0.5)
      .to(card, { keyframes: { y: [0, 22, up], ease: 'none' }, rotation: -26, duration: 0.85, ease: 'power1.in' }, 0.5)
      .to(card, { opacity: 0, duration: 0.2, ease: 'none' }, 1.15);
  });
}

function landCard(card, onLand) {
  gsap.timeline()
    .set(card, { clipPath: 'none', x: 0, scale: 1, opacity: 1, rotation: 2.5, y: -window.innerHeight * 0.55, transformOrigin: '50% 100%' })
    .set(card.children, { opacity: 1 })
    .to(card, { y: 0, duration: 0.5, ease: 'power2.in' })
    .add(onLand)
    .fromTo(card, { scaleY: 0.93, scaleX: 1.03 }, { scaleY: 1, scaleX: 1, duration: 0.75, ease: 'elastic.out(1, 0.4)' })
    .to(card, { rotation: 0, duration: 1, ease: 'elastic.out(1, 0.32)' }, '<')
    .set(card, { clearProps: 'clipPath,transformOrigin,scale,rotation,opacity' })
    .set(card.children, { clearProps: 'opacity' });
}

function ContactForm() {
  const [status, setStatus] = useState('idle');
  const [flying, setFlying] = useState(false);
  const sending = useRef(false);
  const card = useRef(null);
  const formRef = useRef(null);
  // A submit attempt with missing or malformed fields: the browser blocks the
  // submit event, so the card shakes its head here, once per attempt. The
  // invalid event does not bubble, so it is caught natively on the way down.
  useEffect(() => {
    let refused = 0;
    const invalid = () => {
      const now = performance.now();
      if (now - refused < 400) return;
      refused = now;
      sound.play('error');
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      const shake = card.current;
      gsap.timeline({ defaults: { ease: 'sine.inOut' } })
        .to(shake, { x: -14, duration: 0.07, ease: 'power2.out' })
        .to(shake, { x: 11, duration: 0.09 })
        .to(shake, { x: -7, duration: 0.08 })
        .to(shake, { x: 4, duration: 0.08 })
        .to(shake, { x: 0, duration: 0.14, ease: 'power2.out' });
    };
    const form = formRef.current;
    form.addEventListener('invalid', invalid, true);
    return () => form.removeEventListener('invalid', invalid, true);
  }, []);
  const submit = async (event) => {
    event.preventDefault();
    if (sending.current) return;
    const form = event.currentTarget;
    const element = card.current;
    const motion = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!form.reportValidity()) return;
    sending.current = true;
    setStatus('sending');
    sound.play('send');
    if (motion) setFlying(true);
    const flight = motion ? foldAndFly(element) : Promise.resolve();
    let result = 'error';
    try {
      const service = import.meta.env.VITE_EMAILJS_SERVICE_ID;
      const template = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
      const key = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;
      if (!service || !template || !key) throw new Error('Email is not configured');
      await emailjs.sendForm(service, template, form, key);
      form.reset();
      result = 'sent';
    } catch { result = 'error'; }
    await flight;
    setStatus(result);
    const outcome = () => sound.play(result === 'sent' ? 'success' : 'error');
    if (motion) { setFlying(false); landCard(element, outcome); } else outcome();
    sending.current = false;
  };
  return <div className="exp-contact-slot" data-flying={flying}><span className="exp-flight-note" aria-hidden="true">Your note is in the air…</span><div ref={card} className="exp-contact-details"><div className="exp-form-heading"><span className="exp-label">LET’S START SOMETHING</span><span aria-hidden="true">↗</span></div><form ref={formRef} className="exp-contact-form" onSubmit={submit}>
    <label className="exp-field"><span><i aria-hidden="true">01</i> Your name</span><input aria-label="Your name" name="from_name" autoComplete="name" required maxLength={100} placeholder="What should I call you?" /></label>
    <label className="exp-field"><span><i aria-hidden="true">02</i> Email address</span><input aria-label="Email address" name="from_email" type="email" autoComplete="email" required maxLength={254} placeholder="you@somewhere.com" /></label>
    <label className="exp-field exp-form-wide"><span><i aria-hidden="true">03</i> What do you have in mind?</span><textarea aria-label="What do you have in mind?" name="message" required minLength={10} maxLength={3000} rows={3} placeholder="A project, a wild idea, or just a hello…" /></label>
    <input type="hidden" name="subject" value="Portfolio project enquiry" /><button className="exp-send" type="submit" disabled={status === 'sending'}><span>{status === 'sending' ? 'Sending your note…' : 'Send your note'}</span><Arrow /></button>
    <div className="exp-form-status" data-status={status} role={status === 'error' ? 'alert' : 'status'}>{status === 'sent' && 'Your note is on its way. Thanks for reaching out!'}{status === 'error' && <>Your note couldn’t be sent. Please <a href={CONTACT_MAILTO}>email me directly</a>.</>}</div>
  </form></div></div>;
}

export function ContactFooter() {
  const footer = useRef(null);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => document.documentElement.classList.toggle('exp-contact-in-view', entry.isIntersecting));
    observer.observe(footer.current);
    return () => { observer.disconnect(); document.documentElement.classList.remove('exp-contact-in-view'); };
  }, []);
  return <footer ref={footer} className="exp-contact exp-section-pad" id="contact" data-tone="accent">
    <div className="exp-contact-aura" aria-hidden="true"><i /><i /></div>
    <div className="exp-section-kicker exp-label"><span>03 / Make something matter</span></div>
    <div className="exp-contact-main"><h2 data-reveal><span className="exp-line-mask"><span>Have a spark?</span></span><span className="exp-line-mask"><em>Let’s make it real.</em></span></h2><MagneticLink href={CONTACT_MAILTO} className="exp-contact-orb" aria-label={`Start a conversation by emailing ${CONTACT_EMAIL}`}><span>LET’S TALK</span><Arrow /></MagneticLink></div>
    <div className="exp-contact-layout"><div className="exp-contact-note"><span className="exp-label">NO PERFECT BRIEF REQUIRED</span><p>A rough idea.<br />A bold what if.<br /><em>Start there.</em></p><MagneticLink href={CONTACT_MAILTO} className="exp-contact-email">{CONTACT_EMAIL} <span>↗</span></MagneticLink><span className="exp-contact-doodle" aria-hidden="true"><KnotMark /></span></div><ContactForm /></div>
    <div className="exp-footer-bottom"><span>© {new Date().getFullYear()} Wasiq Tanveer</span><span>Built with intention. A little obsession, too.</span><div>{SOCIAL_LINKS.map((social) => <a key={social.name} href={social.url} target="_blank" rel="noopener noreferrer">{social.name} ↗</a>)}</div><a href="#top">Back to top ↑</a></div>
    <div className="exp-footer-name" aria-hidden="true">wasiq tanveer<span>®</span></div>
  </footer>;
}

function usePageMotion(root, archive = false) {
  useGSAP(() => {
    const media = gsap.matchMedia();
    media.add({ desktop: '(min-width: 800px)', motion: '(prefers-reduced-motion: no-preference)' }, (context) => {
      if (!context.conditions.motion) return;
      const desktop = context.conditions.desktop;
      const select = gsap.utils.selector(root);
      const cleanups = [];
      if (!archive) {
        // Entrance: everything in the hero has weight. Letters are set down
        // like blocks of type, the portrait drops onto its hook and swings,
        // and the knot (Sculpture.jsx) lands last, jolting the type it shares a floor with.
        const intro = gsap.timeline({ paused: true, onComplete: () => gsap.set('.exp-letter, .exp-ghost-letter, .exp-hero-portrait-reveal', { clearProps: 'all' }) });
        // Begin once whatever is covering the page (preloader or page curtain) lifts.
        let introAlive = true;
        const begin = () => {
          if (!introAlive) return;
          const wait = Math.max(0, (pageCurtain.revealAt - performance.now()) / 1000);
          heroRig.introAt = performance.now() + wait * 1000;
          gsap.delayedCall(wait, () => { if (introAlive) intro.play(); });
        };
        if (pageCurtain.preload) { heroRig.introAt = performance.now() + 3.6e6; pageCurtain.preload.then(begin); } else begin();
        cleanups.push(() => { introAlive = false; });
        let at = 0.08;
        const ghostLines = select('.exp-ghost-line');
        select('.exp-title-line').forEach((line, lineIndex) => {
          const ghostLetters = ghostLines[lineIndex] ? ghostLines[lineIndex].querySelectorAll('.exp-ghost-letter') : [];
          line.querySelectorAll('.exp-letter').forEach((letter, letterIndex) => {
            // The outline copy of each letter (over his head) falls with it.
            const target = ghostLetters[letterIndex] ? [letter, ghostLetters[letterIndex]] : letter;
            intro.fromTo(target, { yPercent: -80 }, { yPercent: 0, duration: 0.42, ease: 'power2.in' }, at)
              .fromTo(target, { opacity: 0 }, { opacity: 1, duration: 0.14, ease: 'none' }, at)
              .fromTo(target, { scaleX: 1.1, scaleY: 0.8 }, { scaleX: 1, scaleY: 1, duration: 0.8, ease: 'elastic.out(1, 0.38)', immediateRender: false }, at + 0.42);
            at += 0.034;
          });
          at += 0.07;
        });
        intro.fromTo('.exp-hero-portrait-reveal', { y: -110, rotation: 5, transformOrigin: '50% 0%' }, { y: 10, duration: 0.5, ease: 'power2.in' }, 0.3)
          .fromTo('.exp-hero-portrait-reveal', { opacity: 0 }, { opacity: 1, duration: 0.18, ease: 'none' }, 0.3)
          .to('.exp-hero-portrait-reveal', { y: 0, duration: 0.9, ease: 'elastic.out(1, 0.35)' }, 0.8)
          .to('.exp-hero-portrait-reveal', { rotation: 0, duration: 1.8, ease: 'elastic.out(1, 0.22)' }, 0.8);
        const jolt = (event) => gsap.fromTo('.exp-hero-title, .exp-hero-title-ghost', { y: 9 * event.detail }, { y: 0, duration: 0.7, ease: 'elastic.out(1, 0.3)', overwrite: 'auto' });
        window.addEventListener('exp:knot-impact', jolt);
        cleanups.push(() => { window.removeEventListener('exp:knot-impact', jolt); heroRig.introAt = undefined; });

        let wiped = false;
        const heroJourney = gsap.timeline({ scrollTrigger: { trigger: '.exp-hero', start: 'top top', end: desktop ? '+=120%' : 'bottom top', pin: desktop, scrub: 0.5, anticipatePin: 1, invalidateOnRefresh: true,
          onUpdate: (self) => {
            const past = self.progress > 0.42;
            if (past !== wiped) { wiped = past; sound.play('wipe', { direction: past ? 1 : -1 }); }
            // Once the red circle fills the screen, the scrollbar turns red with it.
            const tone = self.progress > 0.62 ? 'accent' : 'paper';
            if (self.isActive && document.documentElement.dataset.scrollTone !== tone) document.documentElement.dataset.scrollTone = tone;
          },
        } });
        heroJourney.to('.exp-title-line:first-child, .exp-ghost-line:first-child', { xPercent: -80, rotation: -8, opacity: 0, duration: 0.65, ease: 'none' }, 0)
          .to('.exp-title-second, .exp-ghost-second', { xPercent: 85, rotation: 8, opacity: 0, duration: 0.65, ease: 'none' }, 0.03)
          .to(heroRig, { journey: 1, duration: 0.8, ease: 'none' }, 0)
          .to('.exp-hero-object', { scale: desktop ? 2.5 : 1.65, rotation: 65, yPercent: -12, duration: 0.8, ease: 'none' }, 0)
          .to('.exp-hero-portrait', { scale: 1.25, rotation: -8, xPercent: -12, yPercent: -10, duration: 0.6, ease: 'none' }, 0)
          .to('.exp-hero-portrait', { opacity: 0, duration: 0.22, ease: 'none' }, 0.38)
          .to('.exp-hero-topline, .exp-hero-bottom, .exp-orbit-label', { opacity: 0, y: -35, duration: 0.25 }, 0)
          .fromTo('.exp-hero-wipe', { clipPath: 'circle(0% at 50% 50%)' }, { clipPath: 'circle(78% at 50% 50%)', duration: 0.6, ease: 'none' }, 0.4)
          .fromTo('.exp-hero-outro', { yPercent: 35, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.3, ease: 'power3.out' }, 0.7);
        heroJourney.scrollTrigger.refresh();
        const portal = select('.exp-portal')[0];
        if (desktop) {
          let dived = false;
          const journey = gsap.timeline({ scrollTrigger: { trigger: portal, start: 'top top', end: '+=170%', pin: true, scrub: 0.55, anticipatePin: 1, invalidateOnRefresh: true,
            onUpdate: (self) => {
              const past = self.progress > 0.5;
              if (past !== dived) { dived = past; sound.play('dive', { direction: past ? 1 : -1 }); }
            },
          } });
          journey.fromTo('.exp-portal-grid', { scale: 0.76, rotation: -6 }, { scale: () => Math.max(1 / 0.39, window.innerHeight / (window.innerWidth * 0.39 * 0.58)) * 1.12, rotation: 0, ease: 'none', duration: 1 }, 0)
            .to('.exp-portal-top', { opacity: 0, duration: 0.15 }, 0)
            .to('.exp-portal-center-label', { opacity: 0, duration: 0.2 }, 0.1)
            .to('.exp-portal-center img', { opacity: 0.15, duration: 0.3 }, 0.62)
            .fromTo('.exp-portal-caption', { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.25 }, 0.62)
            .fromTo('.exp-portal-meter span', { scaleX: 0 }, { scaleX: 1, ease: 'none', duration: 1 }, 0);
          const satellites = select('.exp-portal-tile:not(.exp-portal-center)');
          satellites.forEach((tile, index) => {
            const side = index % 2 ? 1 : -1;
            journey.to(tile, { xPercent: side * 65, yPercent: index < 3 ? -65 : 65, rotation: side * 32, rotationY: side * 20, duration: 0.75, ease: 'none' }, 0.1);
          });
          // A timeline defers its first refresh. Resolve its pin spacing now,
          // before route anchors measure any sections below the gallery.
          journey.scrollTrigger.refresh();
        } else {
          gsap.fromTo('.exp-portal-grid', { scale: 0.75, rotation: -9 }, { scale: 1.3, rotation: 6, ease: 'none', scrollTrigger: { trigger: portal, start: 'top bottom', end: 'bottom top', scrub: true } });
        }

        const stage = select('.exp-featured-stage')[0];
        const rail = select('.exp-featured-rail')[0];
        if (desktop) {
          stage.dataset.horizontal = 'true';
          const distance = () => Math.max(0, rail.scrollWidth - stage.clientWidth);
          const counter = stage.querySelector('.exp-rail-status b');
          let shown = 1;
          const travel = gsap.timeline({ scrollTrigger: { trigger: stage, start: 'top top', end: () => `+=${distance()}`, pin: true, scrub: 0.55, anticipatePin: 1, invalidateOnRefresh: true,
            // The rail clicks over like a notched dial as each project arrives.
            onUpdate: (self) => {
              const index = Math.min(3, 1 + Math.floor(self.progress * 2.99));
              if (index === shown) return;
              shown = index;
              counter.textContent = String(index).padStart(2, '0');
              sound.play('detent');
            },
          } });
          travel.to(rail, { x: () => -distance(), duration: 1, ease: 'none' }, 0)
            .fromTo('.exp-rail-progress span', { scaleX: 0 }, { scaleX: 1, duration: 1, ease: 'none' }, 0);
          travel.scrollTrigger.refresh();
          rail.querySelectorAll('.exp-project').forEach((card) => {
            gsap.fromTo(card.querySelector('.exp-project-visual'), { rotationY: 14, scale: 0.9 }, { rotationY: 0, scale: 1, ease: 'none', scrollTrigger: { trigger: card, containerAnimation: travel, start: 'left 95%', end: 'left 10%', scrub: true } });
          });
          // Tabbing to an offscreen project brings it into view instantly.
          const focus = (event) => {
            const card = event.target.closest('.exp-project');
            if (!card || !event.target.matches(':focus-visible')) return;
            const progress = Math.min(1, card.offsetLeft / distance());
            const trigger = travel.scrollTrigger;
            const y = trigger.start + (trigger.end - trigger.start) * progress;
            if (window.__lenis) window.__lenis.scrollTo(y, { immediate: true });
            else window.scrollTo(0, y);
            travel.progress(progress);
          };
          stage.addEventListener('focusin', focus);
          cleanups.push(() => { stage.removeEventListener('focusin', focus); delete stage.dataset.horizontal; });
        }
        gsap.fromTo('.exp-ribbon-track', { xPercent: -8 }, { xPercent: -42, ease: 'none', scrollTrigger: { trigger: '.exp-ribbon', start: 'top bottom', end: 'bottom top', scrub: 0.35 } });
        if (desktop) {
          // Momentum: on a fast scroll, heavy things hang back (the ribbon leans,
          // the cards trail), then settle with a small rebound when you stop.
          const skew = gsap.quickSetter('.exp-ribbon-track', 'skewX', 'deg');
          const arts = select('.exp-lab-art').map((art, index) => ({ set: gsap.quickSetter(art, 'y', 'px'), weight: index % 2 ? 1.5 : 1 }));
          const momentum = createSpring({ v: 0 }, { stiffness: 60, damping: 9.5, precision: 0.5 }, ({ v }) => {
            skew(clamp(v * -0.0035, -9, 9));
            arts.forEach(({ set, weight }) => set(clamp(v * 0.011 * weight, -46, 46)));
          });
          let lastY = window.scrollY;
          const sample = (time, deltaTime) => {
            const y = window.scrollY;
            const velocity = deltaTime > 0 ? (y - lastY) / (deltaTime / 1000) : 0;
            lastY = y;
            momentum.set({ v: Math.abs(velocity) < 40 ? 0 : clamp(velocity, -4200, 4200) });
          };
          gsap.ticker.add(sample);
          cleanups.push(() => { gsap.ticker.remove(sample); momentum.stop(); });
        }
        gsap.fromTo('.exp-portrait-wrap', { y: 100, rotation: -16, clipPath: 'inset(12% 0% 12% 0% round 30%)' }, { y: 0, rotation: -4, clipPath: 'inset(0% 0% 0% 0% round 0%)', ease: 'none', scrollTrigger: { trigger: '.exp-about-grid', start: 'top 90%', end: 'center center', scrub: 0.5 } });
        gsap.to('.exp-portrait-star, .exp-asterisk', { rotation: 180, ease: 'none', scrollTrigger: { trigger: '.exp-about', start: 'top bottom', end: 'bottom top', scrub: 0.5 } });
        select('.exp-lab-card').forEach((card, index) => {
          gsap.fromTo(card, { y: desktop ? 110 : 55, rotation: index % 2 ? 3 : -3, scale: 0.94 }, { y: 0, rotation: 0, scale: 1, ease: 'none', scrollTrigger: { trigger: card, start: 'top 95%', end: 'top 45%', scrub: 0.45 } });
          const art = card.querySelector('.exp-lab-image');
          if (art) gsap.fromTo(art, { yPercent: 10, rotation: -3 }, { yPercent: -6, rotation: 2, ease: 'none', scrollTrigger: { trigger: card, start: 'top bottom', end: 'bottom top', scrub: 0.45 } });
        });
      }
      select('[data-reveal]').forEach((element) => {
        const lines = element.querySelectorAll('.exp-line-mask > *');
        // Masked lines are solid: they rise and level out, they never fade.
        const trigger = { trigger: element, start: 'top 90%', toggleActions: 'play none none reverse' };
        if (lines.length) gsap.from(lines, { yPercent: 118, rotation: 4, duration: 0.85, stagger: 0.08, ease: 'expo.out', scrollTrigger: trigger });
        else gsap.from(element, { yPercent: 25, opacity: 0, duration: 0.85, ease: 'expo.out', scrollTrigger: trigger });
      });
      select('.exp-project-visual').forEach((element) => {
        if (desktop && !archive) return;
        gsap.fromTo(element.querySelector('.exp-browser-lift'), { yPercent: 9, rotation: -3, scale: 0.96 }, { yPercent: -5, rotation: 1, scale: 1.02, ease: 'none', scrollTrigger: { trigger: element, start: 'top bottom', end: 'bottom top', scrub: true } });
      });
      gsap.fromTo('.exp-contact', { clipPath: `inset(0% 0% 0% 0% round ${desktop ? 140 : 45}px ${desktop ? 140 : 45}px 0px 0px)` }, { clipPath: 'inset(0% 0% 0% 0% round 0px 0px 0px 0px)', ease: 'none', scrollTrigger: { trigger: '.exp-contact', start: 'top bottom', end: 'top 30%', scrub: 0.45 } });
      gsap.fromTo('.exp-contact-orb', { rotation: -80, scale: 0.6, y: 80 }, { rotation: 0, scale: 1, y: 0, ease: 'none', scrollTrigger: { trigger: '.exp-contact', start: 'top bottom', end: 'top 20%', scrub: 0.5 } });
      gsap.from('.exp-contact-details', { y: 70, rotation: 3, opacity: 0, duration: 0.9, ease: 'expo.out', scrollTrigger: { trigger: '.exp-contact-layout', start: 'top 90%', toggleActions: 'play none none reverse' } });
      gsap.from('.exp-contact-note > :not(.exp-contact-doodle)', { y: 45, opacity: 0, stagger: 0.07, duration: 0.7, ease: 'expo.out', scrollTrigger: { trigger: '.exp-contact-layout', start: 'top 90%', toggleActions: 'play none none reverse' } });
      gsap.to('.exp-contact-doodle', { rotation: 220, ease: 'none', scrollTrigger: { trigger: '.exp-contact-layout', start: 'top bottom', end: 'bottom top', scrub: 0.5 } });
      gsap.fromTo('.exp-contact-aura', { rotation: -25, scale: 0.8, yPercent: 15 }, { rotation: 20, scale: 1.3, yPercent: -15, ease: 'none', scrollTrigger: { trigger: '.exp-contact', start: 'top bottom', end: 'bottom top', scrub: 0.6 } });
      gsap.fromTo('.exp-footer-name', { yPercent: 80 }, { yPercent: 0, ease: 'none', scrollTrigger: { trigger: '.exp-contact', start: 'top 20%', end: 'bottom bottom', scrub: 0.5 } });
      return () => cleanups.forEach((cleanup) => cleanup());
    });
    const refresh = () => { ScrollTrigger.refresh(); window.__lenis?.resize(); };
    let toggleFrame;
    const onToggle = () => { cancelAnimationFrame(toggleFrame); toggleFrame = requestAnimationFrame(refresh); };
    const element = root.current;
    element.addEventListener('toggle', onToggle, true);
    let alive = true;
    document.fonts.ready.then(() => { if (alive) refresh(); });
    const refreshFrame = requestAnimationFrame(refresh);
    return () => { alive = false; cancelAnimationFrame(refreshFrame); cancelAnimationFrame(toggleFrame); element.removeEventListener('toggle', onToggle, true); media.revert(); };
  }, { scope: root, dependencies: [archive] });
}

export default function Portfolio() {
  const root = useRef(null);
  usePageMotion(root);
  return <div ref={root} className="exp-page"><main id="main-content" tabIndex={-1}><Hero /><Portal /><SelectedWork /><MoreWork /><MotionRibbon /><About /></main><ContactFooter /></div>;
}

export function WorkIndex() {
  const root = useRef(null);
  usePageMotion(root, true);
  useLayoutEffect(() => { const title = document.title; document.title = 'Selected work & experiments — Wasiq Tanveer'; return () => { document.title = title; }; }, []);
  return <div ref={root} className="exp-page"><main id="main-content" className="exp-archive" data-tone="ink" tabIndex={-1}>
    <section className="exp-work exp-section-pad"><div className="exp-section-kicker exp-label"><Link to="/">← Back to the good stuff</Link><span>Projects & experiments</span></div><h1 data-reveal>The work.<br /><em>And the play.</em></h1><div className="exp-projects">{projects.map((project, index) => <Project key={project.title} project={project} index={index} />)}</div>
      <div className="exp-experiments"><div className="exp-section-kicker exp-label"><span>The other side of the work</span><span>Tools / Systems / Experiments</span></div><h2 data-reveal>Quietly useful.</h2>{experiments.map((experiment, index) => <details key={experiment.title} className="exp-experiment"><summary><span className="exp-label">0{index + 4}</span><h3>{experiment.title}</h3><span className="exp-label">{experiment.type}</span><i>+</i></summary><div className="exp-experiment-content">{experiment.image ? <img src={experiment.image} alt={`${experiment.title} interface`} loading="lazy" /> : <div className="exp-experiment-placeholder" aria-hidden="true"><span>↗</span><span>{experiment.type}</span></div>}<div><p>{experiment.description}</p><a href={experiment.url || 'https://github.com/wasiqtanveer'} target="_blank" rel="noopener noreferrer" className="exp-text-link">{experiment.url ? 'Visit the project' : 'Explore my GitHub'} <Arrow /></a></div></div></details>)}</div>
    </section></main><ContactFooter /></div>;
}
