/**
 * useAppState.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Single source of truth for the entire app.
 * All state mutations go through the actions returned here.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { useState, useCallback } from 'react'
import { ARMY_TYPES }           from '../utils/constants'
import { exportSession, importSession } from '../utils/storage'

const INITIAL_CURRENT_ATTACK = { deployments: [], stars: null }

function getUnitData(id, type) { return ARMY_TYPES.find(u => u.id === id && u.type === type) }

export function useAppState() {
  // ── Phase ──────────────────────────────────────────────────
  const [phase, setPhaseRaw] = useState('upload')

  // ── Image ──────────────────────────────────────────────────
  const [baseImage,   setBaseImage]   = useState(null)   // object URL
  const [baseImgEl,   setBaseImgEl]   = useState(null)   // HTMLImageElement

  // ── Corners ────────────────────────────────────────────────
  const [corners,     setCorners]     = useState([])     // [{x,y}] max 4
  const [dragIdx,     setDragIdx]     = useState(-1)

  // ── Attacks ────────────────────────────────────────────────
  const [attacks,         setAttacks]         = useState([])
  const [currentAttack,   setCurrentAttack]   = useState(INITIAL_CURRENT_ATTACK)

  // ── UI prefs ───────────────────────────────────────────────
  const [selectedUnit,  setSelectedUnit]  = useState({id: 'raged_barbarian', type: 'troop'})
  const [showGrid,       setShowGrid]       = useState(true)
  const [showLabels,     setShowLabels]     = useState(false)

  // ── Heatmap ────────────────────────────────────────────────
  const [heatmapStar,    setHeatmapStar]    = useState('all')
  const [heatmapOpacity, setHeatmapOpacity] = useState(0.72)

  // ── Hover ──────────────────────────────────────────────────
  const [hoveredCell, setHoveredCell] = useState(null)  // {gx, gy} | null

  // ── Phase guard ────────────────────────────────────────────
  const goPhase = useCallback((p) => {
    if (p === 'corners' && !baseImage)           return
    if (p === 'deploy'  && corners.length < 4)   return
    if (p === 'heatmap' && attacks.length === 0) return
    setPhaseRaw(p)
  }, [baseImage, corners.length, attacks.length])

  // ── Image upload ───────────────────────────────────────────
  const loadImage = useCallback((file) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      setBaseImage(url)
      setBaseImgEl(img)
      setCorners([])
      setPhaseRaw('corners')
    }
    img.src = url
  }, [])

  // ── Corners ────────────────────────────────────────────────
  const addCorner = useCallback((x, y) => {
    setCorners(prev => {
      if (prev.length >= 4) return prev
      const next = [...prev, { x, y }]
      if (next.length === 4) setPhaseRaw('deploy')
      return next
    })
  }, [])

  const updateCorner = useCallback((idx, x, y) => {
    setCorners(prev => prev.map((c, i) => i === idx ? { x, y } : c))
  }, [])

  const resetCorners = useCallback(() => setCorners([]), [])

  // ── Deployments ────────────────────────────────────────────
const addDeployment = useCallback((gx, gy) => {
  const unit = getUnitData(selectedUnit.id, selectedUnit.type)

  if (!unit) return // fail fast
  
  // Prevent deploying a second hero
  if (selectedUnit.type === 'hero' &&
      currentAttack.deployments.some(d => d.unitType === 'hero')) {
    return // already have a hero, ignore
  }
  setCurrentAttack(prev => ({
    ...prev,
    deployments: [
      ...prev.deployments,
      {
        unitId: selectedUnit.id,
        unitType: selectedUnit.type,
        emoji: unit.emoji,
        color: unit.color,
        gx,
        gy,
        seq: prev.deployments.length + 1,
      },
    ],
  }))
}, [selectedUnit, currentAttack.deployments])

  const undoDeployment = useCallback(() => {
    setCurrentAttack(prev => {
      const newDeployments = prev.deployments.slice(0, -1)
      return { ...prev, deployments: newDeployments }
    })
  }, [])

  const setStar = useCallback((s) => {
    setCurrentAttack(prev => ({ ...prev, stars: s }))
  }, [])

  const saveAttack = useCallback(() => {
    setAttacks(prev => [
      ...prev,
      {
        attack_id:   prev.length + 1,
        stars:       currentAttack.stars,
        deployments: [...currentAttack.deployments],
        timestamp:   Date.now(),
      },
    ])
    setCurrentAttack(INITIAL_CURRENT_ATTACK)
  }, [currentAttack])

  const clearCurrentAttack = useCallback(() => {
    setCurrentAttack(INITIAL_CURRENT_ATTACK)
  }, [])

  // ── Session I/O ────────────────────────────────────────────
  const handleExport = useCallback(() => {
    exportSession(corners, attacks)
  }, [corners, attacks])

  const handleImport = useCallback((jsonText) => {
    try {
      const { corners: c, attacks: a } = importSession(jsonText)
      // Restore emoji/color from ARMY_TYPES
      a.forEach(atk => {
        atk.deployments.forEach(d => {
          const id   = d.unitId   || d.troop
          const type = d.unitType || 'troop'

          const unit = getUnitData(id, type)

          if (unit) {
            d.emoji = unit.emoji
            d.color = unit.color
            d.unitId = id
            d.unitType = type
          }
        })})
      setCorners(c)
      setAttacks(a)
      setPhaseRaw('deploy')
    } catch (e) {
      alert('Failed to load session: ' + e.message)
    }
  }, [])

  return {
    // State
    phase, baseImage, baseImgEl, corners, dragIdx,
    attacks, currentAttack, selectedUnit,
    showGrid, showLabels, heatmapStar, heatmapOpacity, hoveredCell,
    // Actions
    goPhase, loadImage,
    addCorner, updateCorner, resetCorners, setDragIdx,
    addDeployment, undoDeployment, setStar, saveAttack, clearCurrentAttack,
    setSelectedUnit,
    setShowGrid, setShowLabels,
    setHeatmapStar, setHeatmapOpacity,
    setHoveredCell,
    handleExport, handleImport,
  }
}
