# Spiral Grid — v1 Library Sketch

A proposal for turning the Fibonacci Spiral Grid into a shareable, framework-agnostic CSS library.

**Scope of v1:** Static spiral layout only. No infinite zoom (that's v2).

---

## Package Identity

- **Name:** `spiral-grid-css` (or `golden-spiral` if the npm name is available)
- **Tagline:** "A golden-ratio spiral layout in pure CSS"
- **Size target:** < 2KB gzipped for the core CSS
- **Dependencies:** None
- **Browser support:** Evergreen (Chrome/Firefox/Safari/Edge — last 2 versions)

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
│   ├── _modifiers.scss              # reverse, portrait, etc.
│   ├── _responsive.scss             # container query breakpoints
│   └── _a11y.scss                   # reduced-motion fallback
├── examples/
│   ├── basic.html                   # plain HTML, no build
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
<div class="spiral" data-cells="7">
    <div class="spiral__cell"><div class="spiral__content">A</div></div>
    <div class="spiral__cell"><div class="spiral__content">B</div></div>
    <div class="spiral__cell"><div class="spiral__content">C</div></div>
    <div class="spiral__cell"><div class="spiral__content">D</div></div>
    <div class="spiral__cell"><div class="spiral__content">E</div></div>
    <div class="spiral__cell"><div class="spiral__content">F</div></div>
    <div class="spiral__cell"><div class="spiral__content">G</div></div>
</div>
```

**Why two wrappers (`__cell` and `__content`)?**
- `__cell` handles the rotation + scale
- `__content` handles counter-rotation and font-size compensation
- Users style `__content` without fighting the transform

### Classes

| Class | Purpose |
|-------|---------|
| `.spiral` | Container (golden rectangle) |
| `.spiral__cell` | A cell in the spiral — auto-positioned via `:nth-child` |
| `.spiral__content` | Content wrapper (counter-rotated, font-compensated) |

### Modifiers

| Modifier | Effect |
|----------|--------|
| `.spiral--reverse` | Mirrors the spiral horizontally |
| `.spiral--portrait` | Flips to tall aspect ratio (height > width) |
| `.spiral--fill` | Container fills its parent (default: width-based) |
| `.spiral--auto` | Auto-switches to portrait when container is taller than wide (via `@container`) |
| `.spiral--no-counter-rotate` | Disables counter-rotation (cells + content both rotated) |

### Data attributes

| Attribute | Purpose |
|-----------|---------|
| `data-cells="N"` | Optional — hint for screen readers / can hide cells beyond N |

### CSS Custom Properties (for customization)

```css
.spiral {
    /* Math constants (rarely override) */
    --spiral-phi: 0.618033989;
    --spiral-shrinkage: 0.276393202250021;

    /* Sizing */
    --spiral-width: 100%;           /* container width */
    --spiral-max-cells: 9;          /* how many cells to render */

    /* Animation (for user-driven transitions) */
    --spiral-transition: transform 0.4s ease;

    /* Overflow control */
    --spiral-overflow: hidden;      /* set to 'visible' if needed */

    /* Font-size cap (prevents layout thrashing in deep cells) */
    --spiral-font-size-max: 8rem;

    /* Starting orientation */
    --spiral-rotation-step: 90deg;  /* advanced: change rotation per step */
    --spiral-direction: 1;          /* 1 = clockwise, -1 = counter */
}
```

---

## Minimal CSS Implementation Sketch

```css
/* ============================================
   Spiral Grid v1 — Core
   ============================================ */

.spiral {
    --spiral-phi: 0.618033989;
    --spiral-shrinkage: 0.276393202250021;

    /* User-tunable */
    --spiral-width: 100%;
    --spiral-overflow: hidden;
    --spiral-transition: transform 0.4s ease;
    --spiral-font-size-max: 8rem;

    position: relative;
    width: var(--spiral-width);
    aspect-ratio: calc(1 + var(--spiral-phi)) / 1;  /* golden rectangle */
    overflow: var(--spiral-overflow);
    container-type: inline-size;
}

.spiral__cell {
    position: absolute;
    top: 0;
    left: 0;
    width: calc(var(--spiral-phi) * 100%);
    aspect-ratio: 1;
    /* Transform-origin at the spiral's convergence point,
       in cell-local coordinates (x divided by phi because
       cell width = phi × container width). */
    transform-origin:
        calc((1 - var(--spiral-shrinkage)) / var(--spiral-phi) * 100%)
        calc((1 - var(--spiral-shrinkage)) * 100%);
    transition: var(--spiral-transition, none);
    z-index: var(--i, 0);
}

/* Each cell scales by phi^i and rotates by 90deg * i */
.spiral__cell:nth-child(1) { --i: 0; }
.spiral__cell:nth-child(2) { --i: 1; }
.spiral__cell:nth-child(3) { --i: 2; }
.spiral__cell:nth-child(4) { --i: 3; }
.spiral__cell:nth-child(5) { --i: 4; }
.spiral__cell:nth-child(6) { --i: 5; }
.spiral__cell:nth-child(7) { --i: 6; }
.spiral__cell:nth-child(8) { --i: 7; }
.spiral__cell:nth-child(9) { --i: 8; }

/* Modern browsers: use pow() directly */
@supports (width: calc(pow(2, 3) * 1px)) {
    .spiral__cell {
        transform:
            scale(pow(var(--spiral-phi), var(--i)))
            rotate(calc(90deg * var(--i)));
    }
}

/* Fallback for browsers without pow(): precomputed values */
@supports not (width: calc(pow(2, 3) * 1px)) {
    .spiral__cell:nth-child(1) { transform: scale(1)     rotate(0deg); }
    .spiral__cell:nth-child(2) { transform: scale(0.618) rotate(90deg); }
    .spiral__cell:nth-child(3) { transform: scale(0.382) rotate(180deg); }
    .spiral__cell:nth-child(4) { transform: scale(0.236) rotate(270deg); }
    .spiral__cell:nth-child(5) { transform: scale(0.146) rotate(360deg); }
    .spiral__cell:nth-child(6) { transform: scale(0.090) rotate(450deg); }
    .spiral__cell:nth-child(7) { transform: scale(0.056) rotate(540deg); }
    .spiral__cell:nth-child(8) { transform: scale(0.034) rotate(630deg); }
    .spiral__cell:nth-child(9) { transform: scale(0.021) rotate(720deg); }
}

/* Counter-rotate and font-compensate content */
.spiral__content {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;
}

@supports (width: calc(pow(2, 3) * 1px)) {
    .spiral__content {
        transform: rotate(calc(-90deg * var(--i)));
        font-size: clamp(1rem, calc(1rem / pow(var(--spiral-phi), var(--i))), var(--spiral-font-size-max));
    }
}

/* ============================================
   Modifier: reverse
   ============================================ */
.spiral--reverse .spiral__cell {
    left: auto;
    right: 0;
    transform-origin:
        calc(100% - (1 - var(--spiral-shrinkage)) / var(--spiral-phi) * 100%)
        calc((1 - var(--spiral-shrinkage)) * 100%);
}
@supports (width: calc(pow(2, 3) * 1px)) {
    .spiral--reverse .spiral__cell {
        transform:
            scale(pow(var(--spiral-phi), var(--i)))
            rotate(calc(-90deg * var(--i)));
    }
    .spiral--reverse .spiral__content {
        transform: rotate(calc(90deg * var(--i)));
    }
}

/* ============================================
   Modifier: portrait
   ============================================ */
.spiral--portrait {
    aspect-ratio: 1 / calc(1 + var(--spiral-phi));
}
.spiral--portrait .spiral__cell {
    width: 100%;
    transform-origin:
        calc(var(--spiral-shrinkage) * 100%)
        calc((1 - var(--spiral-shrinkage)) * (1 + var(--spiral-phi)) * 100%);
}

/* Auto-switch to portrait via container query */
@container (aspect-ratio < 1) {
    .spiral--auto {
        aspect-ratio: 1 / calc(1 + var(--spiral-phi));
    }
    .spiral--auto .spiral__cell {
        width: 100%;
        transform-origin:
            calc(var(--spiral-shrinkage) * 100%)
            calc((1 - var(--spiral-shrinkage)) * (1 + var(--spiral-phi)) * 100%);
    }
}

/* ============================================
   Accessibility: reduced motion fallback
   ============================================ */
@media (prefers-reduced-motion: reduce) {
    .spiral.spiral {
        display: grid;
        grid-template-columns: 1fr;
        gap: 0.5rem;
        aspect-ratio: auto;
        overflow: visible;
    }
    .spiral.spiral .spiral__cell {
        position: static;
        transform: none;
        width: 100%;
        aspect-ratio: auto;
        z-index: auto;
    }
    .spiral.spiral .spiral__content {
        transform: none;
        font-size: 1rem;
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

<div class="spiral">
    <div class="spiral__cell"><div class="spiral__content"><h1>Hello</h1></div></div>
    <div class="spiral__cell"><div class="spiral__content">World</div></div>
    <div class="spiral__cell"><div class="spiral__content">...</div></div>
</div>
```

### React

```jsx
import 'spiral-grid-css/dist/spiral-grid.css';

function Portfolio({ projects }) {
    return (
        <div className="spiral">
            {projects.map(p => (
                <div key={p.id} className="spiral__cell">
                    <div className="spiral__content">
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
    @extend .spiral;
    --spiral-width: 80vw;
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
- Customization basics

### `docs/math.md` — The Geometry

- Why phi
- Why 90° rotation
- Derivation of `shrinkage_point = phi² × (1 − phi)`
- Why the transform-origin is at that point
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

---

## What's Explicitly NOT in v1

- **Infinite zoom navigation** — belongs in a separate companion package (`spiral-grid-navigator`)
- **JavaScript framework bindings** — users can use the CSS directly; wrappers can come later if demand exists
- **Interactive demo playground** — add in v1.1 if there's interest
- **Theming presets** — ship utility-class variants for common color schemes after shipping the core

---

## Risks & Open Questions

1. **`pow()` browser support** — currently Chrome 111+, Safari 16.4+, Firefox 118+. Good enough for 2026, but need fallback. The precomputed nth-child version handles this.
2. **Counter-rotation and text wrapping** — text inside rotated cells wraps at the rotated width, which can surprise users. Need clear docs + maybe a `spiral__content--text` variant with controlled width.
3. **Container query support** — widely supported now (2023+), but if we want older browser support, we'd need viewport-based breakpoints as fallback.
4. **Naming collisions** — `.spiral` is common; consider `.sg-spiral` prefix if feedback suggests conflicts.
5. **Content overflow** — smaller cells can't fit much content. Need guidance on what kind of content works where.

---

## Launch Checklist

- [ ] Core CSS works in 3 browsers (Chrome, Safari, Firefox)
- [ ] `prefers-reduced-motion` fallback tested with screen reader
- [ ] README with GIF demo
- [ ] CodePen/StackBlitz demo link
- [ ] Documented math derivation
- [ ] Published to npm
- [ ] Example sites (portfolio, gallery, hero)
- [ ] Accessibility audit passed
- [ ] Blog post explaining the technique
