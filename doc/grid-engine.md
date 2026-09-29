# CSS Grid Engine — Prototype Findings

Date: 2026-09-24. Status: **prototype, decision pending** (see roadmap).

Side-by-side comparison of the current transform engine
(`src/spiral-grid.css`) against a CSS Grid engine with the same public API
(`src/spiral-grid.grid.css`). Comparison page was `examples/grid-prototype.html` (both engines via Shadow
DOM, measured cell rectangles, printed deltas); removed with the transform
engine on 2026-09-28 — see git history (commit 36208ee) to re-run it.

## Why this was explored

Every feature in the transform engine has needed its own compensation:
gap (`/ pow(φ, i)` clip-path), safe-zone padding (`/ pow(φ, i)`), font-size
(`× 1/pow(φ, i)`), scrollbars (a whole design doc), plus `pow()` fallback
tables and a verification script for each. The root cause is the mechanism:
cells are full-size squares scaled down, so **every px inside a cell is
scaled by φⁱ**. Before publishing that model as public API, check whether a
layout that produces the same rectangles *without* transforms exists.

## The geometry

Subdividing the golden rectangle 10 times produces only 7 distinct vertical
lines and 7 horizontal lines. So the whole tiling is one 6×6 grid:

```
columns: φ   φ⁵  φ⁹  φ¹⁰ φ⁷  φ³     (sum = 1)
rows:    φ²  φ⁶  φ¹⁰ φ¹¹ φ⁸  φ⁴     (sum = φ)  =  φ × columns
```

Rows are exactly φ × columns, so as `fr` ratios both templates are the
**same six numbers**. Cell i is one `grid-area` (a square placed
left / top / right / bottom in turn); the fill cell spans to the remainder's
far lines. That's the entire table: 6 track sizes + 10 placements + 10 fill
placements. No `pow()`, no per-index anything else.

Gotcha hit on the way: CSS Grid clamps the sum of `fr` factors to ≥ 1, so the
row list must be written normalised (which is what makes it identical to the
column list).

## Measured results (Chrome headless, 528px container)

| Check | Result |
|---|---|
| Cell rectangles vs transform engine, 7 cells | worst Δ **0.02px** (x, y, w, h) |
| Zoom: `scale(1/φᵏ) rotate(-90k°)` on the container, cell k+1 vs original cell-1 footprint | k=1: 0.02px · k=2: 0.04px · k=3: 0.08px |
| `--reverse`, `--portrait`, `--portrait --reverse` | match transform engine visually |
| `--auto` (container query) | switches to portrait ✓ |
| Fill cell, N = 3…10 | correct remainder for every N |
| Gap 8px / 16px, 215px and 528px containers | all cells exact squares; one gap between neighbours (after switching from margin to clip-path — margins broke the eye tracks at 215px) |
| Per-cell scroll | native scrollbar, normal size |
| `cqi` inside cells | reports the cell's real width ✓ (impossible in transform engine) |
| 1px border / 8px padding inside cells | 1px / 8px in every cell (transform engine: 0.15px / 1.2px by cell 5) |

Source size: 179 lines vs 490. Minified+gzipped: **869 B** vs 1623 B.

## How each feature maps

| Transform engine | Grid engine |
|---|---|
| `scale(pow(φ,i)) rotate(90i)` per cell + `pow()` fallback tables | 6 `fr` tracks + 10 `grid-area` rules |
| Counter-rotation of content | none needed |
| Font-size compensation `1rem / pow(φ,i)` | none needed; use `cqi` for per-cell scaling |
| Gap via `clip-path: inset(gap/2/pow(φ,i))` + content padding `/pow(φ,i)` | `clip-path: inset(gap/2)` + content padding `gap/2` — constants (grid `gap` distorts squares; cell margin/padding feed track minimums and break the eye tracks) |
| `--spiral-grid-safe-zone` | folded into the constant `gap/2` content padding |
| `z-index` by index | none needed — no overlap |
| `--reverse`: mirrored origins + separate transform tables | `direction: rtl` on the grid, `ltr` reset on content |
| `--portrait`: separate origins + fill rules | `writing-mode: vertical-rl` on the grid, `horizontal-tb` reset on content |
| `--no-counter-rotate` (sequential hero) | `--hero-rotate`: pre-rotate content of cell i by 90°(i-1) — 7 rules |
| Fill cell: `:last-of-type` + dual-aspect content rules for even cells | `:nth-child(n):last-child` grid-area, 10 rules, content untouched |
| Scroll-driven zoom (wrapper transform about the eye) | identical — the eye is at (1−s, 1−s) in both; grid engine ships `transform-origin` on the container |
| `verify-fallback.mjs` | nothing to verify — no derived tables |

## Trade-offs / open items

- **Overlays**: fill uses `:last-child`, so non-cell children of `.spiral-grid`
  must be `position: absolute` (absolutely positioned grid children don't take
  a track). Same class of markup rule as today's `:last-of-type` caveat.
- **`--hero-rotate` on the fill cell**: rotating content 90° inside a non-square
  cell overflows/clips. Transform engine had dual-aspect content rules for this;
  grid engine would need the equivalent if hero-rotate must work on the fill
  cell. Not needed for the static layout.
- **Text rendering**: grid cells are ordinary boxes — no scaled-layer blur
  (not measured headless; expected to be a strict improvement).
- **Browser support**: grid, `aspect-ratio`, `writing-mode`, container queries.
  Nothing newer than what the transform engine already requires (it uses
  container queries and `pow()`); actually *older*, since `pow()` is gone.
- **Track precision**: 6 decimal places, same as the current fallback tables.
  Verified sub-pixel across cells.

## Recommendation

Ship the grid engine as `src/spiral-grid.css` for v0.1. Keep the transform
prototype in git history (and `examples/scroll-zoom.html` as the zoom
reference until it's ported). Zoom / infinite zoom are unaffected: they were
always a container transform about the eye, which the grid engine exposes as
`transform-origin` out of the box.
