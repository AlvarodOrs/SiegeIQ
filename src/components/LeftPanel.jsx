import styles from './LeftPanel.module.css'
import {
  TROOP_TYPES, STAR_COLORS,
  CORNER_COLORS, CORNER_LABELS,
  PHASE_LABELS, PHASE_INSTRUCTIONS,
} from '../utils/constants'

export default function LeftPanel({
  phase, corners, attacks, currentAttack,
  selectedTroop, showGrid, showLabels,
  onUpload, onResetCorners, onGoPhase,
  onSelectTroop, onSetStar, onUndoDeployment, onSaveAttack,
  onToggleGrid, onToggleLabels,
  onExport, onImport,
}) {
  const canSave = currentAttack.stars !== null && currentAttack.deployments.length > 0

  function handleImportFile(e) {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => onImport(ev.target.result)
    reader.readAsText(file)
  }

  return (
    <aside className={styles.panel}>

      {/* Instructions */}
      <section className={styles.section}>
        <div className="section-label">INSTRUCTIONS</div>
        <div className={styles.instrBox}>
          <span className={styles.stepTag}>{PHASE_LABELS[phase]}</span>
          <span className={styles.instrText}>{PHASE_INSTRUCTIONS[phase]}</span>
          {phase === 'corners' && (
            <span className={styles.cornerProgress}>{corners.length}/4 corners placed</span>
          )}
        </div>
      </section>

      {/* Upload */}
      {(phase === 'upload' || phase === 'corners') && (
        <section className={styles.section}>
          <button className={`${styles.btn} ${styles.primary}`} onClick={onUpload}>
            📁 {phase === 'corners' ? 'CHANGE IMAGE' : 'UPLOAD BASE IMAGE'}
          </button>
          {attacks.length > 0 && (
            <>
              <label className={`${styles.btn} ${styles.muted}`} style={{ cursor:'pointer', marginTop:4 }}>
                ⬆ LOAD SESSION
                <input type="file" accept=".json" style={{ display:'none' }} onChange={handleImportFile} />
              </label>
            </>
          )}
        </section>
      )}

      {/* Corner controls */}
      {phase === 'corners' && (
        <section className={styles.section}>
          <div className="section-label">CORNER MARKERS</div>
          <div className={styles.cornerList}>
            {CORNER_LABELS.map((lbl, i) => {
              const c = corners[i]
              return (
                <div key={lbl} className={styles.cornerRow}>
                  <span style={{ color: CORNER_COLORS[i] }}>●</span>
                  <span style={{ color: CORNER_COLORS[i] }}>{lbl}</span>
                  <span className={styles.cornerCoord}>
                    {c ? `(${Math.round(c.x)}, ${Math.round(c.y)})` : '---'}
                  </span>
                </div>
              )
            })}
          </div>
          <div className={styles.btnRow}>
            <button className={`${styles.btn} ${styles.danger}`} onClick={onResetCorners}>
              ↺ RESET
            </button>
            <button
              className={`${styles.btn} ${styles.success}`}
              onClick={() => onGoPhase('deploy')}
              disabled={corners.length < 4}
            >
              PROCEED →
            </button>
          </div>
        </section>
      )}

      {/* Troop selector */}
      {phase === 'deploy' && (
        <section className={styles.section}>
          <div className="section-label">TROOP TYPE</div>
          <div className={styles.troopGrid}>
            {TROOP_TYPES.map(t => (
              <button
                key={t.id}
                className={`${styles.troopBtn} ${selectedTroop === t.id ? styles.troopSelected : ''}`}
                style={selectedTroop === t.id ? { background: t.color + '18', borderColor: t.color, color: t.color } : {}}
                onClick={() => onSelectTroop(t.id)}
              >
                <span className={styles.troopEmoji}>{t.emoji}</span>
                <span>{t.label.toUpperCase()}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Attack result + save */}
      {phase === 'deploy' && (
        <section className={styles.section}>
          <div className="section-label">ATTACK RESULT</div>
          <div className={styles.starRow}>
            {[0, 1, 2, 3].map(s => (
              <button
                key={s}
                className={`${styles.starBtn} ${currentAttack.stars === s ? styles[`star${s}`] : ''}`}
                onClick={() => onSetStar(s)}
              >
                {s === 0 ? '0★' : '★'.repeat(s)}
              </button>
            ))}
          </div>
          <div className={styles.btnRow} style={{ marginBottom: 8 }}>
            <button className={`${styles.btn} ${styles.muted}`} onClick={onUndoDeployment}>
              ↩ UNDO
            </button>
            <button
              className={`${styles.btn} ${styles.success}`}
              onClick={onSaveAttack}
              disabled={!canSave}
              style={{ flex: 2, opacity: canSave ? 1 : 0.35 }}
            >
              💾 SAVE ATTACK
            </button>
          </div>
          <div className={styles.deployCount}>
            {currentAttack.deployments.length} placement(s) this attack
          </div>
        </section>
      )}

      {/* Grid toggles */}
      {phase === 'deploy' && (
        <section className={styles.section}>
          <button
            className={`${styles.btn} ${showGrid ? styles.active : styles.muted}`}
            onClick={onToggleGrid}
          >
            🔲 GRID: {showGrid ? 'ON' : 'OFF'}
          </button>
          <button
            className={`${styles.btn} ${showLabels ? styles.active : styles.muted}`}
            onClick={onToggleLabels}
            style={{ marginTop: 6 }}
          >
            🏷 LABELS: {showLabels ? 'ON' : 'OFF'}
          </button>
        </section>
      )}

      {/* Attack log */}
      {attacks.length > 0 && phase !== 'heatmap' && (
        <section className={styles.section} style={{ flex: 1, overflow: 'hidden', display:'flex', flexDirection:'column' }}>
          <div className="section-label">ATTACK LOG ({attacks.length})</div>
          <div className={styles.attackLog}>
            {attacks.map(a => (
              <div key={a.attack_id} className={styles.attackEntry}>
                <span className={styles.atkId}>ATK #{a.attack_id}</span>
                <span style={{ color: STAR_COLORS[a.stars] }}>
                  {a.stars === 0 ? '0★' : '★'.repeat(a.stars)}
                </span>
                <span className={styles.atkDep}>{a.deployments.length}✦</span>
              </div>
            ))}
          </div>
          {phase === 'deploy' && (
            <button
              className={`${styles.btn} ${styles.purple}`}
              onClick={() => onGoPhase('heatmap')}
              style={{ marginTop: 10 }}
            >
              🔥 VIEW HEATMAP
            </button>
          )}
          <button className={`${styles.btn} ${styles.muted}`} onClick={onExport} style={{ marginTop: 6 }}>
            ⬇ EXPORT JSON
          </button>
        </section>
      )}

    </aside>
  )
}
