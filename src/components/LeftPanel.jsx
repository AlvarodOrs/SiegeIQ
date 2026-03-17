import React, { useState } from 'react'
import styles from './LeftPanel.module.css'
import {
  ARMY_TYPES, STAR_COLORS, CORNER_COLORS,
  CORNER_LABELS, PHASE_LABELS, PHASE_INSTRUCTIONS,
} from '../utils/constants'

export default function LeftPanel({
  phase, corners, attacks, currentAttack,
  selectedUnit, showGrid, showLabels,
  onUpload, onResetCorners, onGoPhase,
  onSelectUnit, onSetStar, onUndoDeployment, onSaveAttack,
  onToggleGrid, onToggleLabels,
  onExport, onImport,
}) {
  const [hoverStars, setHoverStars] = useState(null)

  const canSave = currentAttack.stars !== null && currentAttack.deployments.length > 0

  // Determine if a star should look "lit up"
  // If hovering: show stars up to hover point
  // If not hovering: show stars up to currentAttack.stars
  const getDisplayStars = () => (hoverStars !== null ? hoverStars : currentAttack.stars || 0);

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
            <label className={`${styles.btn} ${styles.muted}`} style={{ cursor:'pointer', marginTop:4 }}>
              ⬆ LOAD SESSION
              <input type="file" accept=".json" style={{ display:'none' }} onChange={handleImportFile} />
            </label>
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

      {/* Army selector */}
      {phase === 'deploy' && (
        <section className={styles.section}>
          <div className="section-label">ARMY TYPE</div>
          <div className={styles.troopGrid}>
          {/* Troops */}
          <div className={styles.troopGrid}>
            {ARMY_TYPES.map(t => {
              const isSelected = selectedUnit?.id === t.id;
              let isDisabled = false;

              if (t.type === 'hero') {
                const deployedHero = currentAttack.deployments.find(d => d.unitType === 'hero')
                isDisabled = deployedHero && deployedHero.unitId !== t.id
              }

              return (
                <button
                  key={t.id}
                  className={`${styles.troopBtn} ${isSelected ? styles.troopSelected : ''} ${isDisabled ? styles.disabledBtn : ''}`}
                  style={isSelected ? { background: t.color + '18', borderColor: t.color, color: t.color } : {}}
                  onClick={() => !isDisabled && onSelectUnit(t.id, t.type)}
                  disabled={isDisabled}
                >
                  <span className={styles.troopEmoji}>{t.emoji}</span>
                  <span>{t.label.toUpperCase()}</span>
                </button>
              );
            })}
          </div>
          </div>
        </section>
      )}

      {/* Attack result + save */}
      {phase === 'deploy' && (
        <section className={styles.section}>
          <div className="section-label">ATTACK RESULT</div>
          <div 
            className={styles.starContainer}
            onMouseLeave={() => setHoverStars(null)}
          >
            {[ [1, 2, 3], [4, 5, 6] ].map((row, rowIndex) => (
              <div key={rowIndex} className={styles.starRow}>
                {row.map(s => {
                  const displayValue = getDisplayStars();
                  const isActive = s <= displayValue;
                  const isHoverMode = hoverStars !== null;
                  const stageClass = s <= 3 ? styles.silverStage : styles.goldStage;

                  return (
                    <button
                      key={s}
                      className={`
                        ${styles.starBtn} 
                        ${stageClass}
                        ${isActive ? styles.starActive : styles.starGrey}
                        ${(isActive && isHoverMode) ? styles.starHovering : ''}
                      `}
                      onMouseEnter={() => setHoverStars(s)}
                      onClick={() => onSetStar(s)}
                    >
                      ★
                    </button>
                  );
                })}
              </div>
            ))}
            <div className={styles.starFooter}>
               <button className={styles.resetBtn} onClick={() => onSetStar(0)}>RESET TO 0★</button>
               <span className={styles.starCountDisplay}>{currentAttack.stars || 0}/6</span>
            </div>
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
                <span className={styles.atkId}>#{a.attack_id}</span>
                
                {/* Star Display for Log */}
                <div className={styles.logStars}>
                  {[1, 2, 3, 4, 5, 6].map(s => (
                    <span 
                      key={s} 
                      className={`
                        ${styles.logStar} 
                        ${s <= a.stars ? (s <= 3 ? styles.logSilver : styles.logGold) : styles.logEmpty}
                      `}
                    >
                      ★
                    </span>
                  ))}
                </div>

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