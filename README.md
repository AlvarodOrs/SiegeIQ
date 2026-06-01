<!-- [START]
## Overview

SiegeIQ is a web tool for Clash of Clans players focused on improving their Builder Base defense. Since the game provides no native replay analytics, SiegeIQ fills that gap by letting you manually log defense replays and visualize where attacks concentrate on your layout.

The result is a heatmap view broken down by star outcome — letting you identify which areas of your base are consistently exploited and adjust your layout accordingly.

## Scope

- **Replay logging** — manual entry of attack data per replay: troop composition, attack origin zones, and star result
- **Heatmap generation** — spatial visualization of attack patterns overlaid on the base grid
- **Star-based filtering** — heatmaps segmented by 0, 1, 2, and 3-star outcomes to isolate high-value attack patterns
- **Layout analysis** — visual feedback to identify weak points and inform base redesigns

## Status

Complete. Replay logging and heatmap rendering are live at [siege-iq.vercel.app](https://siege-iq.vercel.app).
[END] -->
# SiegeIQ - the CoC Builder Base Defense Analyzer v1.2

A professional tool for recording, replaying, and heatmap-analyzing attacks on
your Clash of Clans Builder Base. Built in React + Vite. No backend required —
all data lives in-browser, exportable as JSON.

---

## Project Structure

```
SiegeIQ/
├── index.html                    # Vite entry point
├── vite.config.js
├── package.json
└── src/
    ├── main.jsx                  # React root mount
    ├── App.jsx                   # Root component — wires state + canvas
    │
    ├── hooks/
    │   ├── useAppState.js        # Central state store + all actions
    │   └── useCanvas.js          # All canvas drawing routines
    │
    ├── utils/
    │   ├── constants.js          # GRID_SIZE, TROOP_TYPES, STAR_COLORS, etc.
    │   ├── geometry.js           # Diamond coordinate math (ported from Python)
    │   └── storage.js            # JSON export / import
    │
    ├── components/
    │   ├── Header.jsx            # Phase nav bar
    │   ├── Header.module.css
    │   ├── LeftPanel.jsx         # Upload / corners / troop / attack controls
    │   ├── LeftPanel.module.css
    │   ├── CanvasArea.jsx        # Interactive canvas viewport
    │   ├── CanvasArea.module.css
    │   ├── RightPanel.jsx        # Heatmap filter + stats
    │   └── RightPanel.module.css
    │
    └── styles/
        ├── globals.css           # CSS variables + reset
        └── App.module.css        # Root layout
```

---

## Setup

```bash
cd coc-analyzer
npm install
npm run dev          # → http://localhost:5173
npm run build        # production build → dist/
```

---

## Workflow

### 1 · UPLOAD
Upload any PNG/JPG screenshot of your Builder Base.

### 2 · CORNERS
Click the 4 extreme corners of the base diamond **in this order**:

```
        Top  (↑)
       /        \
   Left           Right
       \        /
        Bottom (↓)
```

Drag any dot to fine-tune. The perspective grid auto-updates.

### 3 · DEPLOY
- Pick a troop type from the left panel.
- Click inside the diamond to place troop markers.
- Each click records `{ troop, gx, gy, seq }` in diamond coordinates.
- Set the star result (0–3★), then **SAVE ATTACK**.
- Repeat for as many attacks as you want.

### 4 · HEATMAP
- Filter by star outcome (all / 0★ / 1★ / 2★ / 3★).
- Adjust opacity with the slider.
- The colour ramp: **cold blue → cyan → green → yellow → hot red**.
- Cell intensity = how many times troops landed there across all matching attacks.

---

## Coordinate System

The diamond grid uses your original Python coordinate system:

| Point   | Diamond coord |
|---------|---------------|
| Left    | (−20,  0)    |
| Top     | ( 0, +20)    |
| Right   | (+20,  0)    |
| Bottom  | ( 0, −20)    |

Grid resolution: 40×40 cells, each cell = 1 unit.

---

## JSON Export Schema

```json
{
  "version": "2.0",
  "exported": "2025-01-01T00:00:00.000Z",
  "corners": [
    { "label": "LEFT",   "x": 13,  "y": 429 },
    { "label": "TOP",    "x": 573, "y": 16  },
    { "label": "RIGHT",  "x": 1144,"y": 430 },
    { "label": "BOTTOM", "x": 573, "y": 850 }
  ],
  "grid_size": 40,
  "grid_max": 20,
  "attacks": [
    {
      "attack_id": 1,
      "stars": 3,
      "timestamp": 1700000000000,
      "deployments": [
        { "troop": "barbarian", "x": -12, "y": 5, "seq": 1 },
        { "troop": "archer",    "x":  15, "y": 8, "seq": 2 }
      ]
    }
  ]
}
```

The `x`/`y` fields are the same diamond coordinates as your Python
`diamond_coords_from_click()` output — fully compatible with your
existing `calculations.py`.

---

## Python → JS Code Map

| Python file / function              | JS equivalent                          |
|-------------------------------------|----------------------------------------|
| `calculations.py:diamond_coords_from_click()` | `geometry.js:diamondCoordsFromClick()` |
| `grid_utils.py:is_inside_diamond()` | `geometry.js:isInsideDiamond()`        |
| `grid_utils.py:draw_grid()`         | `useCanvas.js:drawGrid()`              |
| `grid_utils.py:lerp()`              | `geometry.js:lerp()`                   |
| `grid_editor.py:interactive_grid()` | `CanvasArea.jsx` corner click + drag   |
| `config.py:EXACT_CORNERS`           | Set interactively, draggable           |
| `config.py:GRID_ROWS/COLS`          | `constants.js:GRID_SIZE = 40`          |

---

## Keyboard Shortcuts

| Key          | Action                    |
|--------------|---------------------------|
| `Ctrl+Z`     | Undo last deployment      |
| `G`          | Toggle grid overlay       |
| `Escape`     | Exit heatmap → deploy     |

---

## Phase 2 Roadmap (future)

- **Auto corner detection** via OpenCV edge/contour detection on the base image
- **CV API integration** if Supercell exposes replay/base data
- **Attack clustering** — K-means on deployment positions to find patterns
- **Weak zone detection** — cells with high 3★ deployment density = entry points
- **Replay import** — parse screen recordings frame-by-frame
- **Multi-base support** — track different base layouts separately
- **Per-troop heatmaps** — filter heatmap by troop type, not just star outcome
