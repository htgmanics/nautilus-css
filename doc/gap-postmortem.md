# Gap Feature — Post-Mortem

Research notes from the first attempt at implementing `--spiral-grid-gap`.

## Goal

A CSS custom property (`--spiral-grid-gap`) that adds consistent visual spacing between cells, similar to CSS `gap` in grid/flex layouts.

## Why It's Hard

The spiral grid is fundamentally different from CSS Grid/Flexbox. Cells are absolutely positioned and scaled via `transform: scale(pow(phi, i))`. This creates three interconnected problems:

### 1. Scale compensation

A naive gap (e.g. `padding: 4px` on cells) gets scaled down with the cell. Cell 1 shows 4px, cell 5 shows ~0.6px (sub-pixel), cell 8 shows ~0.14px (invisible). The gap must be divided by `pow(phi, i)` to stay visually constant after scaling.

**Formula:** `gap / pow(phi, i)` per cell.

This works mathematically but produces very large pre-scale values for deep cells (cell 8: `gap * 29`, cell 10: `gap * 76`).

### 2. Fill cell distortion

The last cell (fill) is reshaped from a square to a golden rectangle (`width: 100%; aspect-ratio: 1.618`). Applying equal padding on all sides with `box-sizing: border-box` distorts the content's aspect ratio — padding consumes different proportions of width vs height.

### 3. Background-clip conflict

Moving the gap to `border: Npx solid transparent` on `.spiral-grid__content` avoids cell-level layout issues. But CSS `background` shorthand resets `background-clip` to `border-box`, making the transparent border invisible (background bleeds through). Fixing this requires `background-clip: padding-box !important`, which is heavy-handed for a library and fragile when users apply backgrounds.

## Approaches Tried

| Approach | Result |
|----------|--------|
| `padding` on `.spiral-grid__cell` | Sub-pixel rendering on small cells; fill cell aspect-ratio distortion |
| Scale-compensated `padding` on cell | Fill cell breaks (large padding + border-box + non-square = distorted content) |
| `border: transparent` on `.spiral-grid__content` | Works visually, but `background` shorthand resets `background-clip`, hiding the gap |
| `background-clip: padding-box !important` | Works but requires `!important` — not acceptable for a library |

## Possible Future Approaches

1. **CSS `@property` for background-clip** — register `--spiral-grid-gap` with `@property` and use it to conditionally apply `background-clip`. Doesn't solve the core issue but might enable cleaner APIs.

2. **Wrapper element** — add a third wrapper (`__cell` > `__gap` > `__content`) where `__gap` handles the spacing. Adds markup complexity but isolates the gap from content styling. The gap element would have a fixed background matching the container.

3. **CSS `outline-offset`** — use a negative outline-offset with a solid outline matching the container background. Avoids layout impact but requires knowing the container color.

4. **`mask` / `clip-path`** — clip the content inward by the gap amount. Resolution-independent and doesn't interact with backgrounds. But `clip-path: inset()` would need scale compensation, and browser support for `clip-path` on non-SVG is recent.

5. **JavaScript helper** — a tiny JS function that reads the container size and sets per-cell CSS variables for the gap. Breaks the pure-CSS philosophy but would handle all edge cases.

6. **Rethink the architecture** — instead of absolute positioning + scale transforms, use CSS Grid with `subgrid` or a different layout strategy that supports native `gap`. Would be a v2 rewrite.

## Recommendation

Defer to a dedicated feature branch. The gap needs a fundamentally different approach than what was attempted. A wrapper element (option 2) or clip-path (option 4) are the most promising paths. Both need prototyping and cross-browser testing before committing to an API.

---

# Resolved: `clip-path: inset()`

Implemented in `prototype/spiral-grid.css` behind the `--spiral-grid-gap`
custom property. See `prototype/gap.html` for the full test matrix.

## Why it works

`clip-path: inset()` is purely a paint operation, so it sidesteps every
problem the layout-based approaches hit:

1. **Scale compensation** — the clip lives in the cell's local
   coordinate system and rides the `scale()` transform. Pre-scale
   inset of `gap / 2 / pow(phi, i)` becomes a constant `gap / 2`
   visible inset on every cell.
2. **Fill cell distortion** — clipping doesn't touch layout, so the
   golden-rectangle fill cell keeps its aspect ratio. Inset trims an
   equal number of pixels from all four sides regardless of the cell's
   shape.
3. **`background-clip` conflict** — there is no `background-clip`
   involvement at all. Clip-path clips backgrounds, borders, and
   children uniformly. Users can set `background: …` (any value, any
   shorthand) and the gap still shows.

Bonuses:

- **Pointer events** follow the clip in modern browsers — the gap
  region doesn't intercept hover/clicks.
- **Pure CSS**, no extra markup, no wrapper element.
- **Animatable** via `transition: clip-path …`.
- **Browser support** (Chrome 55+, Safari 14+, Firefox 54+) is wider
  than the existing `pow()` requirement, so it adds no new constraints.

## API

```css
.my-spiral {
    --spiral-grid-gap: 8px;
}
```

`--spiral-grid-gap` is the *total* visual gap between adjacent cells.
Each cell contributes half from its side. Defaults to `0px`.

## The depth limit (and how to live with it)

The gap is an absolute length, but cells shrink exponentially
(`pow(phi, i)`). For any constant gap, deep enough cells eventually
become smaller than the gap itself and disappear. This is geometry,
not a bug.

Cell N (1-indexed) has post-scale visible side `container_width × phi^N`
and remains visible while that's larger than the gap, i.e. while
`container_width > gap × phi^(-N) = gap × 1.618^N`:

| cell index | min container width for gap=8px | for gap=16px | for gap=24px |
|------------|---------------------------------|--------------|--------------|
| 4          | ~55 px                          | ~110 px      | ~165 px      |
| 5          | ~89 px                          | ~178 px      | ~266 px      |
| 6          | ~144 px                         | ~287 px      | ~431 px      |
| 7          | ~232 px                         | ~465 px      | ~697 px      |
| 8          | ~376 px                         | ~752 px      | ~1128 px     |
| 9          | ~608 px                         | ~1216 px     | ~1824 px     |

Read: "at gap=24px on an 800px container, cell 8 and deeper disappear"
— matches the behavior you'll observe in the prototype.

### Recommended pattern: container-relative units

For responsive layouts, express the gap in container query units so it
shrinks with the container automatically:

```css
.my-spiral {
    /* 1.2% of container inline size — ~9.6px on 800px, ~3.6px on 300px */
    --spiral-grid-gap: 1.2cqi;
}
```

This doesn't change the depth threshold (it's still a fixed
gap-to-cell ratio), but the gap *looks* sensibly proportioned at every
container size and never overwhelms the layout.

### Recommended pattern: breakpoint step-down

When you need the gap to drop on small viewports, the simplest path is
an `@media` query:

```css
.my-spiral { --spiral-grid-gap: 16px; }

@media (max-width: 500px) {
    .my-spiral { --spiral-grid-gap: 6px; }
}
```

For a container-aware step-down (independent of the viewport), wrap
the spiral in an element with `container-type: inline-size` and query
that wrapper. `.spiral-grid` itself cannot be queried this way because
its own `container-type` applies to its *descendants*, not to the
spiral element itself:

```html
<div class="spiral-wrapper">
    <div class="spiral-grid my-spiral">...</div>
</div>
```

```css
.spiral-wrapper { container-type: inline-size; }
.my-spiral { --spiral-grid-gap: 16px; }

@container (max-width: 500px) {
    .my-spiral { --spiral-grid-gap: 6px; }
}
```

## Trade-offs accepted

- The scale compensation produces large pre-scale insets at depth
  (cell 10 needs ~76× the half-gap). At extreme settings the inset
  exceeds the cell's pre-scale size and the cell becomes invisible.
  Documented as a known limit; users hitting it should reduce gap or
  cell count.
- We deliberately do **not** clamp the inset (e.g. `min(…, 50%)`) to
  prevent the threshold disappearance. The disappearance is a
  predictable, geometry-driven outcome; clamping would trade
  predictability for a slightly nicer-looking failure mode and adds
  CSS that doesn't earn its keep.

## Follow-up: automatic content safe-zone

Shipping `clip-path: inset()` exposed a second-order problem: inner
content (text right against the edge, cards with a border, background
images drawn edge-to-edge) gets visually clipped by the gap. Every user
would otherwise have to re-derive the same scale-compensated padding
on `.spiral-grid__content` to avoid it.

The library now applies that padding automatically via
`--spiral-grid-safe-zone` (defaults to `var(--spiral-grid-gap) / 2`),
also scale-compensated with `pow(phi, i)`. Users get a safe zone for
content for free when they set a gap, and can opt out by overriding the
custom property:

```css
.my-spiral {
    --spiral-grid-gap: 8px;
    --spiral-grid-safe-zone: 0; /* go flush to the clip edge */
}
```

Same `pow()` + precomputed fallback story as the gap itself. Reduced-motion
mode resets the padding to `0` along with the clip-path. See section 9
of `prototype/gap.html` for side-by-side "safe" vs "opt-out" demos.

