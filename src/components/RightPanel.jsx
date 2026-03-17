import React, { useState } from 'react'
import styles from './RightPanel.module.css'
import leftStyles from './LeftPanel.module.css'

export default function RightPanel({
  attacks, heatmapStar, heatmapOpacity,
  onSetHeatmapStar, onSetHeatmapOpacity, onBack,
}) {
  const [hoverStars, setHoverStars] = useState(null)

  // Use hover value if present, otherwise use the selected filter
  const getDisplayValue = () => (hoverStars !== null ? hoverStars : heatmapStar)
  const totalPlacements = attacks.reduce((s, a) => s + a.deployments.length, 0)

  return (
    <aside className={styles.panel}>

      {/* Heatmap Filter Section */}
      <section className={styles.section}>
        <div className="section-label">HEATMAP FILTER</div>
        
        <button
          className={`${styles.filterBtn} ${heatmapStar === 'all' ? styles.active : ''}`}
          onClick={() => onSetHeatmapStar('all')}
          style={{ marginBottom: 10 }}
        >
          <span>VIEW ALL ATTACKS</span>
          <span className={styles.filterCount}>{attacks.length} total</span>
        </button>

        <div 
          className={leftStyles.starContainer} 
          onMouseLeave={() => setHoverStars(null)}
          style={{ padding: '10px' }}
        >
          {[ [1, 2, 3], [4, 5, 6] ].map((row, rowIndex) => (
            <div key={rowIndex} className={leftStyles.starRow} style={{ gap: '12px' }}>
              {row.map(s => {
                const displayValue = getDisplayValue()
                
                // Logic Fix: Check if this star is LESS THAN OR EQUAL to the active/hovered one
                const isSelected = heatmapStar !== 'all' && s <= heatmapStar
                const isHovered = hoverStars !== null && s <= hoverStars
                
                // Final "active" state for the CSS classes
                const isActive = hoverStars !== null ? isHovered : isSelected
                const isHoverMode = hoverStars !== null
                const stageClass = s <= 3 ? leftStyles.silverStage : leftStyles.goldStage

                return (
                  <button
                    key={s}
                    className={`
                      ${leftStyles.starBtn} 
                      ${stageClass}
                      ${isActive ? leftStyles.starActive : leftStyles.starGrey}
                      ${(isActive && isHoverMode) ? leftStyles.starHovering : ''}
                    `}
                    style={{ fontSize: '24px' }}
                    onMouseEnter={() => setHoverStars(s)}
                    onClick={() => onSetHeatmapStar(s)}
                  >
                    ★
                  </button>
                )
              })}
            </div>
          ))}
          <div className={leftStyles.starFooter}>
             <button className={leftStyles.resetBtn} onClick={() => onSetHeatmapStar(0)}>FILTER 0★</button>
             <span className={leftStyles.starCountDisplay}>
               {heatmapStar === 'all' ? 'ALL' : `${heatmapStar}★ & BELOW`}
             </span>
          </div>
        </div>
      </section>

      {/* Opacity Section */}
      <section className={styles.section}>
        <div className="section-label">OPACITY</div>
        <div className={styles.opacityLabel}>
          INTENSITY · <span>{Math.round(heatmapOpacity * 100)}%</span>
        </div>
        <input
          type="range" min={10} max={100}
          value={Math.round(heatmapOpacity * 100)}
          onChange={e => onSetHeatmapOpacity(parseInt(e.target.value) / 100)}
          className={styles.slider}
        />
      </section>

      {/* Statistics Section */}
      <section className={styles.section}>
        <div className="section-label">STATISTICS</div>
        {[0, 1, 2, 3, 4, 5, 6].map(s => {
          const count = attacks.filter(a => a.stars === s).length
          if (count === 0 && s !== 0) return null
          
          return (
            <div key={s} className={styles.statRow}>
              <div className={leftStyles.logStars}>
                {[1, 2, 3, 4, 5, 6].map(starIdx => (
                  <span 
                    key={starIdx} 
                    className={`
                      ${leftStyles.logStar} 
                      ${starIdx <= s ? (starIdx <= 3 ? leftStyles.logSilver : leftStyles.logGold) : leftStyles.logEmpty}
                    `}
                  >
                    ★
                  </span>
                ))}
              </div>
              <span className={styles.statVal}>{count}</span>
            </div>
          )
        })}
        <div className={styles.statDivider} />
        <div className={styles.statRow}>
          <span className={styles.statLabel}>TOTAL PLACEMENTS</span>
          <span className={styles.statVal}>{totalPlacements}</span>
        </div>
        <div className={styles.statRow}>
          <span className={styles.statLabel}>TOTAL ATTACKS</span>
          <span className={styles.statVal}>{attacks.length}</span>
        </div>
      </section>

      <section className={styles.section}>
        <div className="section-label">COLOR SCALE</div>
        <div className={styles.colorScale} />
        <div className={styles.scaleLabels}><span>LOW</span><span>HIGH</span></div>
      </section>

      <section className={styles.section}>
        <button className={styles.backBtn} onClick={onBack}>← BACK TO DEPLOY</button>
      </section>

    </aside>
  )
}