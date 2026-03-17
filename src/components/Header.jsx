import styles from './Header.module.css'
import { PHASES } from '../utils/constants'

const PHASE_DISPLAY = ['UPLOAD', 'CORNERS', 'DEPLOY', 'HEATMAP']

export default function Header({ phase, onPhaseClick }) {
  return (
    <header className={styles.header}>
      <div className={styles.logo}>⚔️</div>
      <div>
        <div className={styles.title}>BUILDER BASE — ATTACK ANALYZER</div>
        <div className={styles.sub}>CLASH OF CLANS · DIAMOND GRID · DEPLOYMENT HEATMAP SYSTEM v2.1</div>
      </div>
      <nav className={styles.phases}>
        {PHASES.map((p, i) => (
          <button
            key={p}
            className={`${styles.phaseBtn} ${phase === p ? styles.active : ''}`}
            onClick={() => onPhaseClick(p)}
          >
            {PHASE_DISPLAY[i]}
          </button>
        ))}
      </nav>
    </header>
  )
}
