# golden-spiral-grid

A golden-ratio (Fibonacci-style) spiral layout in pure CSS. Zero JavaScript,
~1.6 KB gzipped.

Cells are squares scaled by powers of φ (≈ 0.618) and rotated 90° around the
spiral's convergence point, producing the classic golden-spiral tiling. The
last cell fills the remaining golden rectangle, so the eye of the spiral has no
empty wedge.

![Spiral grid demo](examples/screenshot-hero.png)

> **Status: 0.x.** The API may still shift before `1.0.0`. Pin a minor version.

## Install

```sh
npm install golden-spiral-grid
```

```js
import 'golden-spiral-grid';            // dist/spiral-grid.css
// or: import 'golden-spiral-grid/min'; // dist/spiral-grid.min.css
```

Or via CDN, no build step:

```html
<link rel="stylesheet" href="https://unpkg.com/golden-spiral-grid@0.1/dist/spiral-grid.min.css">
```

## Usage

```html
<div class="spiral-grid">
  <div class="spiral-grid__cell"><div class="spiral-grid__content">1</div></div>
  <div class="spiral-grid__cell"><div class="spiral-grid__content">2</div></div>
  <div class="spiral-grid__cell"><div class="spiral-grid__content">3</div></div>
  <div class="spiral-grid__cell"><div class="spiral-grid__content">4</div></div>
  <div class="spiral-grid__cell"><div class="spiral-grid__content">5</div></div>
</div>
```

- `.spiral-grid` is a golden rectangle (1.618 : 1) at `width: 100%`. Size it
  with plain `width` / `max-width`.
- `.spiral-grid__cell` is positioned, scaled and rotated automatically by its
  position (`:nth-child`). Style its `background` freely.
- `.spiral-grid__content` is counter-rotated so content stays upright, with
  font-size compensated for the cell's scale. Put your content here.

### Markup rules

- **Up to 10 cells.** Cells beyond the 10th are hidden. Need more? Put two
  spirals side by side.
- **Only cells may be `<div>` children** of `.spiral-grid`. The fill cell is
  found with `:last-of-type`, so use another tag (e.g. `<span>`) for any
  overlay element inside the container.

## Modifiers

On `.spiral-grid`:

| Class | Effect |
|---|---|
| `spiral-grid--reverse` | Mirror horizontally — spiral coils in from the left |
| `spiral-grid--portrait` | Tall golden rectangle (1 : 1.618) |
| `spiral-grid--auto` | Switch to portrait automatically when the container is taller than wide (container query) |
| `spiral-grid--no-fill` | Keep the last cell square, leaving the wedge at the eye visible |
| `spiral-grid--no-counter-rotate` | Let content rotate with its cell |

On `.spiral-grid__content`:

| Class | Effect |
|---|---|
| `spiral-grid__content--scroll` / `--scroll-y` | Make the cell a vertical scroll container |
| `spiral-grid__content--scroll-x` | Horizontal scroll container (image strips, timelines) |

Scrolling works best on cells 1–5; deeper cells are too small for a usable
scrollbar.

## Custom properties

Set these on `.spiral-grid`:

| Property | Default | Purpose |
|---|---|---|
| `--spiral-grid-gap` | `0px` | Visible gutter between cells. Stays constant at every depth. |
| `--spiral-grid-safe-zone` | `gap / 2` | Content padding that keeps content clear of the gap. Set `0` for full-bleed images. |
| `--spiral-grid-font-size-max` | `8rem` | Cap on compensated font-size in deep cells |
| `--spiral-grid-transition` | `none` | Cell transition, e.g. `transform 0.4s ease` |

```html
<div class="spiral-grid" style="--spiral-grid-gap: 8px">…</div>
```

`--spiral-grid-phi` and `--spiral-grid-shrinkage` are internal — don't
override them.

**Gap and depth:** because cells shrink exponentially, a large gap makes the
deepest cells vanish. Keep the gap small relative to the container, or scale
it with the container (e.g. `--spiral-grid-gap: 0.5cqi`).

## Browser support

- Evergreen browsers use CSS `pow()` for the geometry.
- Browsers without `pow()` get precomputed per-cell rules with identical
  output.
- `--auto` requires container queries.

## Accessibility

Under `prefers-reduced-motion: reduce`, the spiral degrades to a plain stacked
column: no transforms, no rotation, cells in source order. Content stays in
DOM order at all times, so screen readers and keyboard focus follow cell order
regardless of the visual spiral.

## Examples

Clone the repo and open any of these in a browser:

- [`examples/index.html`](examples/index.html) — gallery: fill, reverse,
  portrait, multi-spiral, responsive resize
- [`examples/gap.html`](examples/gap.html) — gap and safe-zone
- [`examples/scroll.html`](examples/scroll.html) — per-cell scrolling
- [`examples/scroll-zoom.html`](examples/scroll-zoom.html) — experimental
  scroll-driven zoom (not part of the 0.1 API)

## How it works

The math — why φ, where the convergence point sits, why the gap is divided by
`pow(φ, i)` — is written up in
[`doc/golden-ratio-spiral-grid.md`](doc/golden-ratio-spiral-grid.md). Design
notes for each feature live in [`doc/`](doc/).

## Development

```sh
npm install
npm test        # verify pow() fallback tables match the math
npm run build   # src/spiral-grid.css → dist/ (+ minified)
npm run size    # gzip size check (limit 2 KB)
```

## License

[MIT](LICENSE) © Henky Wu
