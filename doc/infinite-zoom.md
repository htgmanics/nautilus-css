# Infinite Zoom — Prototype Findings

Date: 2026-09-28. Status: **prototype works** (`examples/infinite-zoom.html`).
Forward-only, lap steps. Built on the CSS Grid engine.

Replaces the React/react-spring mechanism described in
`doc/golden-ratio-spiral-grid.md` ("The Infinite Zoom Effect") with ~120
lines of vanilla JS on top of the grid engine, and adds measurements.

## The mechanism

Three ideas, in the order they matter.

**1. Self-similarity gives the zoom.** Scaling the spiral by φ⁻⁴ about the
eye maps cell 5 onto cell 1, cell 6 onto cell 2, … . One lap in = four cells
deeper, and because four cells is a full turn of the spiral, the orientation
is back where it started — no rotation needed. So a "step" is:

```js
transform: scale(φ⁻⁴)   // on the container, 1.2s — straight out of the eye
```

That's the **tunnel**: cells are born at the eye and fly past the viewer
(decided 2026-09-28). Adding `rotate(-360deg)` lands in the same place and
makes it a spin instead; kept as an off-by-default toggle in the prototype.

**2. Stacked layers fill the eye.** A single spiral has a hole at its eye
that *grows* as you zoom (from φ¹⁰ to φ⁶ of the width by the end of a lap).
So the stage holds four full-size spirals, layer k scaled by φ⁴ᵏ about the
eye: each layer sits exactly in the previous layer's fill cell. Layer k shows
items `offset + 4k … offset + 4k + 3`. The deepest layer is φ¹² ≈ 0.3% of the
width — two pixels — so four is plenty.

**3. The reset is a re-render.** When the lap animation lands, layer 1
occupies exactly layer 0's box. In one task: `offset += 4`, rebuild the four
layers, drop the transform. Nothing on screen changes, because every layer now
shows what the layer below it was showing a moment ago. No layer bookkeeping,
no `orders` array, no "swap the outermost to the innermost" — the *content
offset* is the only state.

```js
anim = zoom.animate([{ transform: from }, { transform: lapEnd }], { duration, fill: "forwards" });
anim.finished.then(() => {
  offset += 4; render();   // new DOM in place…
  anim.cancel();           // …then drop the forwards fill. Same task → same paint.
});
```

`fill: "forwards"` + `cancel()` *after* the re-render matters: with a CSS
`transition` or `fill: "none"`, the untransformed frame can paint before the
new content is in.

## What was tried first and why it lost

**Nesting the next spiral inside the fill cell.** Geometrically exact on
paper (the fill cell *is* a golden rectangle in the right orientation) and
prettier — recursion in the DOM, no layer maths. Two problems, both measured:

- *Text metrics.* The nested level laid out its text at 10px in a 57px cell,
  then got scaled ×6.85. Native layout at 71px after the reset differs by
  ~2px (font hinting is not linear). Fixable by laying each nested level out
  at root size and scaling by φ⁴ — which is already halfway to layers.
- *Layout rounding.* Chrome snaps track sizes to 1/64 px. The nested spiral
  inherits the fill cell's rounded position, and the lap transform magnifies
  that by 6.85×: a consistent 0.07–0.10 px seam that survived every fix
  (9-digit constants changed nothing). Layers don't have it because every
  layer is laid out at the *same* size — identical rounding — and scaled about
  the *same* point.

Lesson: for pixel-identical hand-off, all levels must share one layout size
and one transform origin. That is the layer stack.

## Measurements (Chrome headless, 640px stage)

| Check | Result |
|---|---|
| Layer 1 at lap end vs layer 0 at rest (4 squares, viewport rects) | **identical** to 0.01px (same numbers) |
| Screenshot before vs after reset | **6 differing pixels** of 252,800 (fuzz 8%); SSIM 0.99998 |
| Same, after 1.5px blur (catches shape shifts) | 8 pixels |
| Animated lap (WAAPI, 1.2s) | 71 frames, avg 16.8ms, max 29.2ms, 0 dropped |
| Wheel: Δ 0.83 then idle | settles forward, commits (+4) |
| Wheel: Δ 1.25 | commits once, keeps 0.25, settles back to 0 |
| 5 consecutive laps | offset 20 → 32, rects unchanged |
| DOM | 20 cells (4 layers × 5), ~120 lines JS |

## Inputs

- **Click / → / space**: one lap via WAAPI, `cubic-bezier(.6,0,.2,1)`.
- **Wheel**: progress `p += ΔY/1200`, transform set directly per event;
  commit while `p ≥ 1`; after 160ms idle, snap to the nearest lap boundary
  (≥ 0.5 finishes the lap, < 0.5 eases back).

## Design notes for the real thing

- **Lap steps, no spin, toward the viewer** (decided 2026-09-27/28). Four
  items per step, the same layout every time the motion finishes. Single-cell
  steps (90°) would need the rotation back plus the grid engine's
  `--hero-rotate` modifier, and non-hero cells then show rotated content at
  rest. Not planned.
- **Zooming out** (not built yet): render layer −1 as the current layer's
  parent — a full-size spiral scaled by φ⁻⁴ whose fill cell is the current
  view. Same stack, one more layer, root transform in [1, φ⁻⁴] instead of
  [φ⁻⁴, φ⁻⁸] equivalent. The four big cells of the parent are mostly
  off-screen; measure paint cost before optimising.
- **Content = a list + an offset.** That's the whole data model. Infinite by
  construction; finite lists just clamp the offset.
- **Reduced motion**: skip the animation, commit immediately.
- **Packaging**: this is JavaScript, so it does not belong in the CSS package.
  Ship as `examples/` recipe first; a `golden-spiral-navigator` package only if
  the recipe gets reused.

## Why this wanted the grid engine

The transform engine could do this too — the old React version did. But the
grid engine makes every layer a plain box: `cqi` type scales per cell at
every depth with no font compensation, and the fill cell needs no dual-aspect
content rules for layers to line up. The infinite-zoom prototype was ~2 hours
on the grid engine, most of it measurement.
