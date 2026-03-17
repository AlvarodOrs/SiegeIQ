/**
 * useCanvas.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Manages four stacked <canvas> elements and all drawing routines.
 *
 *  baseCanvas    — static base image
 *  gridCanvas    — perspective grid overlay  (draw_grid from grid_utils.py)
 *  deployCanvas  — current-attack troop emojis + hover cell highlight
 *  heatmapCanvas — heatmap overlay
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { useRef, useCallback, useEffect } from 'react'
import { lerp, gridToCanvas, lerpColor, buildHeatmapGrid } from '../utils/geometry'
import { GRID_SIZE, HEATMAP_STOPS }                         from '../utils/constants'

export function useCanvas() {
  const baseRef    = useRef(null)
  const gridRef    = useRef(null)
  const deployRef  = useRef(null)
  const heatmapRef = useRef(null)

  // Canvas size info, updated on resize / image load
  const layout = useRef({ offX: 0, offY: 0, w: 0, h: 0, aw: 0, ah: 0 })

  // ── Resize all canvases to fill the container ─────────────
  const resizeCanvases = useCallback((imgEl, container) => {
    const aw = container.clientWidth
    const ah = container.clientHeight
    const scale = Math.min(aw / imgEl.naturalWidth, ah / imgEl.naturalHeight)
    const w  = Math.round(imgEl.naturalWidth  * scale)
    const h  = Math.round(imgEl.naturalHeight * scale)
    const ox = Math.round((aw - w) / 2)
    const oy = Math.round((ah - h) / 2)

    ;[baseRef, gridRef, deployRef, heatmapRef].forEach(r => {
      if (!r.current) return
      r.current.width  = aw
      r.current.height = ah
    })

    layout.current = { offX: ox, offY: oy, w, h, aw, ah }
    return layout.current
  }, [])

  // ── Base image ────────────────────────────────────────────
  const drawBase = useCallback((imgEl) => {
    const c = baseRef.current
    if (!c || !imgEl) return
    const ctx = c.getContext('2d')
    const { offX, offY, w, h, aw, ah } = layout.current
    ctx.clearRect(0, 0, aw, ah)
    ctx.drawImage(imgEl, offX, offY, w, h)
  }, [])

  // ── Grid  (ported from grid_utils.py → draw_grid) ────────
  const drawGrid = useCallback((corners, showGrid, showLabels, calibrating = false) => {
    const c = gridRef.current
    if (!c) return
    const ctx = c.getContext('2d')
    const { aw, ah } = layout.current
    ctx.clearRect(0, 0, aw, ah)
    if (!showGrid || corners.length < 4) return

    const [left, top, right, bottom] = corners
    const N = GRID_SIZE
    const INSET = 3 // inner square is 3 cells in from each edge

    const borderColor = calibrating ? 'rgba(255,200,40,0.95)'  : 'rgba(58,143,217,0.95)'
    const borderWidth = calibrating ? 4                         : 2.5
    const innerColor  = calibrating ? 'rgba(255,200,40,0.7)'   : 'rgba(58,143,217,0.7)'
    const innerWidth  = calibrating ? 2                         : 1.5
    const majorColor  = calibrating ? 'rgba(255,200,40,0.55)'  : 'rgba(58,143,217,0.3)'
    const majorWidth  = calibrating ? 1.2                       : 0.7
    const minorColor  = calibrating ? 'rgba(255,255,255,0.3)'  : 'rgba(255,255,255,0.08)'
    const minorWidth  = calibrating ? 0.7                       : 0.35

    // ── Outer diamond border ──
    ctx.beginPath()
    ctx.moveTo(left.x, left.y)
    ctx.lineTo(top.x,  top.y)
    ctx.lineTo(right.x, right.y)
    ctx.lineTo(bottom.x, bottom.y)
    ctx.closePath()
    ctx.strokeStyle = borderColor
    ctx.lineWidth   = borderWidth
    if (calibrating) {
      ctx.shadowColor = 'rgba(255,200,40,0.6)'
      ctx.shadowBlur  = 10
    }
    ctx.stroke()
    ctx.shadowBlur = 0

    // ── Interior grid lines ──
    for (let i = 1; i < N; i++) {
      const t = i / N
      const isInner = (i === INSET || i === N - INSET)
      const isMajor = i % 5 === 0

      const sx1 = lerp(left.x,   top.x,   t)
      const sy1 = lerp(left.y,   top.y,   t)
      const ex1 = lerp(bottom.x, right.x, t)
      const ey1 = lerp(bottom.y, right.y, t)

      ctx.strokeStyle = isInner ? innerColor : isMajor ? majorColor : minorColor
      ctx.lineWidth   = isInner ? innerWidth : isMajor ? majorWidth : minorWidth
      ctx.beginPath(); ctx.moveTo(sx1, sy1); ctx.lineTo(ex1, ey1); ctx.stroke()

      const sx2 = lerp(left.x, bottom.x, t)
      const sy2 = lerp(left.y, bottom.y, t)
      const ex2 = lerp(top.x,  right.x,  t)
      const ey2 = lerp(top.y,  right.y,  t)

      ctx.beginPath(); ctx.moveTo(sx2, sy2); ctx.lineTo(ex2, ey2); ctx.stroke()
    }

    // ── Axis labels ──
    if (showLabels) {
      ctx.font      = '8px "Share Tech Mono", monospace'
      ctx.fillStyle = 'rgba(100,160,220,0.75)'
      ctx.textAlign = 'center'
      for (let g = -20; g <= 20; g += 5) {
        if (g === 0) continue
        const p = gridToCanvas(g, 0, corners)
        ctx.fillText(String(g), p.x, p.y - 5)
        const q = gridToCanvas(0, g, corners)
        ctx.fillText(String(g), q.x + 9, q.y + 4)
      }
      const o = gridToCanvas(0, 0, corners)
      ctx.fillStyle = 'rgba(232,160,32,0.9)'
      ctx.beginPath(); ctx.arc(o.x, o.y, 3, 0, Math.PI * 2); ctx.fill()
    }
  }, [])
  // ── Deployments + hover highlight ─────────────────────────
  const drawDeployments = useCallback((deployments, hoveredCell, corners) => {
    const c = deployRef.current
    if (!c) return
    const ctx = c.getContext('2d')
    const { aw, ah } = layout.current
    ctx.clearRect(0, 0, aw, ah)

    if (corners.length < 4) return

    // Troop emojis
    deployments.forEach(d => {
      const pos = gridToCanvas(d.gx, d.gy, corners)
      
      // Solid background circle for contrast
      ctx.beginPath()
      ctx.fillStyle = 'rgba(0,0,0,0.65)'

      // Emoji on top
      ctx.shadowColor  = 'rgba(0,0,0,1)'
      ctx.shadowBlur   = 8
      ctx.font         = '20px serif'
      ctx.fillText(d.emoji, pos.x, pos.y)
    })
    ctx.globalAlpha = 1
    ctx.shadowBlur  = 0

    // Hovered cell quad — use floored cell integer coordinates
    // The cell (gx, gy) occupies grid space from (gx, gy) to (gx+1, gy+1)
    if (hoveredCell) {
      const { gx, gy } = hoveredCell
      // Four corners of this 1×1 grid cell, mapped back to canvas pixels
      const pts = [
        gridToCanvas(gx,     gy,     corners),   // bottom-left
        gridToCanvas(gx + 1, gy,     corners),   // bottom-right
        gridToCanvas(gx + 1, gy + 1, corners),   // top-right
        gridToCanvas(gx,     gy + 1, corners),   // top-left
      ]
      ctx.beginPath()
      ctx.moveTo(pts[0].x, pts[0].y)
      pts.slice(1).forEach(p => ctx.lineTo(p.x, p.y))
      ctx.closePath()
      ctx.fillStyle   = 'rgba(255,255,255,0.12)'
      ctx.strokeStyle = 'rgba(255,255,255,0.6)'
      ctx.lineWidth   = 1.5
      ctx.fill()
      ctx.stroke()
    }
  }, [])

  // ── Heatmap ───────────────────────────────────────────────
  const drawHeatmap = useCallback((attacks, heatmapStar, opacity, corners) => {
    const c = heatmapRef.current
    if (!c) return
    const ctx = c.getContext('2d')
    const { aw, ah } = layout.current
    ctx.clearRect(0, 0, aw, ah)

    if (corners.length < 4) return

    const { accum, maxVal } = buildHeatmapGrid(attacks, heatmapStar)
    if (maxVal === 0) return

    Object.entries(accum).forEach(([key, val]) => {
      const [gx, gy] = key.split(',').map(Number)
      const t = val / maxVal
      const [r, g, b, a] = lerpColor(HEATMAP_STOPS, t)
      const alpha = (a / 255) * opacity

      const c0 = gridToCanvas(gx,     gy + 1, corners)
      const c1 = gridToCanvas(gx + 1, gy + 1, corners)
      const c2 = gridToCanvas(gx + 1, gy,     corners)
      const c3 = gridToCanvas(gx,     gy,     corners)

      ctx.beginPath()
      ctx.moveTo(c0.x, c0.y)
      ctx.lineTo(c1.x, c1.y)
      ctx.lineTo(c2.x, c2.y)
      ctx.lineTo(c3.x, c3.y)
      ctx.closePath()
      ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`
      ctx.fill()
    })
  }, [])

  // ── Utility: event → canvas coords ───────────────────────
  const eventToCanvas = useCallback((e) => {
    if (!baseRef.current) return { x: 0, y: 0 }
    const rect = baseRef.current.getBoundingClientRect()
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    }
  }, [])

  return {
    refs: { baseRef, gridRef, deployRef, heatmapRef },
    layout,
    resizeCanvases,
    drawBase,
    drawGrid,
    drawDeployments,
    drawHeatmap,
    eventToCanvas,
  }
}
