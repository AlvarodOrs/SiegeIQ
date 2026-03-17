/**
 * storage.js
 * Session export / import helpers.
 * The JSON schema matches the original Python project's expected format.
 */

// ── Export ────────────────────────────────────────────────────
/**
 * Serialise state to the canonical JSON schema and trigger a download.
 *
 * Schema:
 * {
 *   "version": "2.0",
 *   "corners": [{ "label": "LEFT|TOP|RIGHT|BOTTOM", "x": n, "y": n }, ...],
 *   "grid_size": 40,
 *   "grid_max": 20,
 *   "attacks": [{
 *     "attack_id": n,
 *     "stars": 0|1|2|3,
 *     "timestamp": ms,
 *     "deployments": [{ "troop": string, "x": n, "y": n, "seq": n }, ...]
 *   }, ...]
 * }
 */
export function exportSession(corners, attacks) {
  const LABELS = ['LEFT', 'TOP', 'RIGHT', 'BOTTOM']

  const payload = {
    version:   '2.0',
    exported:  new Date().toISOString(),
    corners:   corners.map((c, i) => ({ label: LABELS[i], x: Math.round(c.x), y: Math.round(c.y) })),
    grid_size: 40,
    grid_max:  20,
    attacks:   attacks.map(a => ({
      attack_id:   a.attack_id,
      stars:       a.stars,
      timestamp:   a.timestamp,
      deployments: a.deployments.map(d => ({
        troop: d.troop,
        x:     d.gx,
        y:     d.gy,
        seq:   d.seq,
      })),
    })),
  }

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = `coc_bb_attacks_${Date.now()}.json`
  a.click()
  URL.revokeObjectURL(url)
}

// ── Import ────────────────────────────────────────────────────
/**
 * Parse an exported JSON file back into app state.
 * Returns { corners, attacks } or throws on invalid format.
 */
export function importSession(jsonText) {
  const data = JSON.parse(jsonText)
  if (!data.corners || !data.attacks) throw new Error('Invalid session file.')

  const corners = data.corners.map(c => ({ x: c.x, y: c.y }))

  const attacks = data.attacks.map(a => ({
    attack_id:   a.attack_id,
    stars:       a.stars,
    timestamp:   a.timestamp || Date.now(),
    deployments: a.deployments.map((d, i) => ({
      troop: d.troop,
      gx:    d.x,
      gy:    d.y,
      seq:   d.seq ?? i + 1,
      emoji: '❓',   // caller should resolve emoji from TROOP_TYPES
      color: '#fff',
    })),
  }))

  return { corners, attacks }
}
