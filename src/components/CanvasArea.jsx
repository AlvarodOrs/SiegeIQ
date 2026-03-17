import { useEffect, useRef, useCallback } from 'react'
import styles from './CanvasArea.module.css'
import { CORNER_COLORS, CORNER_LABELS } from '../utils/constants'
import { isInsideDiamond, diamondCoordsFromClick } from '../utils/geometry'

export default function CanvasArea({
  phase, baseImgEl, corners, currentAttack, hoveredCell,
  canvasRefs, layout,
  resizeCanvases, drawBase, drawGrid, drawDeployments, drawHeatmap,
  showGrid, showLabels, attacks, heatmapStar, heatmapOpacity,
  onAddCorner, onStartDrag, onAddDeployment, onSetHoveredCell,
}) {
  const containerRef = useRef(null)
  const { baseRef, gridRef, deployRef, heatmapRef } = canvasRefs

  // ── Resize + full redraw on mount / image change ─────────
  useEffect(() => {
    if (!baseImgEl || !containerRef.current) return
    resizeCanvases(baseImgEl, containerRef.current)
    drawBase(baseImgEl)
    drawGrid(corners, showGrid, showLabels, phase === 'corners')
    drawDeployments(currentAttack.deployments, hoveredCell, corners)
  }, [baseImgEl]) // eslint-disable-line

  // ── Redraw grid when corners/prefs change ─────────────────
  useEffect(() => {
    drawGrid(corners, showGrid, showLabels, phase === 'corners')
  }, [corners, showGrid, showLabels, phase]) // eslint-disable-line

  // ── Redraw deployments ────────────────────────────────────
  useEffect(() => {
    drawDeployments(currentAttack.deployments, hoveredCell, corners)
  }, [currentAttack.deployments, hoveredCell]) // eslint-disable-line

  // ── Redraw heatmap ────────────────────────────────────────
  useEffect(() => {
    if (phase === 'heatmap') drawHeatmap(attacks, heatmapStar, heatmapOpacity, corners)
  }, [phase, attacks, heatmapStar, heatmapOpacity]) // eslint-disable-line

  // ── Window resize ─────────────────────────────────────────
  useEffect(() => {
    function onResize() {
      if (!baseImgEl || !containerRef.current) return
      resizeCanvases(baseImgEl, containerRef.current)
      drawBase(baseImgEl)
      drawGrid(corners, showGrid, showLabels, phase === 'corners')
      drawDeployments(currentAttack.deployments, hoveredCell, corners)
      if (phase === 'heatmap') drawHeatmap(attacks, heatmapStar, heatmapOpacity, corners)
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }) // intentionally no dep array — always uses latest state

  // ── Canvas click ──────────────────────────────────────────
  const handleClick = useCallback((e) => {
    const rect = containerRef.current.getBoundingClientRect()
    const cx = e.clientX - rect.left
    const cy = e.clientY - rect.top

    if (phase === 'corners' && corners.length < 4) {
      onAddCorner(cx, cy)
      return
    }
    if (phase === 'deploy') {
      if (!isInsideDiamond(cx, cy, corners)) return
      const result = diamondCoordsFromClick(cx, cy, corners)
      onAddDeployment(result.x, result.y)
    }
  }, [phase, corners, onAddCorner, onAddDeployment])

  // ── Mouse move (hover) ────────────────────────────────────
  const handleMouseMove = useCallback((e) => {
    if (phase !== 'deploy') return
    const rect = containerRef.current.getBoundingClientRect()
    const cx = e.clientX - rect.left
    const cy = e.clientY - rect.top
    if (isInsideDiamond(cx, cy, corners)) {
      const result = diamondCoordsFromClick(cx, cy, corners)
      // result.x/y are floored cell indices; result.fx/fy are continuous
      onSetHoveredCell({ gx: result.x, gy: result.y, fx: result.fx, fy: result.fy })
    } else {
      onSetHoveredCell(null)
    }
  }, [phase, corners, onSetHoveredCell])

  // ── Corner dot mouse-down (start drag) ───────────────────
  const handleCornerMouseDown = useCallback((e, idx) => {
    e.stopPropagation()
    onStartDrag(idx)
  }, [onStartDrag])

  const cursorClass =
    phase === 'corners' ? styles.crosshair :
    phase === 'deploy'  ? styles.cell       : ''

  return (
    <div
      ref={containerRef}
      className={`${styles.area} ${cursorClass}`}
      onClick={handleClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => onSetHoveredCell(null)}
    >
      {/* Empty state */}
      {!baseImgEl && (
        <div className={styles.emptyState}>
          <div className={styles.bigIcon}>🏰</div>
          <div className={styles.emptyMsg}>UPLOAD A BUILDER BASE SCREENSHOT TO BEGIN</div>
        </div>
      )}

      {/* Stacked canvases */}
      <canvas ref={baseRef}    className={styles.canvas} />
      <canvas ref={gridRef}    className={styles.canvas} style={{ pointerEvents: 'none' }} />
      <canvas ref={deployRef}  className={styles.canvas} style={{ pointerEvents: 'none' }} />
      <canvas
        ref={heatmapRef}
        className={styles.canvas}
        style={{ pointerEvents: 'none', display: phase === 'heatmap' ? '' : 'none' }}
      />

      {/* Corner markers (DOM overlay for drag handles) */}
      {corners.map((c, i) => (
        <div key={i}>
          <div
            className={styles.cornerDot}
            style={{
              left: c.x, top: c.y,
              background: CORNER_COLORS[i],
              boxShadow: `0 0 10px ${CORNER_COLORS[i]}`,
              // Always draggable in corners phase; also draggable in deploy for fine-tuning
              cursor: (phase === 'corners' || phase === 'deploy') ? 'grab' : 'default',
              pointerEvents: (phase === 'corners' || phase === 'deploy') ? 'auto' : 'none',
            }}
            onMouseDown={(e) => handleCornerMouseDown(e, i)}
          />
          {(phase === 'corners' || phase === 'deploy') && (
            <div
              className={styles.cornerLabel}
              style={{ left: c.x, top: c.y + 10, color: CORNER_COLORS[i] }}
            >
              {CORNER_LABELS[i]}
            </div>
          )}
        </div>
      ))}

      {/* Hover tooltip */}
      {hoveredCell && phase === 'deploy' && (
        <div className={styles.tooltip}>
          CELL ({hoveredCell.gx}, {hoveredCell.gy})
          &nbsp;·&nbsp;
          <span style={{ opacity: 0.6 }}>
            {hoveredCell.fx !== undefined ? `${hoveredCell.fx.toFixed(1)}, ${hoveredCell.fy.toFixed(1)}` : ''}
          </span>
        </div>
      )}
    </div>
  )
}
