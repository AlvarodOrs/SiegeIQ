// ── Grid ──────────────────────────────────────────────────────
export const GRID_SIZE   = 40;   // 40x40 cells
export const GRID_MAX    = 20;   // diamond coords: -20 → +20

// ── Corner ordering: Left → Top → Right → Bottom ─────────────
export const CORNER_LABELS  = ['LEFT', 'TOP', 'RIGHT', 'BOTTOM'];
export const CORNER_COLORS  = ['#ef4444', '#f59e0b', '#22c55e', '#60a5fa'];

// ── Star colours ──────────────────────────────────────────────
export const STAR_COLORS = [
  '#9ca3af',  // 0 - grey
  '#22c97a',  // 1 - green
  '#90ee90',  // 2 - light green
  '#ffff00',  // 3 - yellow
  '#ffa500',  // 4 - orange
  '#ff6347',  // 5 - red-orange
  '#ff0000',  // 6 - red
]

// ── Army ──────────────────────────────────────────────────────
export const ARMY_TYPES = [
  // ── Troops ────────────
  { id: 'raged_barbarian',    label: 'Raged Barb',     color: '#f59e0b', emoji: '⚔️'  , type: 'troop'},
  { id: 'sneaky_archer',      label: 'Sneaky Archer',  color: '#10b981', emoji: '🏹'  , type: 'troop'},
  { id: 'boxer_giant',        label: 'Boxer Giant',    color: '#84cc16', emoji: '🥊'  , type: 'troop'},
  { id: 'beta_minion',        label: 'Beta Minion',    color: '#06b6d4', emoji: '👾'  , type: 'troop'},
  { id: 'bomber',             label: 'Bomber',         color: '#8b5cf6', emoji: '💣'  , type: 'troop'},
  { id: 'baby_dragon',        label: 'Baby Dragon',    color: '#ec4899', emoji: '🐉'  , type: 'troop'},
  { id: 'cannon_cart',        label: 'Cannon Cart',    color: '#f97316', emoji: '🛒'  , type: 'troop'},
  { id: 'night_witch',        label: 'Night Witch',    color: '#7c3aed', emoji: '🧙‍♀️'  , type: 'troop'},
  { id: 'drop_ship',          label: 'Drop Ship',      color: '#0ea5e9', emoji: '🚀'  , type: 'troop'},
  { id: 'power_pekka',        label: 'Power P.E.K.K.A',color: '#6366f1', emoji: '🤖'  , type: 'troop'},
  { id: 'hog_glider',         label: 'Hog Glider',     color: '#ef4444', emoji: '🪂'  , type: 'troop'},
  { id: 'electrofire_wizard', label: 'Electrofire Wiz',color: '#22d3ee', emoji: '🧙‍♂️'  , type: 'troop'},
// ── Heroes ────────────
  { id: 'battle_machine',     label: 'Battle Machine', color: '#e8a020', emoji: '🦾'  , type: 'hero'},
  { id: 'battle_copter',      label: 'Battle Copter',  color: '#f5c842', emoji: '🚁'  , type: 'hero'},
]

// ── Heatmap colour ramp (t → [R, G, B, A]) ───────────────────
// Ported from Python version; goes cold-blue → cyan → green → yellow → red
export const HEATMAP_STOPS = [
  [0.00, [0,   0,   80,  0  ]],
  [0.20, [0,   60,  220, 130]],
  [0.40, [0,   180, 255, 170]],
  [0.60, [0,   255, 120, 210]],
  [0.80, [255, 200, 0,   235]],
  [1.00, [255, 30,  0,   255]],
];

// ── Phases ────────────────────────────────────────────────────
export const PHASES = ['upload', 'corners', 'deploy', 'heatmap'];

export const PHASE_LABELS = {
  upload:  'STEP 1 · UPLOAD',
  corners: 'STEP 2 · CORNERS',
  deploy:  'STEP 3 · DEPLOY',
  heatmap: 'STEP 4 · HEATMAP',
};

export const PHASE_INSTRUCTIONS = {
  upload:  'Upload a screenshot of your Builder Base to begin.',
  corners: 'Click the 4 base corners in order: Left → Top → Right → Bottom. Drag to fine-tune.',
  deploy:  'Select a troop, then click inside the diamond to record deployments.',
  heatmap: 'Heatmap of recorded attack deployments, aggregated by star outcome.',
};
