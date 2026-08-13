import React, { useMemo } from 'react';
import { tornEdgeFrames, EDGE_W, EDGE_H } from './tornPath';

/**
 * A torn paper edge, animated as a 3-frame flipbook.
 *
 * It works by MASKING rather than clipping: the sheet underneath stays a plain
 * rectangle, and this component lays a shape in the page's own background
 * colour over the sheet's straight edge. Whatever is left uncovered is the
 * tear. Two reasons that beats `clip-path` on the sheet itself:
 *
 *   - a clip-path on the container would also clip the sheet's shadow and any
 *     child that overhangs it (tape, stamps, the numbered tabs);
 *   - swapping a mask's `opacity` between frames is a compositor-only change,
 *     whereas animating `clip-path` re-clips and repaints the whole sheet.
 *
 * The `line` path is stroked just below the mask in near-white: that bright
 * hairline is the paper fibre standing up along the tear, and it is the detail
 * that makes the edge read as fibrous rather than as a cut.
 */
export default function TornEdge({
  seed = 7,
  side = 'top',
  /** Must match whatever sits BEHIND the sheet, since this paints over it. */
  color = 'var(--ink)',
  /** Rendered height of the strip in px. */
  height = 26,
  boil = true,
  /** Fibre highlight tone — lighter than the sheet reads as raised pulp. */
  fibre = 'rgba(255,255,255,0.55)',
  className = '',
}) {
  const frames = useMemo(() => tornEdgeFrames(seed, boil ? 3 : 1), [seed, boil]);
  const boilClass = ['paper-boil-a', 'paper-boil-b', 'paper-boil-c'];

  return (
    <svg
      aria-hidden="true"
      className={`absolute left-0 w-full pointer-events-none ${className}`}
      style={{
        [side]: 0,
        height,
        // The bottom variant is the same tear read upside down — one path set
        // serves both edges, and mirroring means a sheet's two edges never look
        // like copies of each other.
        transform: side === 'bottom' ? 'scaleY(-1)' : undefined,
        zIndex: 5,
      }}
      viewBox={`0 0 ${EDGE_W} ${EDGE_H}`}
      preserveAspectRatio="none"
    >
      {frames.map((f, i) => (
        <g key={i} className={boil ? boilClass[i] : undefined}>
          <path d={f.mask} fill={color} />
          <path
            d={f.line}
            fill="none"
            stroke={fibre}
            strokeWidth="1.6"
            vectorEffect="non-scaling-stroke"
          />
        </g>
      ))}
    </svg>
  );
}
