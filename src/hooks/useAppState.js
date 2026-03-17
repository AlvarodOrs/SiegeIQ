import { useState, useCallback, useRef } from 'react'
import { TROOP_TYPES }           from '../utils/constants'
import { exportSession, importSession } from '../utils/storage'

const INITIAL_CURRENT_ATTACK = { deployments: [], stars: null }

export function useAppState() {
  const [phase, setPhaseRaw] = useState('upload')

  const [baseImage,   setBaseImage]   = useState(null)
  const [baseImgEl,   setBaseImgEl]   = useState(null)

  const [corners,     setCorners]     = useState([])
  const dragIdxRef = useRef(-1)   // ← plain ref, no re-render on drag

  const [attacks,         setAttacks]         = useState([])
  const [currentAttack,   setCurrentAttack]   = useState(INITIAL_CURRENT_ATTACK)

  const [selectedTroop,  setSelectedTroop]  = useState('raged_barbarian')
  const [showGrid,       setShowGrid]       = useState(true)
  const [showLabels,     setShowLabels]     = useState(false)

  const [heatmapStar,    setHeatmapStar]    = useState('all')
  const [heatmapOpacity, setHeatmapOpacity] = useState(0.72)

  const [hoveredCell, setHoveredCell] = useState(null)

  const goPhase = useCallback((p) => {
    if (p === 'corners' && !baseImage)           return
    if (p === 'deploy'  && corners.length < 4)   return
    if (p === 'heatmap' && attacks.length === 0) return
    setPhaseRaw(p)
  }, [baseImage, corners.length, attacks.length])

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

  const addDeployment = useCallback((gx, gy) => {
    const troop = TROOP_TYPES.find(t => t.id === selectedTroop)
    setCurrentAttack(prev => ({
      ...prev,
      deployments: [
        ...prev.deployments,
        { troop: selectedTroop, emoji: troop.emoji, color: troop.color, gx, gy, seq: prev.deployments.length + 1 },
      ],
    }))
  }, [selectedTroop])

  const undoDeployment = useCallback(() => {
    setCurrentAttack(prev => ({ ...prev, deployments: prev.deployments.slice(0, -1) }))
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

  const handleExport = useCallback(() => {
    exportSession(corners, attacks)
  }, [corners, attacks])

  const handleImport = useCallback((jsonText) => {
    try {
      const { corners: c, attacks: a } = importSession(jsonText)
      a.forEach(atk => {
        atk.deployments.forEach(d => {
          const t = TROOP_TYPES.find(t => t.id === d.troop)
          if (t) { d.emoji = t.emoji; d.color = t.color }
        })
      })
      setCorners(c)
      setAttacks(a)
      setPhaseRaw('deploy')
    } catch (e) {
      alert('Failed to load session: ' + e.message)
    }
  }, [])

  return {
    phase, baseImage, baseImgEl, corners, dragIdxRef,
    attacks, currentAttack, selectedTroop,
    showGrid, showLabels, heatmapStar, heatmapOpacity, hoveredCell,
    goPhase, loadImage,
    addCorner, updateCorner, resetCorners,
    addDeployment, undoDeployment, setStar, saveAttack, clearCurrentAttack,
    setSelectedTroop,
    setShowGrid, setShowLabels,
    setHeatmapStar, setHeatmapOpacity,
    setHoveredCell,
    handleExport, handleImport,
  }
}