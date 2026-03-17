/**
 * geometry.js
 * ─────────────────────────────────────────────────────────────────────────────
 * All coordinate-mapping math for the Builder Base diamond grid.
 *
 * Direct ports from your Python files:
 *   calculations.py  → diamondCoordsFromClick, gridToCanvas
 *   grid_utils.py    → isInsideDiamond, lerp
 *
 * Diamond layout (as in your Python config):
 *   corners = [left, top, right, bottom]
 *   Grid coordinate origin is the diamond centre (0, 0).
 *   x runs left (−20) → right (+20)
 *   y runs bottom (−20) → top (+20)
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { GRID_MAX } from './constants'

// ── lerp (grid_utils.py) ──────────────────────────────────────────────────────
export function lerp(a, b, t) {
  return a + (b - a) * t
}

// ── isInsideDiamond (grid_utils.py → is_inside_diamond) ──────────────────────
/**
 * Returns true if (px, py) is inside the diamond defined by 4 corners.
 * Uses the cross-product sign method from is_inside_diamond().
 *
 * @param {number}   px
 * @param {number}   py
 * @param {object[]} corners  [{x,y}, ...] — [left, top, right, bottom]
 */
export function isInsideDiamond(px, py, corners) {
  if (!corners || corners.length < 4) return false
  const [left, top, right, bottom] = corners

  function sign(p1, p2, p3) {
    return (p1[0] - p3[0]) * (p2[1] - p3[1]) - (p2[0] - p3[0]) * (p1[1] - p3[1])
  }

  const pt = [px, py]
  const b1 = sign(pt, [left.x,   left.y],   [top.x,    top.y])    < 0
  const b2 = sign(pt, [top.x,    top.y],    [right.x,  right.y])  < 0
  const b3 = sign(pt, [right.x,  right.y],  [bottom.x, bottom.y]) < 0
  const b4 = sign(pt, [bottom.x, bottom.y], [left.x,   left.y])   < 0

  return b1 === b2 && b2 === b3 && b3 === b4
}

// ── diamondCoordsFromClick — inverse bilinear interpolation ──────────────────
/**
 * Map a canvas pixel click to diamond grid coordinates.
 *
 * Uses iterative Newton-Raphson inverse bilinear interpolation over the
 * quadrilateral defined by the 4 corners. This is correct for any
 * non-rectangular quadrilateral (including the skewed CoC diamond) whereas
 * simple dot-product projection gives wrong results near the corners.
 *
 * The bilinear forward map (gridToCanvas) is:
 *   P(u,v) = (1-u)(1-v)*left + u(1-v)*top + uv*right + (1-u)v*bottom
 *
 * where u ∈ [0,1] maps left→right  and v ∈ [0,1] maps left/top → bottom/right.
 * We invert this to find (u,v) from a pixel (clickX, clickY).
 *
 * @param {number}   clickX
 * @param {number}   clickY
 * @param {object[]} corners   [{x,y}] — [left, top, right, bottom]
 * @param {number}   gridMax   default 20
 * @returns {{ x: number, y: number, fx: number, fy: number }}
 *   x/y = floored integer cell coords; fx/fy = continuous 0..1 fractions
 */
export function diamondCoordsFromClick(clickX, clickY, corners, gridMax = GRID_MAX) {
  const [left, top, right, bottom] = corners

  // Iterative Newton-Raphson to find (u, v) such that bilinear(u,v) = (clickX, clickY)
  let u = 0.5, v = 0.5
  for (let iter = 0; iter < 20; iter++) {
    // Forward map at current (u, v)
    const bx = (1-u)*(1-v)*left.x + u*(1-v)*top.x + u*v*right.x + (1-u)*v*bottom.x
    const by = (1-u)*(1-v)*left.y + u*(1-v)*top.y + u*v*right.y + (1-u)*v*bottom.y

    // Partial derivatives
    const dbxdu = -(1-v)*left.x + (1-v)*top.x + v*right.x - v*bottom.x
    const dbydu = -(1-v)*left.y + (1-v)*top.y + v*right.y - v*bottom.y
    const dbxdv = -(1-u)*left.x - u*top.x     + u*right.x + (1-u)*bottom.x
    const dbydv = -(1-u)*left.y - u*top.y     + u*right.y + (1-u)*bottom.y

    const ex = bx - clickX
    const ey = by - clickY
    if (Math.abs(ex) + Math.abs(ey) < 0.01) break

    const det = dbxdu * dbydv - dbxdv * dbydu
    if (Math.abs(det) < 1e-10) break

    u -= ( dbydv * ex - dbxdv * ey) / det
    v -= (-dbydu * ex + dbxdu * ey) / det

    // Clamp to [0,1] to stay stable
    u = Math.max(0, Math.min(1, u))
    v = Math.max(0, Math.min(1, v))
  }

  // u ∈ [0,1] → gx ∈ [−gridMax, +gridMax]
  // v ∈ [0,1] → gy ∈ [+gridMax, −gridMax]  (v=0 is top/left, v=1 is bottom/right → gy decreases)
  const fgx = -gridMax + u * 2 * gridMax
  const fgy =  gridMax - v * 2 * gridMax

  return {
    // Continuous values for the cell-floor highlight
    fx: fgx,
    fy: fgy,
    // Floored integer cell (the cell the cursor is currently inside)
    x: Math.max(-gridMax, Math.min(gridMax - 1, Math.floor(fgx))),
    y: Math.max(-gridMax, Math.min(gridMax - 1, Math.floor(fgy))),
  }
}

// ── gridToCanvas (inverse of diamondCoordsFromClick) ─────────────────────────
/**
 * Convert a diamond grid coordinate back to canvas pixel coordinates.
 * Uses bilinear interpolation over the 4 corners.
 *
 * @param {number}   gx        grid x  (−gridMax..+gridMax)
 * @param {number}   gy        grid y  (−gridMax..+gridMax)
 * @param {object[]} corners   [{x,y}] — [left, top, right, bottom]
 * @param {number}   gridMax   default 20
 * @returns {{ x: number, y: number }}  canvas pixel
 */
export function gridToCanvas(gx, gy, corners, gridMax = GRID_MAX) {
  const [left, top, right, bottom] = corners

  // Normalise back to 0..1 (inverse of the mapping above)
  const fx = (gx + gridMax) / (2 * gridMax)
  const fy = (gridMax - gy) / (2 * gridMax)   // inverted Y

  // Bilinear interpolation over the 4 diamond corners
  const x =
    (1 - fx) * (1 - fy) * left.x   +
    fx       * (1 - fy) * top.x    +
    fx       * fy       * right.x  +
    (1 - fx) * fy       * bottom.x

  const y =
    (1 - fx) * (1 - fy) * left.y   +
    fx       * (1 - fy) * top.y    +
    fx       * fy       * right.y  +
    (1 - fx) * fy       * bottom.y

  return { x, y }
}

// ── lerpColor ─────────────────────────────────────────────────────────────────
/**
 * Interpolate along a colour ramp defined by [t, [R,G,B,A]] stops.
 *
 * @param {Array}  stops   [[t, [r,g,b,a]], ...]
 * @param {number} t       0..1
 * @returns {number[]}     [r, g, b, a]
 */
export function lerpColor(stops, t) {
  t = Math.max(0, Math.min(1, t))
  for (let i = 1; i < stops.length; i++) {
    const [t0, c0] = stops[i - 1]
    const [t1, c1] = stops[i]
    if (t <= t1) {
      const f = (t - t0) / (t1 - t0)
      return c0.map((v, j) => Math.round(v + f * (c1[j] - v)))
    }
  }
  return stops[stops.length - 1][1]
}

// ── buildHeatmapGrid ──────────────────────────────────────────────────────────
/**
 * Aggregate deployment counts into a sparse map keyed by "gx,gy".
 *
 * @param {object[]} attacks    Array of attack records
 * @param {number|'all'} starFilter
 * @returns {{ accum: Object, maxVal: number }}
 */
export function buildHeatmapGrid(attacks, starFilter) {
  const filtered =
    starFilter === 'all'
      ? attacks
      : attacks.filter(a => a.stars === starFilter)

  const accum = {}
  let maxVal = 0

  filtered.forEach(atk => {
    atk.deployments.forEach(d => {
      const key = `${d.gx},${d.gy}`
      accum[key] = (accum[key] || 0) + 1
      if (accum[key] > maxVal) maxVal = accum[key]
    })
  })

  return { accum, maxVal }
}
