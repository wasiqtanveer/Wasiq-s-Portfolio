import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';

/**
 * WebGL ambient scene rendered behind all content — VOLCANIC theme.
 *  - Soft glowing embers rise slowly out of the deep (round glow sprites,
 *    not square points — no "digital rain / matrix" feel)
 *  - A handful of brighter sparks drift among them
 *  - Camera dollies forward as the page is scrolled (ties the field to scroll)
 *  - Camera sways toward the cursor + embers are gently repelled by it
 *
 * Performance guards: capped DPR, reduced counts on mobile, paused when the
 * tab is hidden, and skipped entirely for prefers-reduced-motion.
 */

// Soft radial glow sprite — turns square GL points into round embers.
function makeGlowTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.35, 'rgba(255,255,255,0.55)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 64, 64);
  const tex = new THREE.CanvasTexture(c);
  tex.needsUpdate = true;
  return tex;
}

export default function Scene3D() {
  const mountRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) return;

    const isMobile = window.matchMedia('(pointer: coarse)').matches;

    // Size from the MOUNT's actual box, not window.innerHeight (which disagrees
    // with the CSS layout viewport and used to leave a flickering edge gap).
    const measure = () => {
      const r = mount.getBoundingClientRect();
      return {
        w: Math.round(r.width) || window.innerWidth,
        h: Math.round(r.height) || window.innerHeight,
      };
    };
    let { w: width, h: height } = measure();

    // ── Renderer ────────────────────────────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({
      antialias: !isMobile,
      alpha: false,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: false, // must stay false — copying the buffer each frame lags
      failIfMajorPerformanceCaveat: false,
    });
    // DPR capped at 1.5: invisible difference for a dim backdrop, ~44% less fill cost.
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.25 : 1.5));
    renderer.setSize(width, height, false);
    renderer.setClearColor(0x0b0b0b, 1); // opaque volcanic black — the readability backdrop
    mount.appendChild(renderer.domElement);

    // CSS stretches the canvas to ALWAYS cover the container exactly.
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.display = 'block';

    // ── Scene & camera ──────────────────────────────────────────────────────
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x0b0b0b, 0.055); // field fades into the black

    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 100);
    camera.position.set(0, 0, 14);

    const glowTex = makeGlowTexture();

    // ── Ember field ─────────────────────────────────────────────────────────
    // Embers spawn low and drift upward with a lazy sideways wobble, like heat
    // rising off a caldera. Reaching the top, they respawn at the bottom.
    const FIELD_X = 46;   // horizontal spread
    const TOP_Y = 14;     // despawn height
    const BOT_Y = -14;    // respawn height
    const FIELD_Z = 18;   // depth spread

    const makeEmberLayer = (count, size, opacity, color) => {
      const positions = new Float32Array(count * 3);
      const speeds = new Float32Array(count);   // upward drift per frame
      const phases = new Float32Array(count);   // wobble phase offset
      const wobble = new Float32Array(count);   // wobble amplitude
      for (let i = 0; i < count; i++) {
        positions[i * 3]     = (Math.random() - 0.5) * FIELD_X;
        positions[i * 3 + 1] = BOT_Y + Math.random() * (TOP_Y - BOT_Y);
        positions[i * 3 + 2] = (Math.random() - 0.5) * FIELD_Z;
        speeds[i] = 0.006 + Math.random() * 0.016;
        phases[i] = Math.random() * Math.PI * 2;
        wobble[i] = 0.002 + Math.random() * 0.005;
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      const mat = new THREE.PointsMaterial({
        map: glowTex,
        color: new THREE.Color(color),
        size,
        transparent: true,
        opacity,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        sizeAttenuation: true,
      });
      const points = new THREE.Points(geo, mat);
      scene.add(points);
      return { geo, mat, points, speeds, phases, wobble, count };
    };

    // Many soft dim embers + a few bright sparks — green-on-charcoal, on brand.
    const embers = makeEmberLayer(isMobile ? 600 : 1400, 0.16, 0.45, '#39FF14');
    const sparks = makeEmberLayer(isMobile ? 50 : 120, 0.34, 0.8, '#8aff5e');

    // ── Pointer + scroll tracking (kept — the field stays reactive) ─────────
    const pointer = { x: 0, y: 0 };
    const target = { x: 0, y: 0 };
    let scrollProgress = 0;

    const mouseNDC = new THREE.Vector2(0, 0);
    const mouseWorld = new THREE.Vector3();
    const raycaster = new THREE.Raycaster();
    const groundPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);

    const onPointerMove = (e) => {
      target.x = (e.clientX / width - 0.5) * 2;
      target.y = (e.clientY / height - 0.5) * 2;
      mouseNDC.x = (e.clientX / width) * 2 - 1;
      mouseNDC.y = -(e.clientY / height) * 2 + 1;
    };

    const readScroll = () => {
      const lenis = window.__lenis;
      if (lenis && typeof lenis.progress === 'number') {
        scrollProgress = lenis.progress;
      } else {
        const doc = document.documentElement;
        const max = doc.scrollHeight - doc.clientHeight;
        scrollProgress = max > 0 ? doc.scrollTop / max : 0;
      }
    };

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('scroll', readScroll, { passive: true });

    // ── Resize ──────────────────────────────────────────────────────────────
    const onResize = () => {
      const m = measure();
      width = m.w;
      height = m.h;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
    };
    window.addEventListener('resize', onResize);

    // ── Animation loop ──────────────────────────────────────────────────────
    const clock = new THREE.Clock();
    let rafId = 0;
    let running = true;
    let frameParity = false; // render every 2nd frame — see note in tick()

    const updateLayer = (layer, t, mx, my, repel) => {
      const pos = layer.geo.attributes.position.array;
      for (let i = 0; i < layer.count; i++) {
        const ix = i * 3;
        // rise + lazy sideways wobble (heat-haze feel)
        pos[ix + 1] += layer.speeds[i];
        pos[ix] += Math.sin(t * 0.6 + layer.phases[i]) * layer.wobble[i];

        // respawn at the bottom once an ember escapes the top
        if (pos[ix + 1] > TOP_Y) {
          pos[ix + 1] = BOT_Y;
          pos[ix] = (Math.random() - 0.5) * FIELD_X;
        }

        // soft repulsion around the cursor
        if (repel) {
          const dx = pos[ix] - mx;
          const dy = pos[ix + 1] - my;
          const d2 = dx * dx + dy * dy;
          if (d2 < 9) {
            const f = (1 - d2 / 9) * 0.06;
            pos[ix] += dx * f;
            pos[ix + 1] += dy * f;
          }
        }
      }
      layer.geo.attributes.position.needsUpdate = true;
    };

    const tick = () => {
      if (!running) return;
      rafId = requestAnimationFrame(tick);

      const t = clock.getElapsedTime();

      // Smooth the pointer for the parallax sway
      pointer.x += (target.x - pointer.x) * 0.04;
      pointer.y += (target.y - pointer.y) * 0.04;

      readScroll();

      // Camera dollies forward through the embers on scroll + sways to cursor
      camera.position.x += (pointer.x * 2.2 - camera.position.x) * 0.05;
      camera.position.y += (-pointer.y * 1.6 - camera.position.y) * 0.05;
      camera.position.z = 14 - scrollProgress * 10;
      camera.lookAt(0, 0, 0);

      // Project the cursor onto the z=0 plane so embers can shy away from it
      raycaster.setFromCamera(mouseNDC, camera);
      raycaster.ray.intersectPlane(groundPlane, mouseWorld);

      updateLayer(embers, t, mouseWorld.x, mouseWorld.y, true);
      updateLayer(sparks, t, mouseWorld.x, mouseWorld.y, true);

      // Render at HALF the display rate (state still updates every frame, so
      // motion timing is unchanged). Every canvas repaint forces the liquid
      // glass cards to re-blur their backdrop — at 60fps that re-blur was what
      // tanked scroll FPS the moment the big project cards entered the
      // viewport. 30fps embers are indistinguishable (they drift slowly and
      // are viewed through a blur), but it halves the whole pipeline's cost.
      frameParity = !frameParity;
      if (frameParity) renderer.render(scene, camera);
    };

    const start = () => { if (!running) { running = true; clock.start(); tick(); } };
    const stop = () => { running = false; cancelAnimationFrame(rafId); };

    const onVisibility = () => (document.hidden ? stop() : start());
    document.addEventListener('visibilitychange', onVisibility);

    readScroll();
    tick();

    // ── Cleanup ─────────────────────────────────────────────────────────────
    return () => {
      stop();
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('scroll', readScroll);
      window.removeEventListener('resize', onResize);

      embers.geo.dispose();
      embers.mat.dispose();
      sparks.geo.dispose();
      sparks.mat.dispose();
      glowTex.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === mount) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Absolute + z-index 0: fills the Background container at the back of its
  // stacking context. The canvas is opaque, so it IS the dark backdrop.
  return (
    <div
      ref={mountRef}
      aria-hidden="true"
      className="absolute inset-0 pointer-events-none"
      style={{ zIndex: 0 }}
    />
  );
}
