import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { heroRig, pageCurtain } from './motion';
import { sound } from './sfx';

// The knot is a heavy, molten object, not a floating decoration. It drops in
// under gravity, lands on a contact shadow, and can be grabbed, flung, and
// poked. The canvas covers the whole hero so the knot can be placed by the
// real layout (heroRig.slot) and grow during the scroll transition without
// ever being upscaled as a bitmap.

const KNOT_RADIUS = 3.72; // outer extent of the knot in its own units
const GRAVITY = 5200; // px/s², the same on every screen size
const TAU = Math.PI * 2;
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const lerp = (a, b, t) => a + (b - a) * t;

function shadowTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 128;
  const context = canvas.getContext('2d');
  // White falloff; the material tints it with the palette's shadow colour.
  const gradient = context.createRadialGradient(64, 64, 0, 64, 64, 64);
  gradient.addColorStop(0, 'rgba(255, 255, 255, 0.6)');
  gradient.addColorStop(0.45, 'rgba(255, 255, 255, 0.25)');
  gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
  context.fillStyle = gradient;
  context.fillRect(0, 0, 128, 128);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function mountSculpture(element) {
    const hero = element.closest('.exp-hero');
    const root = document.documentElement;
    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' });
    } catch {
      hero.dataset.knot = 'fallback'; // The CSS rings take over without WebGL.
      window.dispatchEvent(new Event('exp:knot-ready'));
      return;
    }
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)');
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.6));
    renderer.setClearColor(0x000000, 0);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.5;
    element.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
    camera.position.z = 16;
    const viewHeight = 2 * camera.position.z * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    const room = new RoomEnvironment();
    const generator = new THREE.PMREMGenerator(renderer);
    const environment = generator.fromScene(room, 0.04, 0.1, 100, { size: 128 });
    scene.environment = environment.texture;
    room.dispose();
    generator.dispose();

    const geometry = new THREE.TorusKnotGeometry(2.05, 0.65, 220, 36, 2, 3);
    const material = new THREE.MeshStandardMaterial({ color: 0xe0c2a7, metalness: 0.96, roughness: 0.16 });
    const liquidTime = { value: 0 };
    const liquidAmount = { value: 0.1 };
    material.onBeforeCompile = (shader) => {
      shader.uniforms.liquidTime = liquidTime;
      shader.uniforms.liquidAmount = liquidAmount;
      shader.vertexShader = `uniform float liquidTime;\nuniform float liquidAmount;\n${shader.vertexShader}`;
      shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>', `
        #include <begin_vertex>
        float liquidWave = sin(position.x * 2.4 + liquidTime) * cos(position.y * 1.7 - liquidTime * 0.7);
        transformed += normal * liquidWave * liquidAmount;
      `);
    };

    // rig: placement + scroll journey. body: height above the floor.
    // squash: impact deformation. knot: orientation.
    const rig = new THREE.Group();
    const body = new THREE.Group();
    const squash = new THREE.Group();
    const knot = new THREE.Mesh(geometry, material);
    knot.scale.set(1, 1.08, 1);
    const pickGeometry = new THREE.TorusKnotGeometry(2.05, 0.85, 72, 8, 2, 3);
    const pickMaterial = new THREE.MeshBasicMaterial();
    const pickProxy = new THREE.Mesh(pickGeometry, pickMaterial);
    pickProxy.visible = false;
    knot.add(pickProxy);
    squash.add(knot);
    body.add(squash);
    rig.add(body);
    scene.add(rig);

    const pearlGeometry = new THREE.SphereGeometry(0.3, 24, 18);
    const pearls = [new THREE.Mesh(pearlGeometry, material), new THREE.Mesh(pearlGeometry, material)];
    pearls.forEach((pearl) => body.add(pearl));

    const shadowMap = shadowTexture();
    const shadowMaterial = new THREE.MeshBasicMaterial({ map: shadowMap, transparent: true, depthWrite: false, toneMapped: false, opacity: 0 });
    const shadowGeometry = new THREE.PlaneGeometry(1, 1);
    const shadow = new THREE.Mesh(shadowGeometry, shadowMaterial);
    shadow.position.set(0, -KNOT_RADIUS * 1.0, -0.6);
    shadow.renderOrder = -1;
    rig.add(shadow);

    const light = new THREE.DirectionalLight(0xffffff, 4);
    light.position.set(-4, 4, 6);
    scene.add(light);
    const rim = new THREE.DirectionalLight(0xffffff, 5);
    rim.position.set(4, -2, 3);
    scene.add(rim);

    // The metal and its shadow come from the page's colour roles (experience.css).
    const tint = () => {
      const css = getComputedStyle(document.documentElement);
      const read = (name, fallback) => css.getPropertyValue(name).trim() || fallback;
      material.color.set(read('--exp-metal', '#e0c2a7'));
      light.color.set(read('--exp-metal-light', '#ffe2c1'));
      shadowMaterial.color.set(read('--exp-shadow', '#26231f'));
    };
    tint();

    // Physics state. Height and its velocity are in screen pixels so gravity
    // feels identical on a phone and a desktop.
    const state = { h: 0, vh: 0, s: 0, vs: 0, rx: 0.42, ry: -0.6, wx: 0, wy: 0, slosh: 0 };
    let width = 1, height = 1, seen = -1, slot = null;
    let slotX = 0, slotY = 0, slotScale = 1, finalScale = 1;
    let pendingDrop = !reduce.matches && heroRig.introAt !== undefined;
    let frame = 0, visible = true, elapsed = 0, previous = 0, started = false;
    let pointerX = 0, pointerY = 0, lastClient = null, pickPending = false, hovering = false, drag = null;
    // Shaders compile in parallel (KHR_parallel_shader_compile) instead of
    // freezing the main thread on the first frame; nothing draws until then.
    let compiled = false;

    const emit = () => window.dispatchEvent(new CustomEvent('exp:knot', { detail: { hover: hovering, grabbing: Boolean(drag && !drag.touch) } }));
    const setHover = (next) => {
      if (next === hovering) return;
      hovering = next;
      root.classList.toggle('exp-knot-hover', next);
      emit();
    };

    const layout = () => {
      seen = heroRig.version;
      slot = heroRig.slot;
      if (!slot) return;
      const unit = viewHeight / height;
      slotX = (slot.x - width / 2) * unit;
      slotY = -(slot.y - height / 2) * unit;
      slotScale = (slot.size * unit) / (KNOT_RADIUS * 2);
      const finalSize = width >= 800 ? Math.min(width, height) * 1.05 : width * 0.95;
      finalScale = (finalSize * unit) / (KNOT_RADIUS * 2);
      if (pendingDrop) {
        pendingDrop = false;
        state.h = slot.y + slot.size * 0.75; // start just above the top edge
      }
    };

    const impact = (speed) => {
      const strength = clamp(speed / 2600, 0, 1);
      state.vs -= 2.5 + strength * 7;
      state.slosh = Math.min(1.4, state.slosh + strength * 1.1);
      sound.play('thud', { intensity: strength });
      if (strength > 0.3) window.dispatchEvent(new CustomEvent('exp:knot-impact', { detail: strength }));
    };

    const step = (dt) => {
      // Vertical: gravity, a floor, and a little restitution.
      // Hang above the frame until the entrance (which may wait on a preloader) is due.
      const holding = state.h > 0 && performance.now() < (heroRig.introAt ?? 0) + 900;
      if (!holding && (state.h > 0 || state.vh > 0)) {
        state.vh -= GRAVITY * dt;
        state.h += state.vh * dt;
        if (state.h <= 0) {
          const speed = -state.vh;
          state.h = 0;
          impact(speed);
          state.vh = speed > 320 ? speed * 0.24 : 0;
        }
      }
      // Squash and stretch: stretch along a fast fall, wobble after impact.
      const airborne = state.h > 0.5 && !holding;
      const stretch = airborne ? Math.min(0.09, Math.abs(state.vh) / 16000) : 0;
      state.vs += ((stretch - state.s) * 260 - state.vs * 11) * dt;
      state.s = clamp(state.s + state.vs * dt, -0.28, 0.22);

      // Orientation: free spin with friction, then a heavy spring home.
      if (!drag || drag.touch) {
        const restY = -0.6 + elapsed * 0.24 + pointerX * 0.55;
        const restX = 0.42 + pointerY * 0.38;
        const speed = Math.hypot(state.wx, state.wy);
        const settle = clamp((3 - speed) / 2.2, 0, 1);
        const stiffness = 16 * settle;
        const friction = 1.1 + 4.6 * settle;
        const targetY = restY + TAU * Math.round((state.ry - restY) / TAU);
        const targetX = restX + TAU * Math.round((state.rx - restX) / TAU);
        state.wy += ((targetY - state.ry) * stiffness - state.wy * friction) * dt;
        state.wx += ((targetX - state.rx) * stiffness - state.wx * friction) * dt;
        state.ry += state.wy * dt;
        state.rx += state.wx * dt;
      }
      state.slosh *= Math.exp(-dt * 2.4);
    };

    const pose = () => {
      if (!slot) return;
      const journey = reduce.matches ? 0 : heroRig.journey;
      const ease = journey * journey * (3 - 2 * journey);
      const pxToRig = (KNOT_RADIUS * 2) / slot.size;
      rig.position.set(lerp(slotX, 0, ease), lerp(slotY, 0, ease * 0.9), 0);
      rig.scale.setScalar(lerp(slotScale, finalScale, ease));
      body.position.y = state.h * pxToRig;
      body.rotation.z = ease * 1.13;
      const stretchY = 1 + state.s;
      const stretchX = 1 / Math.sqrt(stretchY);
      squash.scale.set(stretchX, stretchY, stretchX);
      knot.rotation.set(state.rx, state.ry, -0.3);
      liquidTime.value = elapsed * 0.9 + state.slosh * 2;
      liquidAmount.value = 0.1 + state.slosh * 0.16;
      pearls.forEach((pearl, index) => {
        const angle = elapsed * 0.55 + index * Math.PI;
        pearl.position.set(Math.cos(angle) * 3.2, Math.sin(angle) * 2.6, Math.sin(angle * 0.7) * 1.8);
      });
      const lift = clamp(state.h / (slot.size * 0.9), 0, 1);
      const spread = (1 + lift * 0.6) * (1 - state.s * 0.9);
      shadow.scale.set(KNOT_RADIUS * 2.15 * spread, KNOT_RADIUS * 0.46 * (1 + lift * 0.35), 1);
      shadowMaterial.opacity = (0.9 - lift * 0.78) * (1 - Math.min(1, ease * 2.5));
    };

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const pick = (clientX, clientY) => {
      if (!slot) return false;
      const box = renderer.domElement.getBoundingClientRect();
      if (!box.width || !box.height) return false;
      pointer.set(((clientX - box.left) / box.width) * 2 - 1, -((clientY - box.top) / box.height) * 2 + 1);
      raycaster.setFromCamera(pointer, camera);
      return raycaster.intersectObject(pickProxy, false).length > 0;
    };

    const render = (time = performance.now()) => {
      frame = 0;
      if (!visible || document.hidden) return;
      const dt = started ? Math.min((time - previous) / 1000, 0.033) : 0;
      started = true;
      previous = time;
      if (!compiled) return;
      if (heroRig.version !== seen) layout();
      // Once the first frame has compiled, there is nothing to see under the
      // preloader; skip the GPU work so the loader itself stays smooth.
      if (pageCurtain.covered && hero.dataset.knot) {
        if (!reduce.matches) frame = requestAnimationFrame(render);
        return;
      }
      if (!reduce.matches) {
        elapsed += dt;
        step(dt);
      }
      if (heroRig.journey >= 0.06) setHover(false);
      else if (pickPending && lastClient && !drag) {
        pickPending = false;
        setHover(pick(lastClient.x, lastClient.y));
      }
      pose();
      renderer.render(scene, camera);
      if (slot && !hero.dataset.knot) { hero.dataset.knot = 'ready'; window.dispatchEvent(new Event('exp:knot-ready')); }
      if (!reduce.matches) frame = requestAnimationFrame(render);
    };
    const start = () => { if (!frame && visible && !document.hidden) { started = false; frame = requestAnimationFrame(render); } };

    const resize = () => {
      const box = element.getBoundingClientRect();
      if (!box.width || !box.height) return;
      width = box.width; height = box.height;
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      seen = -1;
      if (reduce.matches) render();
      else start();
    };

    const move = (event) => {
      if (event.pointerType === 'touch') return;
      if (fine.matches && !reduce.matches) {
        pointerX = event.clientX / window.innerWidth - 0.5;
        pointerY = event.clientY / window.innerHeight - 0.5;
      }
      lastClient = { x: event.clientX, y: event.clientY };
      pickPending = true;
      if (!drag || drag.touch || event.pointerId !== drag.id) return;
      const now = performance.now();
      const dt = Math.max(0.008, (now - drag.time) / 1000);
      const dx = event.clientX - drag.x;
      const dy = event.clientY - drag.y;
      drag.x = event.clientX; drag.y = event.clientY; drag.time = now;
      drag.moved += Math.abs(dx) + Math.abs(dy);
      const gain = 0.011;
      state.ry += dx * gain;
      state.rx += dy * gain;
      state.wy = clamp(state.wy * 0.45 + ((dx * gain) / dt) * 0.55, -18, 18);
      state.wx = clamp(state.wx * 0.45 + ((dy * gain) / dt) * 0.55, -18, 18);
    };

    const poke = (clientX) => {
      const box = renderer.domElement.getBoundingClientRect();
      const side = Math.sign(clientX - (box.left + slot.x)) || 1;
      if (state.h < 2) state.vh = Math.sqrt(2 * GRAVITY * slot.size * 0.16);
      state.wy += side * 7.5;
      state.wx -= 2.2;
      state.vs -= 3.2;
      state.slosh = Math.min(1.4, state.slosh + 0.35);
    };

    const down = (event) => {
      if (reduce.matches || !slot || heroRig.journey > 0.06 || event.button !== 0) return;
      if (event.target.closest('a, button, input, textarea, summary')) return;
      if (!pick(event.clientX, event.clientY)) return;
      sound.unlock();
      const touch = event.pointerType === 'touch';
      drag = { id: event.pointerId, x: event.clientX, y: event.clientY, start: performance.now(), time: performance.now(), moved: 0, touch };
      if (touch) return; // Let a touch scroll the page; a quick tap still pokes.
      event.preventDefault();
      hero.setPointerCapture?.(event.pointerId);
      root.classList.add('exp-knot-grabbing');
      state.vs -= 1.6; // squeezed in the hand
      sound.play('grab');
      emit();
      start();
    };

    const up = (event) => {
      if (!drag || event.pointerId !== drag.id) return;
      const quick = performance.now() - drag.start < 320 && drag.moved < 8;
      const wasTouch = drag.touch;
      drag = null;
      if (wasTouch) {
        if (quick && pick(event.clientX, event.clientY)) { sound.play('grab'); poke(event.clientX); }
      } else {
        root.classList.remove('exp-knot-grabbing');
        if (hero.hasPointerCapture?.(event.pointerId)) hero.releasePointerCapture(event.pointerId);
        sound.play('release', { material: 'heavy' });
        if (quick) poke(event.clientX);
        else {
          const speed = Math.hypot(state.wx, state.wy);
          if (speed > 3.5) sound.play('fling', { speed: Math.min(1, speed / 14), direction: Math.sign(state.wy) || 1 });
        }
      }
      emit();
    };

    const cancel = () => {
      if (!drag) return;
      drag = null;
      root.classList.remove('exp-knot-grabbing');
      emit();
    };

    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) start();
      else { cancelAnimationFrame(frame); frame = 0; setHover(false); }
    });
    observer.observe(element);
    const sizeObserver = new ResizeObserver(resize);
    sizeObserver.observe(element);
    const onVisibility = () => start();
    const onMotion = () => { if (reduce.matches) { state.h = 0; state.vh = 0; render(); } else start(); };
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('pointermove', move, { passive: true });
    hero.addEventListener('pointerdown', down);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', cancel);
    reduce.addEventListener('change', onMotion);
    resize();
    let disposed = false;
    const pending = renderer.compile(scene, camera);
    const checkCompiled = () => {
      if (disposed) return;
      for (const material of pending) {
        const program = renderer.properties.get(material).currentProgram;
        if (!program || program.isReady()) pending.delete(material);
      }
      if (pending.size) { setTimeout(checkCompiled, 16); return; }
      compiled = true;
      if (reduce.matches) render(); else start();
    };
    if (renderer.extensions.has('KHR_parallel_shader_compile')) checkCompiled();
    else setTimeout(checkCompiled, 16);

    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
      sizeObserver.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pointermove', move);
      hero.removeEventListener('pointerdown', down);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', cancel);
      reduce.removeEventListener('change', onMotion);
      root.classList.remove('exp-knot-hover', 'exp-knot-grabbing');
      delete hero.dataset.knot;
      geometry.dispose(); pickGeometry.dispose(); pickMaterial.dispose(); pearlGeometry.dispose();
      shadowGeometry.dispose(); shadowMaterial.dispose(); shadowMap.dispose();
      material.dispose(); environment.dispose(); renderer.dispose();
      renderer.domElement.remove();
    };
}

export default function Sculpture() {
  const host = useRef(null);
  // Mounting waits a tick, so React's development double-mount (or any instant
  // unmount) never pays twice for a WebGL context, an environment, and shaders.
  useEffect(() => {
    let dispose;
    const timer = setTimeout(() => { dispose = mountSculpture(host.current); }, 0);
    return () => { clearTimeout(timer); dispose?.(); };
  }, []);
  return <div className="exp-sculpture" ref={host} />;
}
