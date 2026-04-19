# Spiral Grid — v1 Library Sketch

A proposal for turning the Fibonacci Spiral Grid into a shareable, framework-agnostic CSS library.

**Scope of v1:** Static spiral layout, with the visual gap / content safe-zone feature. No infinite zoom (that's v2). Scroll-driven zoom ships as an opt-in modifier; its design notes live in `doc/scroll-zoom.md`.

This doc tracks the **target API**. It is kept in sync with the prototype in `prototype/spiral-grid.css`.

---

## Package Identity

- **Name:** `spiral-grid-css` (or `fibonacci-grid-css` if the npm name is available)
- **CSS prefix:** `.fib-spiral` (deliberately long-ish to avoid collisions with user `.spiral` utility classes)
- **Tagline:** "A golden-ratio spiral layout in pure CSS"
- **Size target:** < 2KB gzipped for the core CSS
- **Dependencies:** None
- **Browser support:** Evergreen (Chrome/Firefox/Safari/Edge — last 2 versions), plus a precomputed fallback path for browsers without CSS `pow()`

---

## File Structure

```
spiral-grid-css/
├── package.json
├── README.md
├── LICENSE
├── dist/
│   ├── spiral-grid.css              # compiled, ready to <link>
│   ├── spiral-grid.min.css
│   └── spiral-grid.scss             # source for SCSS users who want to customize
├── src/
│   ├── spiral-grid.scss             # main entry
│   ├── _variables.scss              # phi, shrinkage-point, defaults
│   ├── _core.scss                   # container + cell transforms
│   ├── _modifiers.scss              # reverse, portrait, no-fill, etc.
│   ├── _gap.scss                    # gap + content safe-zone
│   ├── _responsive.scss             # container query breakpoints
│   └── _a11y.scss                   # reduced-motion fallback
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
<div class="fib-spiral">
    <div class="fib-spiral__cell"><div class="fib-spiral__content">A</div></div>
    <div class="fib-spiral__cell"><div class="fib-spiral__content">B</div></div>
    <div class="fib-spiral__cell"><div class="fib-spiral__content">C</div></div>
    <div class="fib-spiral__cell"><div class="fib-spiral__content">D</div></div>
    <div class="fib-spiral__cell"><div class="fib-spiral__content">E</div></div>
    <div class="fib-spiral__cell"><div class="fib-spiral__content">F</div></div>
    <div class="fib-spiral__cell"><div class="fib-spiral__content">G</div></div>
</div>
```

**Why two wrappers (`__cell` and `__content`)?**
- `__cell` handles the rotation + scale
- `__content` handles counter-rotation, font-size compensation, and the scale-compensated content safe-zone when a gap is set
- Users style `__content` without fighting the transform

The last cell is **automatically reshaped** into the remaining golden rectangle so the spiral has no empty wedge at its eye. Opt out with `.fib-spiral--no-fill` to leave the wedge visible.

### Classes

| Class | Purpose |
|-------|---------|
| `.fib-spiral` | Container (golden rectangle) |
| `.fib-spiral__cell` | A cell in the spiral — auto-positioned via `:nth-child` |
| `.fib-spiral__content` | Content wrapper (counter-rotated, font-compensated, auto-padded when a gap is set) |

### Modifiers

| Modifier | Effect |
|----------|--------|
| `.fib-spiral--reverse` | Mirrors the spiral horizontally (cells coil inward from the left) |
| `.fib-spiral--portrait` | Flips to tall aspect ratio (height > width) |
| `.fib-spiral--auto` | Auto-switches to portrait when the container is taller than wide (via `@container`) |
| `.fib-spiral--no-fill` | Keeps the last cell as a plain square, leaving the golden-rectangle wedge visible at the eye (opt out of the default fill) |
| `.fib-spiral--no-counter-rotate` | Content rotates with the cell (no counter-rotation). Useful when a wrapper transform (e.g. the scroll-driven zoom) provides the rotation instead, or for "sequential hero" effects. |

### CSS Custom Properties

```css
.fib-spiral {
    /* Math constants (rarely override) */
    --fib-spiral-phi: 0.618033989;
    --fib-spiral-shrinkage: 0.276393202250021;

    /* Sizing */
    --fib-spiral-width: 100%;       /* container width */

    /* Animation (for user-driven transitions) */
    --fib-spiral-transition: transform 0.4s ease;

    /* Overflow control */
    --fib-spiral-overflow: hidden;  /* set to 'visible' if needed */

    /* Font-size cap (prevents deep cells from getting enormous text) */
    --fib-spiral-font-size-max: 8rem;

    /* Visual gap between cells (scale-compensated via clip-path) */
    --fib-spiral-gap: 0px;

    /* Automatic content safe-zone (also scale-compensated).
       Defaults to gap/2 so inner content stays inside the clipped area.
       Override to 0 to let content go flush to the clip edge. */
    --fib-spiral-content-padding: calc(var(--fib-spiral-gap) / 2);
}

.fib-spiral__cell {
    /* Per-cell background used by the fill cell.
       Set this (not `background` on __content) to get a cell-sized bg
       that survives the fill cell's reshape to a golden rectangle. */
    --fib-spiral-cell-bg: transparent;
}
```

**Cell count.** v1 ships precomputed rules for up to 10 cells. Beyond the 10th, cells are hidden via `display: none` rather than miscomputed. If you need more: compose multiple spirals side by side (e.g. 8 + 7 = 15 cells), or render into a deeper spiral and accept that the deepest cells become sub-pixel.

---

## Minimal CSS Implementation Sketch

```css
/* ============================================
   Spiral Grid v1 — Core
   ============================================ */

.fib-spiral {
    --fib-spiral-phi: 0.618033989;
    --fib-spiral-shrinkage: 0.276393202250021;

    /* User-tunable */
    --fib-spiral-width: 100%;
    --fib-spiral-overflow: hidden;
    --fib-spiral-transition: transform 0.4s ease;
    --fib-spiral-font-size-max: 8rem;
    --fib-spiral-gap: 0px;
    --fib-spiral-content-padding: calc(var(--fib-spiral-gap) / 2);

    position: relative;
    width: var(--fib-spiral-width);
    aspect-ratio: calc(1 + var(--fib-spiral-phi)) / 1;  /* golden rectangle */
    overflow: var(--fib-spiral-overflow);
    container-type: inline-size;
}

.fib-spiral__cell {
    position: absolute;
    top: 0;
    left: 0;
    width: calc(var(--fib-spiral-phi) * 100%);
    aspect-ratio: 1;
    /* Transform-origin at the spiral's convergence point,
       in cell-local coordinates (x divided by phi because
       cell width = phi × container width). */
    transform-origin:
        calc((1 - var(--fib-spiral-shrinkage)) / var(--fib-spiral-phi) * 100%)
        calc((1 - var(--fib-spiral-shrinkage)) * 100%);
    transition: var(--fib-spiral-transition, none);
    z-index: var(--i, 0);
    --i: 0;
}

/* Index each cell via :nth-child — just sets --i for the transform below. */
.fib-spiral__cell:nth-child(1)  { --i: 0; }
.fib-spiral__cell:nth-child(2)  { --i: 1; }
.fib-spiral__cell:nth-child(3)  { --i: 2; }
.fib-spiral__cell:nth-child(4)  { --i: 3; }
.fib-spiral__cell:nth-child(5)  { --i: 4; }
.fib-spiral__cell:nth-child(6)  { --i: 5; }
.fib-spiral__cell:nth-child(7)  { --i: 6; }
.fib-spiral__cell:nth-child(8)  { --i: 7; }
.fib-spiral__cell:nth-child(9)  { --i: 8; }
.fib-spiral__cell:nth-child(10) { --i: 9; }

/* Hide beyond the supported cell count rather than render wrong math. */
.fib-spiral__cell:nth-child(n+11) { display: none; }

/* Modern browsers: use pow() for a single rule that covers all indices. */
@supports (width: calc(pow(2, 3) * 1px)) {
    .fib-spiral__cell {
        transform:
            scale(pow(var(--fib-spiral-phi), var(--i)))
            rotate(calc(90deg * var(--i)));
        /* Scale-compensated visual gap via clip-path (layout untouched). */
        clip-path: inset(
            calc(var(--fib-spiral-gap) / 2 / pow(var(--fib-spiral-phi), var(--i)))
        );
    }
    .fib-spiral__content {
        transform: rotate(calc(-90deg * var(--i)));
        font-size: clamp(
            1rem,
            calc(1rem / pow(var(--fib-spiral-phi), var(--i))),
            var(--fib-spiral-font-size-max)
        );
        /* Scale-compensated safe-zone so inner content (borders, text,
           card edges) stays inside the clip. */
        padding: calc(
            var(--fib-spiral-content-padding) / pow(var(--fib-spiral-phi), var(--i))
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
.fib-spiral--no-counter-rotate .fib-spiral__content.fib-spiral__content {
    transform: none;
}

/* ============================================
   Modifier: reverse
   ============================================ */
.fib-spiral--reverse .fib-spiral__cell {
    left: auto;
    right: 0;
    transform-origin:
        calc(100% - (1 - var(--fib-spiral-shrinkage)) / var(--fib-spiral-phi) * 100%)
        calc((1 - var(--fib-spiral-shrinkage)) * 100%);
}
@supports (width: calc(pow(2, 3) * 1px)) {
    .fib-spiral--reverse .fib-spiral__cell {
        transform:
            scale(pow(var(--fib-spiral-phi), var(--i)))
            rotate(calc(-90deg * var(--i)));
    }
    .fib-spiral--reverse .fib-spiral__content {
        transform: rotate(calc(90deg * var(--i)));
    }
}

/* ============================================
   Modifier: portrait
   ============================================ */
.fib-spiral--portrait {
    aspect-ratio: 1 / calc(1 + var(--fib-spiral-phi));
}
.fib-spiral--portrait .fib-spiral__cell {
    width: 100%;
    transform-origin:
        calc(var(--fib-spiral-shrinkage) * 100%)
        calc((1 - var(--fib-spiral-shrinkage)) * (1 + var(--fib-spiral-phi)) * 100%);
}

/* Auto-switch to portrait via container query */
@container (aspect-ratio < 1) {
    .fib-spiral--auto {
        aspect-ratio: 1 / calc(1 + var(--fib-spiral-phi));
    }
    .fib-spiral--auto .fib-spiral__cell {
        width: 100%;
        transform-origin:
            calc(var(--fib-spiral-shrinkage) * 100%)
            calc((1 - var(--fib-spiral-shrinkage)) * (1 + var(--fib-spiral-phi)) * 100%);
    }
}

/* ============================================
   Default fill: last cell reshapes to the golden-rectangle wedge
   so the eye has no empty space. Opt out with .fib-spiral--no-fill.
   (Reshape geometry + content centering rules omitted here.)
   ============================================ */

/* ============================================
   Accessibility: reduced motion fallback
   ============================================ */
@media (prefers-reduced-motion: reduce) {
    .fib-spiral.fib-spiral {
        display: grid;
        grid-template-columns: 1fr;
        gap: 0.5rem;
        aspect-ratio: auto;
        overflow: visible;
    }
    .fib-spiral.fib-spiral .fib-spiral__cell {
        position: static;
        transform: none;
        width: 100%;
        aspect-ratio: auto;
        z-index: auto;
        clip-path: none;
    }
    .fib-spiral.fib-spiral .fib-spiral__content {
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
  "name": "spiral-grid-css",
  "version": "0.1.0",
  "description": "A golden-ratio spiral layout in pure CSS",
  "main": "dist/spiral-grid.css",
  "style": "dist/spiral-grid.css",
  "sass": "src/spiral-grid.scss",
  "files": ["dist/", "src/"],
  "keywords": ["css", "layout", "golden-ratio", "fibonacci", "spiral", "grid"],
  "license": "MIT",
  "scripts": {
    "build": "sass src/spiral-grid.scss dist/spiral-grid.css && cleancss dist/spiral-grid.css -o dist/spiral-grid.min.css",
    "dev": "sass --watch src:dist"
  }
}
```

---

## Usage Examples

### Plain HTML (zero build)

```html
<link rel="stylesheet" href="https://unpkg.com/spiral-grid-css/dist/spiral-grid.min.css">

<div class="fib-spiral">
    <div class="fib-spiral__cell"><div class="fib-spiral__content"><h1>Hello</h1></div></div>
    <div class="fib-spiral__cell"><div class="fib-spiral__content">World</div></div>
    <div class="fib-spiral__cell"><div class="fib-spiral__content">...</div></div>
</div>
```

With a visible gap and automatic content safe-zone:

```html
<div class="fib-spiral" style="--fib-spiral-gap: 8px">
    <!-- cells — inner content stays inside the safe zone automatically -->
</div>
```

### React

```jsx
import 'spiral-grid-css/dist/spiral-grid.css';

function Portfolio({ projects }) {
    return (
        <div className="fib-spiral" style={{ '--fib-spiral-gap': '6px' }}>
            {projects.map(p => (
                <div key={p.id} className="fib-spiral__cell">
                    <div className="fib-spiral__content">
                        <h3>{p.title}</h3>
                    </div>
                </div>
            ))}
        </div>
    );
}
```

### SCSS customization

```scss
@use "spiral-grid-css/src/spiral-grid" with (
    $phi: 0.618033989,
    $transition-duration: 0.6s
);

.my-portfolio {
    @extend .fib-spiral;
    --fib-spiral-width: 80vw;
    --fib-spiral-gap: 4px;
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
2. **Counter-rotation and text wrapping** — text inside rotated cells wraps at the rotated width, which can surprise users. Need clear docs + maybe a `fib-spiral__content--text` variant with controlled width.
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
