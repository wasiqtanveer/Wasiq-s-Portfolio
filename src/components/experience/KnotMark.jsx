// The site's own mark: a trefoil knot, the flat drawing of the (2, 3) torus
// knot that sits in the hero. It replaces every decorative asterisk and sizes
// itself like a glyph (1em), so it can sit in running type or stand alone.
const STEPS = 144;
const PATH = `M${Array.from({ length: STEPS }, (_, index) => {
  const t = (index / STEPS) * Math.PI * 2;
  const x = Math.sin(t) + 2 * Math.sin(2 * t);
  const y = Math.cos(t) - 2 * Math.cos(2 * t);
  return `${x.toFixed(3)} ${(-y).toFixed(3)}`;
}).join('L')}Z`;

export default function KnotMark({ className = '' }) {
  return <svg className={`exp-knot-mark ${className}`.trim()} viewBox="-3.7 -3.7 7.4 7.4" fill="none" aria-hidden="true" focusable="false">
    <path d={PATH} stroke="currentColor" strokeWidth="0.62" strokeLinejoin="round" />
  </svg>;
}
