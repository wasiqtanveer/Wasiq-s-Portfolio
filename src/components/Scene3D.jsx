import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';

/**
 * WebGL ambient scene rendered behind all content.
 *  - A deep field of drifting particles (parallax starfield feel)
 *  - Slowly rotating wireframe icosahedrons in the cyberpunk green
 *  - Camera dollies forward as the page is scrolled (ties 3D to scroll)
 *  - Camera eases toward the cursor for a subtle parallax / 3D tilt
 *
 * Performance guards: capped DPR, reduced geometry on mobile, paused when
 * the tab is hidden, and skipped entirely for prefers-reduced-motion.
 */
export default function Scene3D() {
  const mountRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) return;

    const isMobile = window.matchMedia('(pointer: coarse)').matches;

    const GREEN = new THREE.Color('#39FF14');

    let width = window.innerWidth;
    let height = window.innerHeight;

    // ── Renderer ────────────────────────────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({ antialias: !isMobile, alpha: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.5 : 2));
    renderer.setSize(width, height);
    renderer.setClearColor(0x000000, 0); // transparent — CSS background shows through
    mount.appendChild(renderer.domElement);

    // ── Scene & camera ──────────────────────────────────────────────────────
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x141210, 0.06);

    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 100);
    camera.position.set(0, 0, 14);

    // ── Particle field ──────────────────────────────────────────────────────
    const PARTICLE_COUNT = isMobile ? 700 : 1600;
    const positions = new Float32Array(PARTICLE_COUNT * 3);
    const speeds = new Float32Array(PARTICLE_COUNT);
    const FIELD = 40;
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      positions[i * 3] = (Math.random() - 0.5) * FIELD;
      positions[i * 3 + 1] = (Math.random() - 0.5) * FIELD;
      positions[i * 3 + 2] = (Math.random() - 0.5) * FIELD;
      speeds[i] = 0.3 + Math.random() * 0.7;
    }
    const particleGeo = new THREE.BufferGeometry();
    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const particleMat = new THREE.PointsMaterial({
      color: GREEN,
      size: isMobile ? 0.045 : 0.035,
      transparent: true,
      opacity: 0.38,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    // ── Floating wireframe shapes ───────────────────────────────────────────
    const shapes = [];
    const shapeMat = new THREE.MeshBasicMaterial({
      color: GREEN,
      wireframe: true,
      transparent: true,
      opacity: 0.12,
    });
    const SHAPE_COUNT = isMobile ? 4 : 7;
    const geometries = [
      new THREE.IcosahedronGeometry(1, 0),
      new THREE.OctahedronGeometry(1, 0),
      new THREE.TorusGeometry(0.9, 0.32, 8, 18),
    ];
    for (let i = 0; i < SHAPE_COUNT; i++) {
      const geo = geometries[i % geometries.length];
      const mesh = new THREE.Mesh(geo, shapeMat.clone());
      mesh.position.set(
        (Math.random() - 0.5) * 24,
        (Math.random() - 0.5) * 16,
        (Math.random() - 0.5) * 18 - 4
      );
      const s = 0.7 + Math.random() * 1.8;
      mesh.scale.setScalar(s);
      mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
      mesh.userData.spin = {
        x: (Math.random() - 0.5) * 0.0025,
        y: (Math.random() - 0.5) * 0.0025,
      };
      mesh.userData.floatSeed = Math.random() * Math.PI * 2;
      mesh.userData.baseY = mesh.position.y;
      scene.add(mesh);
      shapes.push(mesh);
    }

    // ── Pointer + scroll tracking ───────────────────────────────────────────
    const pointer = { x: 0, y: 0 };
    const target = { x: 0, y: 0 };
    let scrollProgress = 0;

    // Mouse projected into the 3D world (z=0 plane) so shapes can react to it
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
      width = window.innerWidth;
      height = window.innerHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    window.addEventListener('resize', onResize);

    // ── Animation loop ──────────────────────────────────────────────────────
    const clock = new THREE.Clock();
    let rafId = 0;
    let running = true;

    const tick = () => {
      if (!running) return;
      rafId = requestAnimationFrame(tick);

      const t = clock.getElapsedTime();

      // Smooth the pointer for the parallax tilt
      pointer.x += (target.x - pointer.x) * 0.04;
      pointer.y += (target.y - pointer.y) * 0.04;

      readScroll();

      // Camera dollies forward through the field on scroll + parallax sway
      camera.position.x += (pointer.x * 2.2 - camera.position.x) * 0.05;
      camera.position.y += (-pointer.y * 1.6 - camera.position.y) * 0.05;
      camera.position.z = 14 - scrollProgress * 10;
      camera.lookAt(0, 0, 0);

      // Project the cursor onto the z=0 plane so the field can react to it
      raycaster.setFromCamera(mouseNDC, camera);
      raycaster.ray.intersectPlane(groundPlane, mouseWorld);

      // Drift particles upward (endless field) + ripple away from the cursor
      const pos = particleGeo.attributes.position.array;
      const mx = mouseWorld.x;
      const my = mouseWorld.y;
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const ix = i * 3;
        pos[ix + 1] += speeds[i] * 0.004;
        if (pos[ix + 1] > FIELD / 2) pos[ix + 1] = -FIELD / 2;

        // Soft repulsion within a radius of the cursor
        const dx = pos[ix] - mx;
        const dy = pos[ix + 1] - my;
        const d2 = dx * dx + dy * dy;
        if (d2 < 9) {
          const f = (1 - d2 / 9) * 0.06;
          pos[ix] += dx * f;
          pos[ix + 1] += dy * f;
        }
      }
      particleGeo.attributes.position.needsUpdate = true;
      particles.rotation.y = t * 0.01;

      // Spin + bob the shapes, and lean them gently toward the cursor
      for (const m of shapes) {
        m.rotation.x += m.userData.spin.x;
        m.rotation.y += m.userData.spin.y;
        m.position.y = m.userData.baseY + Math.sin(t * 0.4 + m.userData.floatSeed) * 0.6;

        // Subtle attraction toward the projected cursor position
        const ax = (mouseWorld.x - m.position.x);
        const ay = (mouseWorld.y - m.position.y);
        m.rotation.z += (Math.atan2(ay, ax) * 0.02 - m.rotation.z) * 0.02;
        const dist = Math.hypot(ax, ay);
        const pull = dist < 8 ? (1 - dist / 8) * 0.012 : 0;
        m.position.x += ax * pull;
      }

      renderer.render(scene, camera);
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

      particleGeo.dispose();
      particleMat.dispose();
      geometries.forEach((g) => g.dispose());
      shapes.forEach((m) => m.material.dispose());
      renderer.dispose();
      if (renderer.domElement.parentNode === mount) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Opaque theme-base backing + an explicit compositor layer (translateZ).
  // The WebGL canvas clears to transparent, so if the GPU ever drops or
  // mis-composites a frame there is a solid dark fill behind it instead of
  // raw black — this is what was flashing through in large chunks.
  // Absolute (not fixed) + z-index 0: it fills the Background container and
  // sits at the back of that single stacking context.
  return (
    <div
      ref={mountRef}
      aria-hidden="true"
      className="absolute inset-0 pointer-events-none"
      style={{ zIndex: 0, backgroundColor: '#141210', transform: 'translateZ(0)' }}
    />
  );
}
