/**
 * App.jsx
 * Root component — wires useAppState + useCanvas into the UI.
 */

import { useEffect, useCallback, useRef } from 'react'
import styles from './styles/App.module.css'

import { useAppState } from './hooks/useAppState'
import { useCanvas }   from './hooks/useCanvas'

import Header     from './components/Header'
import LeftPanel  from './components/LeftPanel'
import CanvasArea from './components/CanvasArea'
import RightPanel from './components/RightPanel'

export default function App() {
  const state  = useAppState()
  const canvas = useCanvas()

  const fileInputRef    = useRef(null)
  const importInputRef  = useRef(null)

  // ── Global corner drag (mouse move / up on window) ────────
  // Use refs to avoid stale closures — the event listeners always read
  // the latest dragIdx and updateCorner without needing to re-register.
  useEffect(() => {
    function onMouseMove(e) {
      if (state.dragIdxRef.current === -1) return
      const area = document.getElementById('canvas-area-root')
      if (!area) return
      const rect = area.getBoundingClientRect()
      state.updateCorner(state.dragIdxRef.current, e.clientX - rect.left, e.clientY - rect.top)
    }
    function onMouseUp() { state.dragIdxRef.current = -1 }
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup',   onMouseUp)
    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup',   onMouseUp)
    }
  }, []) // register once — reads latest values via refs

  // ── Keyboard shortcuts ────────────────────────────────────
  useEffect(() => {
    function onKey(e) {
      if (e.key === 'z' && (e.ctrlKey || e.metaKey)) state.undoDeployment()
      if (e.key === 'g') state.setShowGrid(v => !v)
      if (e.key === 'Escape' && state.phase === 'heatmap') state.goPhase('deploy')
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [state])

  // ── Upload trigger ────────────────────────────────────────
  const handleUploadClick = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const handleFileChange = useCallback((e) => {
    const file = e.target.files[0]
    if (file) state.loadImage(file)
    e.target.value = ''
  }, [state])

  const handleImportChange = useCallback((e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => state.handleImport(ev.target.result)
    reader.readAsText(file)
    e.target.value = ''
  }, [state])

  return (
    <div className={styles.root}>
      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />
      <input
        ref={importInputRef}
        type="file"
        accept=".json"
        style={{ display: 'none' }}
        onChange={handleImportChange}
      />

      <Header
        phase={state.phase}
        onPhaseClick={state.goPhase}
      />

      <div className={styles.body}>
        <LeftPanel
          phase={state.phase}
          corners={state.corners}
          attacks={state.attacks}
          currentAttack={state.currentAttack}
          selectedUnit={state.selectedUnit}
          showGrid={state.showGrid}
          showLabels={state.showLabels}
          onUpload={handleUploadClick}
          onResetCorners={state.resetCorners}
          onGoPhase={state.goPhase}
          onSelectUnit={(id, type) => state.setSelectedUnit({ id, type })}
          onSelectTroop={(id) => state.setSelectedUnit({ id, type: 'troop' })}
          onSelectHero={(id) => state.setSelectedUnit({ id, type: 'hero' })}
          onSetStar={state.setStar}
          onUndoDeployment={state.undoDeployment}
          onSaveAttack={state.saveAttack}
          onToggleGrid={() => state.setShowGrid(v => !v)}
          onToggleLabels={() => state.setShowLabels(v => !v)}
          onExport={state.handleExport}
          onImport={state.handleImport}
        />

        <div id="canvas-area-root" className={styles.canvasWrapper}>
          <CanvasArea
            phase={state.phase}
            baseImgEl={state.baseImgEl}
            corners={state.corners}
            currentAttack={state.currentAttack}
            hoveredCell={state.hoveredCell}
            canvasRefs={canvas.refs}
            layout={canvas.layout}
            resizeCanvases={canvas.resizeCanvases}
            drawBase={canvas.drawBase}
            drawGrid={canvas.drawGrid}
            drawDeployments={canvas.drawDeployments}
            drawHeatmap={canvas.drawHeatmap}
            showGrid={state.showGrid}
            showLabels={state.showLabels}
            attacks={state.attacks}
            heatmapStar={state.heatmapStar}
            heatmapOpacity={state.heatmapOpacity}
            onAddCorner={state.addCorner}
            onStartDrag={(idx) => { state.dragIdxRef.current = idx }}
            onAddDeployment={state.addDeployment}
            onSetHoveredCell={state.setHoveredCell}
          />
        </div>

        {state.phase === 'heatmap' && (
          <RightPanel
            attacks={state.attacks}
            heatmapStar={state.heatmapStar}
            heatmapOpacity={state.heatmapOpacity}
            onSetHeatmapStar={state.setHeatmapStar}
            onSetHeatmapOpacity={state.setHeatmapOpacity}
            onBack={() => state.goPhase('deploy')}
          />
        )}
      </div>
    </div>
  )
}
