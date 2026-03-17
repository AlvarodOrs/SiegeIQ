import styles from './RightPanel.module.css'
import { STAR_COLORS } from '../utils/constants'

export default function RightPanel({
  attacks, heatmapStar, heatmapOpacity,
  onSetHeatmapStar, onSetHeatmapOpacity, onBack,
}) {
  const filters = [
    ['all', 'ALL'],
    [0, '0★'],
    [1, '★'],
    [2, '★★'],
    [3, '★★★'],
  ]

  const totalPlacements = attacks.reduce((s, a) => s + a.deployments.length, 0)

  return (
    <aside className={styles.panel}>

      <section className={styles.section}>
        <div className="section-label">HEATMAP FILTER</div>
        {filters.map(([v, label]) => {
          const count = v === 'all' ? attacks.length : attacks.filter(a => a.stars === v).length
          const active = heatmapStar === v || (v !== 'all' && heatmapStar === v)
          return (
            <button
              key={String(v)}
              className={`${styles.filterBtn} ${heatmapStar === v ? styles.active : ''}`}
              onClick={() => onSetHeatmapStar(v)}
            >
              <span style={{ color: v === 'all' ? 'var(--purple)' : STAR_COLORS[v] }}>{label}</span>
              <span className={styles.filterCount}>{count} atk</span>
            </button>
          )
        })}
      </section>

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

      <section className={styles.section}>
        <div className="section-label">STATISTICS</div>
        {[0, 1, 2, 3].map(s => (
          <div key={s} className={styles.statRow}>
            <span style={{ color: STAR_COLORS[s] }}>
              {s === 0 ? '0★' : '★'.repeat(s)}
            </span>
            <span>{attacks.filter(a => a.stars === s).length} attacks</span>
          </div>
        ))}
        <div className={styles.statDivider} />
        <div className={styles.statRow}>
          <span className={styles.statLabel}>TOTAL PLACEMENTS</span>
          <span>{totalPlacements}</span>
        </div>
        <div className={styles.statRow}>
          <span className={styles.statLabel}>TOTAL ATTACKS</span>
          <span>{attacks.length}</span>
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
