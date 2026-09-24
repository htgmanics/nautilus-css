# Spiral Grid — v1 Library Sketch

A proposal for turning the Fibonacci Spiral Grid into a shareable, framework-agnostic CSS library.

**Scope of v1:** Static spiral layout, with the visual gap / content safe-zone feature. No infinite zoom (that's v2). Scroll-driven zoom ships as an opt-in modifier; its design notes live in `doc/scroll-zoom.md`.

This doc tracks the **target API**. It is kept in sync with the prototype in `prototype/spiral-grid.css`.

---

## Package Identity

- **Name:** `golden-spiral-grid` (decided — see roadmap §1; "fibonacci" is a keyword, not the name)
- **CSS prefix:** `.spiral-grid` (deliberately long-ish to avoid collisions with user `.spiral` utility classes)
- **Tagline:** "A golden-ratio spiral layout in pure CSS"
- **Size target:** < 2KB gzipped for the core CSS
- **Dependencies:** None
- **Browser support:** Evergreen (Chrome/Firefox/Safari/Edge — last 2 versions), plus a precomputed fallback path for browsers without CSS `pow()`

---

## File Structure

```
golden-spiral-grid/
├── package.json
├── README.md
├── LICENSE
├── dist/
│   ├── spiral-grid.css              # ready to <link> (copy of src)
│   └── spiral-grid.min.css          # minified
├── src/
│   └── spiral-grid.css              # single plain-CSS source (no SCSS — see roadmap §1)
├── examples/
│   ├── basic.html                   # plain HTML, no build
│   ├── gap.html                     # gap + safe-zone feature
│   ├── scroll-zoom.html             # scroll-driven spiral zoom
│   ├── react.jsx
│   ├── vue.vue
│   └── svelte.svelte
└── docs/
    ├── index.md                     # getting started
    ├── math.md                      # the geometry explained
    ├── accessibility.md
    └── recipes.md                   # common patterns
```

---

## Public API

### HTML structure

```html
<div class="spiral-grid">
    <div class="spiral-grid__cell"><div class="spiral-grid__content">A</div></div>
    <div class="spiral-grid__cell"><div class="spiral-grid__content">B</div></div>
    <div class="spiral-grid__cell"><div class="spiral-grid__content">C</div></div>
    <div class="spiral-grid__cell"><div class="spiral-grid__content">D</div></div>
    <div class="spiral-grid__cell"><div class="spiral-grid__content">E</div></div>
    <div class="spiral-grid__cell"><div class="spiral-grid__content">F</div></div>
    <div class="spiral-grid__cell"><div class="spiral-grid__content">G</div></div>
</div>
```

**Why two wrappers (`__cell` and `__content`)?**
- `__cell` handles the rotation + scale
- `__content` handles counter-rotation, font-size compensation, and the scale-compensated content safe-zone when a gap is set
- Users style `__content` without fighting the transform

The last cell is **automatically reshaped** into the remaining golden rectangle so the spiral has no empty wedge at its eye. Opt out with `.spiral-grid--no-fill` to leave the wedge visible.

### Classes

| Class | Purpose |
|-------|---------|
| `.spiral-grid` | Container (golden rectangle) |
| `.spiral-grid__cell` | A cell in the spiral — auto-positioned via `:nth-child` |
| `.spiral-grid__content` | Content wrapper (counter-rotated, font-compensated, auto-padded when a gap is set) |

### Modifiers

| Modifier | Effect |
|----------|--------|
| `.spiral-grid--reverse` | Mirrors the spiral horizontally (cells coil inward from the left) |
| `.spiral-grid--portrait` | Flips to tall aspect ratio (height > width) |
| `.spiral-grid--auto` | Auto-switches to portrait when the container is taller than wide (via `@container`) |
| `.spiral-grid--no-fill` | Keeps the last cell as a plain square, leaving the golden-rectangle wedge visible at the eye (opt out of the default fill) |
| `.spiral-grid--no-counter-rotate` | Content rotates with the cell (no counter-rotation). Useful when a wrapper transform (e.g. the scroll-driven zoom) provides the rotation instead, or for "sequential hero" effects. |
| `.spiral-grid__content--scroll` (also `--scroll-y`) | Makes that cell a vertical scroll container. Scrollbar sits inside the gap's safe-zone. Apply per-cell; design notes in `doc/cell-scrolling.md`. Recommended for cells 1–5 only (deeper cells can't fit usable scrollbars). |
| `.spiral-grid__content--scroll-x` | Horizontal-only variant. Useful for image strips or timelines inside a cell. |

### CSS Custom Properties

```css
.spiral-grid {
    /* Internal — do NOT override. Changing phi invalidates the
       precomputed fallback table and the geometry tests. */
    --spiral-grid-phi: 0.618033989;
    --spiral-grid-shrinkage: 0.276393202250021;

    /* Animation: opt-in. Users who want smooth transitions set this
       to `transform 0.4s ease` (or similar) on the container. */
    --spiral-grid-transition: none;

    /* Font-size cap (prevents deep cells from getting enormous text) */
    --spiral-grid-font-size-max: 8rem;

    /* Visual gap between cells (scale-compensated via clip-path) */
    --spiral-grid-gap: 0px;

    /* Automatic content safe-zone (also scale-compensated).
       Defaults to gap/2 so inner content stays inside the clipped area.
       Override to 0 to let content go flush to the clip edge. */
    --spiral-grid-safe-zone: calc(var(--spiral-grid-gap) / 2);
}
```

**Container sizing & overflow.** Use the standard CSS properties
(`width`, `height`, `overflow`) — the library doesn't wrap them. Default
is `width: 100%; overflow: hidden`.

**Cell backgrounds.** Set `background` directly on `.spiral-grid__cell`
(applies to all cells) or on `.spiral-grid__cell:last-of-type` (applies
only to the fill cell). The library preserves these through the fill
cell's reshape.

**Cell count.** v1 ships precomputed rules for up to 10 cells. Beyond the 10th, cells are hidden via `display: none` rather than miscomputed. If you need more: compose multiple spirals side by side (e.g. 8 + 7 = 15 cells), or render into a deeper spiral and accept that the deepest cells become sub-pixel.

---

## Minimal CSS Implementation Sketch

```css
/* ============================================
   Spiral Grid v1 — Core
   ============================================ */

.spiral-grid {
    /* Internal math constants — do NOT override. */
    --spiral-grid-phi: 0.618033989;
    --spiral-grid-shrinkage: 0.276393202250021;

    /* Public knobs */
    --spiral-grid-transition: none;
    --spiral-grid-font-size-max: 8rem;
    --spiral-grid-gap: 0px;
    --spiral-grid-safe-zone: calc(var(--spiral-grid-gap) / 2);

    position: relative;
    width: 100%;
    aspect-ratio: calc(1 + var(--spiral-grid-phi)) / 1;  /* golden rectangle */
    overflow: hidden;
    container-type: inline-size;
}

.spiral-grid__cell {
    position: absolute;
    top: 0;
    left: 0;
    width: calc(var(--spiral-grid-phi) * 100%);
    aspect-ratio: 1;
    /* Transform-origin at the spiral's convergence point,
       in cell-local coordinates (x divided by phi because
       cell width = phi × container width). */
    transform-origin:
        calc((1 - var(--spiral-grid-shrinkage)) / var(--spiral-grid-phi) * 100%)
        calc((1 - var(--spiral-grid-shrinkage)) * 100%);
    transition: var(--spiral-grid-transition, none);
    z-index: var(--i, 0);
    --i: 0;
}

/* Index each cell via :nth-child — just sets --i for the transform below. */
.spiral-grid__cell:nth-child(1)  { --i: 0; }
.spiral-grid__cell:nth-child(2)  { --i: 1; }
.spiral-grid__cell:nth-child(3)  { --i: 2; }
.spiral-grid__cell:nth-child(4)  { --i: 3; }
.spiral-grid__cell:nth-child(5)  { --i: 4; }
.spiral-grid__cell:nth-child(6)  { --i: 5; }
.spiral-grid__cell:nth-child(7)  { --i: 6; }
.spiral-grid__cell:nth-child(8)  { --i: 7; }
.spiral-grid__cell:nth-child(9)  { --i: 8; }
.spiral-grid__cell:nth-child(10) { --i: 9; }

/* Hide beyond the supported cell count rather than render wrong math. */
.spiral-grid__cell:nth-child(n+11) { display: none; }

/* Modern browsers: use pow() for a single rule that covers all indices. */
@supports (width: calc(pow(2, 3) * 1px)) {
    .spiral-grid__cell {
        transform:
            scale(pow(var(--spiral-grid-phi), var(--i)))
            rotate(calc(90deg * var(--i)));
        /* Scale-compensated visual gap via clip-path (layout untouched). */
        clip-path: inset(
            calc(var(--spiral-grid-gap) / 2 / pow(var(--spiral-grid-phi), var(--i)))
        );
    }
    .spiral-grid__content {
        transform: rotate(calc(-90deg * var(--i)));
        font-size: clamp(
            1rem,
            calc(1rem / pow(var(--spiral-grid-phi), var(--i))),
            var(--spiral-grid-font-size-max)
        );
        /* Scale-compensated safe-zone so inner content (borders, text,
           card edges) stays inside the clip. */
        padding: calc(
            var(--spiral-grid-safe-zone) / pow(var(--spiral-grid-phi), var(--i))
        );
        box-sizing: border-box;
    }
}

/* Fallback path: precomputed per-index rules for browsers without pow().
   (One block per i, each with its own scale, rotate, clip-path coefficient,
   and padding coefficient. Omitted here for brevity.) */

/* ============================================
   Modifier: no-counter-rotate
   ============================================ */
.spiral-grid--no-counter-rotate .spiral-grid__content.spiral-grid__content {
    transform: none;
}

/* ============================================
   Modifier: reverse
   ============================================ */
.spiral-grid--reverse .spiral-grid__cell {
    left: auto;
    right: 0;
    transform-origin:
        calc(100% - (1 - var(--spiral-grid-shrinkage)) / var(--spiral-grid-phi) * 100%)
        calc((1 - var(--spiral-grid-shrinkage)) * 100%);
}
@supports (width: calc(pow(2, 3) * 1px)) {
    .spiral-grid--reverse .spiral-grid__cell {
        transform:
            scale(pow(var(--spiral-grid-phi), var(--i)))
            rotate(calc(-90deg * var(--i)));
    }
    .spiral-grid--reverse .spiral-grid__content {
        transform: rotate(calc(90deg * var(--i)));
    }
}

/* ============================================
   Modifier: portrait
   ============================================ */
.spiral-grid--portrait {
    aspect-ratio: 1 / calc(1 + var(--spiral-grid-phi));
}
.spiral-grid--portrait .spiral-grid__cell {
    width: 100%;
    transform-origin:
        calc(var(--spiral-grid-shrinkage) * 100%)
        calc((1 - var(--spiral-grid-shrinkage)) * (1 + var(--spiral-grid-phi)) * 100%);
}

/* Auto-switch to portrait via container query */
@container (aspect-ratio < 1) {
    .spiral-grid--auto {
        aspect-ratio: 1 / calc(1 + var(--spiral-grid-phi));
    }
    .spiral-grid--auto .spiral-grid__cell {
        width: 100%;
        transform-origin:
            calc(var(--spiral-grid-shrinkage) * 100%)
            calc((1 - var(--spiral-grid-shrinkage)) * (1 + var(--spiral-grid-phi)) * 100%);
    }
}

/* ============================================
   Default fill: last cell reshapes to the golden-rectangle wedge
   so the eye has no empty space. Opt out with .spiral-grid--no-fill.
   (Reshape geometry + content centering rules omitted here.)
   ============================================ */

/* ============================================
   Accessibility: reduced motion fallback
   ============================================ */
@media (prefers-reduced-motion: reduce) {
    .spiral-grid.spiral-grid {
        display: grid;
        grid-template-columns: 1fr;
        gap: 0.5rem;
        aspect-ratio: auto;
        overflow: visible;
    }
    .spiral-grid.spiral-grid .spiral-grid__cell {
        position: static;
        transform: none;
        width: 100%;
        aspect-ratio: auto;
        z-index: auto;
        clip-path: none;
    }
    .spiral-grid.spiral-grid .spiral-grid__content {
        transform: none;
        font-size: 1rem;
        padding: 0;
    }
}
```

---

## Package.json

```json
{
  "name": "golden-spiral-grid",
  "version": "0.1.0",
  "description": "A golden-ratio spiral layout in pure CSS",
  "main": "dist/spiral-grid.css",
  "style": "dist/spiral-grid.css",
  "files": ["dist/"],
  "keywords": ["css", "layout", "golden-ratio", "fibonacci", "spiral", "grid"],
  "license": "MIT",
  "scripts": {
    "build": "cp src/spiral-grid.css dist/ && cssnano src/spiral-grid.css dist/spiral-grid.min.css"
  }
}
```

---

## Usage Examples

### Plain HTML (zero build)

```html
<link rel="stylesheet" href="https://unpkg.com/golden-spiral-grid/dist/spiral-grid.min.css">

<div class="spiral-grid">
    <div class="spiral-grid__cell"><div class="spiral-grid__content"><h1>Hello</h1></div></div>
    <div class="spiral-grid__cell"><div class="spiral-grid__content">World</div></div>
    <div class="spiral-grid__cell"><div class="spiral-grid__content">...</div></div>
</div>
```

With a visible gap and automatic content safe-zone:

```html
<div class="spiral-grid" style="--spiral-grid-gap: 8px">
    <!-- cells — inner content stays inside the safe zone automatically -->
</div>
```

### React

```jsx
import 'golden-spiral-grid/dist/spiral-grid.css';

function Portfolio({ projects }) {
    return (
        <div className="spiral-grid" style={{ '--spiral-grid-gap': '6px' }}>
            {projects.map(p => (
                <div key={p.id} className="spiral-grid__cell">
                    <div className="spiral-grid__content">
                        <h3>{p.title}</h3>
                    </div>
                </div>
            ))}
        </div>
    );
}
```

### Customization

All customization happens through the public custom properties — there is no
SCSS layer, and `--spiral-grid-phi` is internal (changing it invalidates the
precomputed fallback table and geometry tests).

```css
.my-portfolio.spiral-grid {
    width: 80vw;
    --spiral-grid-gap: 4px;
    --spiral-grid-transition: transform 0.6s ease;
}
```

---

## Documentation Plan

### `README.md` (in package)

- One-paragraph pitch
- 30-second install + copy-paste example with screenshot/GIF
- Link to full docs
- Browser support badge
- "When to use / when not to use" section upfront

### `docs/index.md` — Getting Started

- Install (npm, CDN, copy-paste)
- First spiral (5 minutes)
- Customization basics (size, gap, colors)
- Safe-zone opt-out recipe

### `docs/math.md` — The Geometry

- Why phi
- Why 90° rotation
- Derivation of `shrinkage_point = phi² × (1 − phi)`
- Why the transform-origin is at that point
- Why the gap must be divided by `pow(phi, i)` to stay visually constant
- Diagrams (SVG) showing the construction

### `docs/accessibility.md`

- Screen reader considerations
- Keyboard navigation patterns
- `prefers-reduced-motion` behavior
- Content-in-rotated-cells caveats
- ARIA recommendations

### `docs/recipes.md`

- Portfolio gallery
- Hero section
- Navigation menu
- Hover effects
- Transitions between states
- Per-cell scrolling (once shipped — see `doc/cell-scrolling.md`)
- Scroll-driven spiral zoom (once shipped — see `doc/scroll-zoom.md`)

---

## What's Explicitly NOT in v1

- **Infinite zoom navigation** — belongs in a separate companion package (`spiral-grid-navigator`)
- **JavaScript framework bindings** — users can use the CSS directly; wrappers can come later if demand exists
- **Interactive demo playground** — add in v1.1 if there's interest
- **Theming presets** — ship utility-class variants for common color schemes after shipping the core

---

## Risks & Open Questions

1. **`pow()` browser support** — currently Chrome 111+, Safari 16.4+, Firefox 118+. Good enough for 2026, but the precomputed nth-child fallback handles older browsers.
2. **Counter-rotation and text wrapping** — text inside rotated cells wraps at the rotated width, which can surprise users. Need clear docs + maybe a `spiral-grid__content--text` variant with controlled width.
3. **Container query support** — widely supported now (2023+), but if we want older browser support, we'd need viewport-based breakpoints as fallback.
4. **Gap depth limit** — the scale-compensated gap eventually exceeds a deep cell's pre-scale size and makes the cell invisible. This is geometry, not a bug; the postmortem documents the `container_width > gap × 1.618^N` threshold and the `cqi` / `@media` patterns for living with it. We deliberately do **not** clamp.
5. **Content overflow** — smaller cells can't fit much content. Need guidance on what kind of content works where.

---

## Launch Checklist

- [ ] Core CSS works in 3 browsers (Chrome, Safari, Firefox)
- [ ] `prefers-reduced-motion` fallback tested with screen reader
- [ ] README with GIF demo
- [ ] CodePen/StackBlitz demo link
- [ ] Documented math derivation (including gap / safe-zone math)
- [ ] Published to npm
- [ ] Example sites (portfolio, gallery, hero)
- [ ] Accessibility audit passed
- [ ] Blog post explaining the technique
