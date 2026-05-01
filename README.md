# fibonacci-grid

A pure-CSS Fibonacci / golden-ratio spiral grid layout.

Cells are squares sized by powers of φ (≈ 0.618), rotated and shrunk around the
spiral's convergence point to produce a classic Fibonacci tiling with zero
JavaScript. The last cell fills the remaining golden rectangle by default — opt
out with `spiral-grid--no-fill` to leave the wedge visible.

## Features

- Pure CSS: no JavaScript, no build step. Just `prototype/spiral-grid.css`.
- Auto-fill last cell into the golden rectangle (opt out per spiral).
- Scale-compensated visual gap via `--spiral-grid-gap` (clip-path based, layout
  untouched) with an automatic content safe-zone that scales with each cell.
- Orientation modifiers: `spiral-grid--reverse`, `spiral-grid--portrait`,
  `spiral-grid--auto` (responsive sizing), `spiral-grid--no-counter-rotate`
  (let content rotate with the cell — useful for scroll-driven effects).
- Per-cell scrolling via `spiral-grid__content--scroll` /
  `--scroll-x` / `--scroll-y` — card-style content that overflows its cell
  scrolls independently, with the scrollbar automatically clear of the
  gap's clip-path.
- Graceful fallbacks for browsers without CSS `pow()` and for
  `prefers-reduced-motion: reduce`.

## Prototype

Open any of these in a browser:

- `prototype/index.html` — the main demo gallery (sweeps, fill, reverse,
  portrait, multi-spiral, responsive resize).
- `prototype/gap.html` — the gap / clip-path feature in isolation, including
  edge-bleed and content-clipping showcases.
- `prototype/scroll.html` — per-cell scrolling stress test: rotated cells,
  `--scroll-x`, gap interaction, reverse spirals.
- `prototype/scroll-zoom.html` — scroll-driven spiral zoom: scroll the page
  to zoom into the eye while each cell takes its turn as the upright hero.

## Docs

- `doc/golden-ratio-spiral-grid.md` — math and convergence-point derivations.
- `doc/spiral-grid-library-sketch.md` — library API sketch.
- `doc/gap-postmortem.md` — how the gap feature was designed (tried
  approaches, why clip-path won).
- `doc/cell-scrolling.md` — design notes for per-cell scrolling.
- `doc/scroll-zoom.md` — design notes for the scroll-driven spiral zoom.
- `doc/publish-roadmap.md` — roadmap toward publishing as a library.
