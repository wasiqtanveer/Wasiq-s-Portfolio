/**
 * Torn-paper edge geometry.
 *
 * Everything here runs once at module load and produces plain SVG path strings.
 * No runtime geometry, no per-frame math — the "animation" is a flipbook of
 * pre-baked frames swapped by CSS, which is what gives the stop-motion look
 * for essentially zero cost.
 *
 * What makes an edge read as TORN rather than as a zigzag:
 *   1. fine roughness — many short segments with small vertical noise
 *   2. a slow bulge underneath it — a low-frequency wave so the tear wanders
 *   3. uneven segment widths — a regular pitch instantly looks machine-cut
 *   4. occasional spikes — the odd fibre that tore further than its neighbours
 */

/** mulberry32 — small, fast, deterministic. Same seed ⇒ same edge, every load. */
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// All edges are authored in this fixed viewBox and stretched to fit with
// preserveAspectRatio="none", so one path works at any container width.
export const EDGE_W = 1200;
export const EDGE_H = 44;

/**
 * Build the raw vertex list for one tear. Returned separately from the path
 * string so animation frames can perturb the same base shape instead of
 * generating an unrelated tear each frame (a fresh tear per frame would look
 * like static, not like paper).
 */
function tearPoints(seed, { segments = 96, amp = 4.4, bulge = 3.4 } = {}) {
  const rand = rng(seed);
  const mid = EDGE_H * 0.55;
  const pts = [];

  // Two out-of-phase sines give a wandering baseline that never repeats
  // visibly across the width.
  const p1 = rand() * Math.PI * 2;
  const p2 = rand() * Math.PI * 2;

  let x = 0;
  let i = 0;
  while (x < EDGE_W) {
    const t = x / EDGE_W;
    const wander =
      Math.sin(t * Math.PI * 2.3 + p1) * bulge +
      Math.sin(t * Math.PI * 5.1 + p2) * bulge * 0.45;

    // Every ~13th vertex may spike — a lone fibre pulled clear of the tear
    // line. Kept sparse and shallow: frequent deep spikes stop reading as
    // paper and start reading as a saw blade.
    const spike = i % 13 === 6 ? (rand() - 0.3) * amp * 1.15 : 0;

    const y = mid + wander + (rand() - 0.5) * amp + spike;
    pts.push([x, Math.max(1.5, Math.min(EDGE_H - 1.5, y))]);

    // Uneven pitch: 0.55×–1.45× the nominal segment width. Many short
    // segments with small vertical noise is what makes an edge fibrous — long
    // steep segments make it look cut with pinking shears.
    x += (EDGE_W / segments) * (0.55 + rand() * 0.9);
    i++;
  }
  pts.push([EDGE_W, mid + (rand() - 0.5) * amp]);
  return pts;
}

/** Vertices → a closed path that fills everything ABOVE the tear line. */
function toMaskPath(pts) {
  const d = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join('');
  return `M0 0L${EDGE_W} 0L${EDGE_W} ${pts[pts.length - 1][1].toFixed(1)}${d.slice(1)}L0 0Z`;
}

/** Vertices → an open path along the tear line only (for the fibre highlight). */
function toLinePath(pts) {
  return pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join('');
}

/**
 * A torn edge as `frames` slightly different versions of the SAME tear.
 *
 * The per-frame offset is deliberately tiny (≈1px) — that is the traditional
 * animation "boil": the line breathes as though redrawn by hand each frame,
 * but the silhouette never actually changes. Bigger offsets look like noise.
 *
 * @returns {{ mask: string, line: string }[]}
 */
export function tornEdgeFrames(seed, frames = 3, opts = {}) {
  const base = tearPoints(seed, opts);
  const out = [];
  for (let f = 0; f < frames; f++) {
    if (f === 0) {
      out.push({ mask: toMaskPath(base), line: toLinePath(base) });
      continue;
    }
    const jit = rng(seed * 977 + f * 31);
    const moved = base.map(([x, y], i) => [
      // Endpoints stay pinned so the edge always meets the container sides.
      i === 0 || i === base.length - 1 ? x : x + (jit() - 0.5) * 1.6,
      i === 0 || i === base.length - 1 ? y : y + (jit() - 0.5) * 2.2,
    ]);
    out.push({ mask: toMaskPath(moved), line: toLinePath(moved) });
  }
  return out;
}

/**
 * A torn RIGHT edge as a static `clip-path: polygon(...)` string.
 *
 * The same tear generator, transposed: what was horizontal position becomes
 * vertical, and the tear's own displacement becomes the horizontal bite. Two
 * reasons this is a clip-path rather than an overlay mask like TornEdge:
 *
 *   - the strips sit on a paper backing board, not on the page black, so an
 *     overlay would have to know the backing colour at every nesting level;
 *   - a clipped element's `filter: drop-shadow` traces the CLIPPED silhouette,
 *     so the strip gets a shadow that follows its tear for free.
 *
 * The bite is expressed in px via calc() rather than as a percentage so a
 * narrow strip on a phone tears just as deeply as a wide one on a desktop.
 *
 * @param {number} depth Maximum bite in px.
 */
/**
 * A tile torn on ALL FOUR sides, as a static `clip-path: polygon(...)`.
 *
 * Used for the cut-out letters in the hero — a ransom-note letter is a scrap
 * ripped out of a page, so every edge has to be ragged, not just one. Kept
 * static (no boil) deliberately: a dozen tiles each re-clipping three times a
 * second would be a lot of paint for detail nobody can resolve at letter size.
 * The tiles get their life from the jitter animation instead.
 *
 * @param {number} depth Maximum bite in px, on every edge.
 */
export function tornTileClip(seed, { depth = 5, per = 7 } = {}) {
  const rand = rng(seed);
  const bite = () => (rand() * depth).toFixed(1);
  const at = (i) => ((i / per) * 100).toFixed(1);
  const pts = [];

  for (let i = 0; i <= per; i++) pts.push(`${at(i)}% ${bite()}px`);                     // top ⟶
  for (let i = 1; i <= per; i++) pts.push(`calc(100% - ${bite()}px) ${at(i)}%`);        // right ⟱
  for (let i = per - 1; i >= 0; i--) pts.push(`${at(i)}% calc(100% - ${bite()}px)`);    // bottom ⟵
  for (let i = per - 1; i >= 1; i--) pts.push(`${bite()}px ${at(i)}%`);                 // left ⟰

  return `polygon(${pts.join(', ')})`;
}

export function tornRightClip(seed, { depth = 26, segments = 34 } = {}) {
  const pts = tearPoints(seed, { segments, amp: 6.5, bulge: 4.2 });
  const ring = pts.map(([x, y]) => {
    const down = ((x / EDGE_W) * 100).toFixed(2);
    // y near 0 ⇒ deepest bite; y near EDGE_H ⇒ flush with the edge.
    const bite = (depth * (1 - y / EDGE_H)).toFixed(1);
    return `calc(100% - ${bite}px) ${down}%`;
  });
  return `polygon(0% 0%, ${ring.join(', ')}, 0% 100%)`;
}
