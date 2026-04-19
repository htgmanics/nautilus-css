# Scroll-Driven Spiral Zoom — Design Notes

Forward-looking research for a scrollytelling-style interaction where
scroll position drives a zoom-and-rotate animation of the spiral,
visually "falling into" the convergence point. Companion feature to
the eventual infinite-zoom navigator (`fib-spiral-navigator`).

## Goal

Let a page scroll act as a playhead for a continuous transform on the
whole spiral so that each scroll "step" advances the viewer one cell
deeper into the hierarchy. Feels like infinite zoom even with finite
content.

## Why It Works (The Self-Similarity Property)

The layout is a geometric sequence. Every cell is a scaled, rotated
copy of its predecessor:

- `cell[i].scale  = φ × cell[i-1].scale`
- `cell[i].rotate = cell[i-1].rotate + 90°`
- all cells share the same `transform-origin` (the convergence point)

If we apply a parent transform of `scale(1/φ) rotate(-90°)` to the
entire spiral, with transform-origin at that same convergence point,
the composed result for each cell is:

- `cell[i].scale  × (1/φ)         = φ^(i-1) = cell[i-1].scale`
- `cell[i].rotate + (-90°)        = 90°(i-1)  = cell[i-1].rotate`

So **after the transform, cell `i` occupies the exact position and
orientation that cell `i-1` used to**. The view has advanced one step
into the spiral, and the layout looks mathematically identical to a
spiral that was always "one level deeper."

This is the trick that makes the zoom feel infinite with a finite
number of cells: every unit of `scale(1/φ) rotate(-90°)` maps the
spiral onto itself with a one-cell shift.

## The CSS-Only Mechanism

Scroll-linked animations (CSS Scroll-Driven Animations, widely
available in evergreen browsers in 2026) let the browser run this
transform tied to scroll progress, no JavaScript required.

```css
.scene {
    height: 400vh;                     /* scroll distance for the zoom */
    view-timeline-name: --spiral-scene;
    view-timeline-axis: block;
}

.scene__pin {
    position: sticky;
    top: 0;
    height: 100vh;
    overflow: hidden;
}

.scene__spiral {
    transform-origin:
        calc((1 - var(--fib-spiral-shrinkage)) * 100%)
        calc((1 - var(--fib-spiral-shrinkage)) * 100%);
    animation: spiral-zoom linear both;
    animation-timeline: --spiral-scene;
    animation-range: cover 0% cover 100%;
}

@keyframes spiral-zoom {
    from { transform: scale(1) rotate(0deg); }
    to   {
        /* advance N steps */
        transform: scale(calc(1 / pow(var(--fib-spiral-phi), 4)))
                   rotate(-360deg);
    }
}
```

Key points:

- **`transform-origin` at the convergence point** is what makes this a
  "zoom into the eye" rather than a corner zoom. Landscape forward
  spirals: `(1 - shrinkage, 1 - shrinkage)` in container coords.
  Reverse / portrait mirror accordingly (see the existing cell rules
  in `spiral-grid.css` for the four variants).
- **Multiples of 360°** (or 90°) at both ends of the keyframe keep
  the final orientation aligned with the starting orientation, so the
  resting state after zoom looks "normal" rather than tilted.
- **`animation-range: cover 0% cover 100%`** ties progression to the
  moment the `.scene` element crosses the viewport — so the animation
  only runs while the reader is in the scrollytelling section.
- **`view-timeline-name` on `.scene`, `animation-timeline` on
  `.scene__spiral`**: the outer element owns the timeline, the inner
  element consumes it. This pattern keeps the pinned sticky child
  animating based on its parent's scroll position.

## Variants Worth Sketching

### 1. Pinned zoom (the default)

`position: sticky` on the spiral container, tall parent, single
continuous keyframe across the whole range. Reader scrolls →
spiral zooms in place → pin releases and normal scroll resumes.
Classic scrollytelling. The prototype in `prototype/scroll-zoom.html`
implements this.

### 2. Hero-to-grid handoff

Zoom once (one 90° step), then at `animation-range` end, crossfade
the spiral into a flat grid of the remaining cells. Opens on the
spiral as the hero, resolves to a readable grid. Good for a landing
page.

### 3. Scroll-snap ratchet

`scroll-snap-type` on the outer scroller + snap points at each 90°
rotation detent. The reader ratchets through cells one step at a
time rather than continuously zooming. Each detent has an
`animation-range` segment. Natural for product walkthroughs.

### 4. Stepped content swap

During each 90° zoom step, swap the content of the cell that's
becoming the new hero. Requires JavaScript (or `:has()` + scroll
position class hooks). Gives the illusion of infinite content: as
you zoom deeper, fresh content appears in what used to be "cell 2,
3, 4..." positions.

### 5. Cursor-follow (bonus, non-scroll)

Same math, different input. Point position in viewport drives the
transform instead of scroll. Hero animation; not really
scrollytelling. Kept here because the transform math is identical.

## Gotchas

### 1. Text upright-ness during rotation

Cells counter-rotate their content so text reads upright at rest.
During a scroll-driven rotation of the whole spiral, the content
inside the cells rotates *with* the spiral — text visibly spins
through -90°, -180°, -270° and back to 0° at the end.

Two philosophies:

- **Embrace it.** Scrollytelling implies readers aren't reading
  during motion. Text starts and ends upright at each rest state;
  the rotation in between is the effect.
- **Fight it.** Add a second animation on `.fib-spiral__content`
  that counter-counter-rotates (i.e. `rotate(calc(+360deg * progress))`
  with the same timeline). Keeps text always upright. Doubles the
  keyframe budget and slightly raises compositing cost.

Recommend starting with option 1 for v1 and offering option 2 as a
`.fib-spiral--scroll-zoom--upright-text` modifier if demand appears.

### 2. Content availability for perceived infinity

A 4-step zoom visually promotes cell 5 to cell 1's position. If the
spiral only has 5 cells, at the end of the zoom the reader sees a
mostly-empty spiral (cells 6–9 would be where cells 2–5 were). For
visual continuity, content needs to exist all the way out to
`starting-cells + zoom-steps`.

Practical: a 7-cell spiral + 3-step zoom feels right. A 9-cell
spiral + 4-step zoom is about the maximum before cells become
visually negligible.

### 3. Reduced motion

Must disable the scroll-driven animation entirely when
`prefers-reduced-motion: reduce`. Simplest: reset
`animation-timeline` to `none` inside the media query. The reader
still sees the spiral, just statically.

```css
@media (prefers-reduced-motion: reduce) {
    .scene__spiral { animation: none; }
    .scene { height: auto; }
    .scene__pin { position: static; height: auto; }
}
```

### 4. Browser support fallback

Chrome 115+ (2023), Safari 17+ (2024-ish, check `@supports`
carefully), Firefox 141+ (or behind a flag through 140). For the
fallback, just don't apply the scroll-driven animation — the spiral
renders statically, which is also a perfectly valid presentation.

```css
@supports not (animation-timeline: scroll()) {
    .scene__spiral { animation: none; }
    .scene { height: auto; }
    .scene__pin { position: static; height: auto; }
}
```

### 5. Compositing and mid-range phone stutter

`transform: scale(large) rotate(...)` on a parent with many nested
transformed layers is heavy. Chrome and Safari composite it as a
single layer when possible, but complex cell content (especially
with backgrounds, shadows, backdrop-filter) can push the browser
off the fast path.

Mitigations:

- `will-change: transform` on `.scene__spiral` (but use sparingly —
  it reserves memory).
- Avoid `backdrop-filter` inside zoomed cells.
- Limit cell count to ≤ 9 for mobile targets.

### 6. Hit-testing mid-zoom

Cells are rendered at the "correct" interpolated positions during
the zoom, but their hit boxes update per frame. Clicking during the
zoom can hit a cell that's visually not where your cursor is
(because the click fires slightly after the visual update).

Recommendation: mark cells `pointer-events: none` during the
animation range, re-enable at the start and end. Or just don't
make cells clickable during zoom — scrollytelling is passive anyway.

### 7. Interaction with the gap feature

The clip-path gap is applied per-cell in cell-local coordinates.
Because `clip-path: inset(X)` insets in the cell's local box and
rides both the cell's own transform **and** any parent transform,
the visible gap scales with the zoom just like every other part of
the rendered spiral. A pre-zoom gap of 3px ends at ~20.6px at a
4-step zoom (scale factor ≈ 6.854).

That's actually the correct visual behavior — treating the spiral
as a vector graphic, a zoom should scale everything, gap included.
**No special compensation is needed** for the zoom to look right.
The only practical guidance is: keep the pre-zoom gap small
(≤ 4px) so the end-of-zoom gap doesn't dominate visually. Tested
in `prototype/scroll-zoom.html` with `--fib-spiral-gap: 3px`.

If someone wants a gap that stays visually constant through the
zoom (unusual request — would look weird, like gaps widening
inversely as you zoom in), that would require binding the zoom
factor to a CSS variable and dividing the clip inset by it.
Possible but almost certainly not desired.

### 8. Interaction with per-cell scroll

`.fib-spiral__content` with `overflow: auto` inside a zoomed-and-
rotated parent is interaction-hostile. Scroll-driven zoom and
per-cell content scroll should be considered mutually exclusive.
Documentation: pick one interaction model per spiral.

## Open Questions

1. Should the zoom direction (into / out of the eye) be
   configurable, or is zoom-in the only useful default?
2. How many zoom steps are too many? Needs user-testing to answer.
3. Is there value in exposing the scroll position as a CSS variable
   (`--fib-spiral-scroll-progress`) so users can drive other
   elements from the same timeline (e.g. fading captions as the
   hero cell changes)?
4. Should we ship the keyframe as a library utility
   (`@keyframes fib-spiral-zoom-1step`, `...-2step`, `...-3step`,
   `...-4step`) or expect users to write their own?
5. How does this compose with the library's auto `--fib-spiral-width`
   / `--fib-spiral-auto` modifiers (container-query driven landscape
   / portrait switching)? Orientation switch mid-zoom would be
   jarring.

## Recommendation

Start with `prototype/scroll-zoom.html` implementing variant 1
(pinned zoom) to feel out the motion. If it's good:

1. Productize as `.fib-spiral--scroll-zoom` modifier with a
   `--fib-spiral-zoom-steps: 3` custom property.
2. Ship the reduced-motion / `@supports` fallback in the modifier
   itself so users get it for free.
3. Leave variants 2–4 as recipes in `docs/recipes.md` rather than
   library primitives (too opinionated for core).

The companion feature is `fib-spiral-navigator` (v2) — explicit
zoom via clicks/arrows instead of scroll. Shares the same math; the
transform keyframes here are reusable there as `animation-play-state`
driven transitions.
