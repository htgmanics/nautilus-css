# Golden Ratio Spiral Grid

> **Historical (transform engine).** The derivation of the eye and the self-similarity argument are still correct and used by the zoom features; the transform-based construction and the React layer system have been replaced — see `doc/shared-lines.md` and `doc/tunnel.md`. Kept for the record.

A CSS-based layout system that constructs a Fibonacci spiral using CSS transforms, then creates an infinite zoom effect by layering and recycling duplicate grids with `react-spring`.

Reference implementation: [htgmanics/portfolio-2021](https://github.com/htgmanics/portfolio-2021)

---

## Table of Contents

1. [Foundation: The Two Magic Numbers](#foundation-the-two-magic-numbers)
2. [The Golden Rectangle Container](#the-golden-rectangle-container)
3. [The Core Trick: Scale + Rotate from the Spiral's Eye](#the-core-trick-scale--rotate-from-the-spirals-eye)
4. [Counter-Rotation and Font Compensation](#counter-rotation-and-font-compensation)
5. [Reverse Mode](#reverse-mode)
6. [The Infinite Zoom Effect](#the-infinite-zoom-effect)
7. [The Layer Recycling Trick](#the-layer-recycling-trick)
8. [Input Handling](#input-handling)
9. [Responsive Behavior](#responsive-behavior)

---

## Foundation: The Two Magic Numbers

```scss
$phi: 0.618033989;                    // 1/1.618 — the golden ratio conjugate
$shrinkage_point: 0.276393202250021;  // phi^2 * (1 - phi) — the spiral's convergence point
```

- **`$phi`** is the conjugate of the golden ratio. Multiplying any length by `$phi` gives the next smaller segment in the golden ratio sequence.
- **`$shrinkage_point`** is the mathematical point where the golden spiral converges — the "eye" of the spiral. All nested golden rectangles, when subdivided infinitely, spiral inward toward this exact ratio.

These values are also exposed as CSS custom properties for runtime access:

```scss
:root {
    --phi: 0.618033989;
    --shrinkage_point: 0.276393202250021;
}
```

---

## The Golden Rectangle Container

```scss
$width: 100vw;
$height: $width / (1 + $phi);   // width / 1.618 — a golden rectangle
$base: $width * $phi;           // side length of the largest square that fits inside
```

The container is a golden rectangle (aspect ratio 1:1.618). `$base` is the side of the largest square you can cut from it — exactly the first step when constructing a golden spiral by hand.

```
+-------------------+----------+
|                   |          |
|                   |          |
|    base square    |  remain  |
|    (width * phi)  |          |
|                   |          |
+-------------------+----------+
         ← width (golden rectangle) →
```

---

## The Core Trick: Scale + Rotate from the Spiral's Eye

Every grid item starts as the **same sized square**, positioned absolutely:

```scss
&__item {
    position: absolute;
    width: $base;
    height: $base;
}
```

The spiral is created entirely through transforms. Each item at index `$i` gets:

```scss
transform: scale(pow($phi, $i)) rotate(90deg * $i);
transform-origin: $x $y;
```

Where the transform-origin is the spiral's convergence point:

```scss
$x: (1 - $shrinkage_point) * $width;   // ~72.36% from left
$y: (1 - $shrinkage_point) * $height;  // ~72.36% from top
```

### What each item looks like

| Item | Index | `scale(pow(phi, i))` | `rotate(90deg * i)` | Visual size |
|------|-------|---------------------|---------------------|-------------|
| a    | 0     | `scale(1)`          | `rotate(0deg)`      | 100%        |
| b    | 1     | `scale(0.618)`      | `rotate(90deg)`     | 61.8%       |
| c    | 2     | `scale(0.382)`      | `rotate(180deg)`    | 38.2%       |
| d    | 3     | `scale(0.236)`      | `rotate(270deg)`    | 23.6%       |
| e    | 4     | `scale(0.146)`      | `rotate(360deg)`    | 14.6%       |
| f    | 5     | `scale(0.090)`      | `rotate(450deg)`    | 9.0%        |
| g    | 6     | `scale(0.056)`      | `rotate(540deg)`    | 5.6%        |

### Why this works

Because every item scales and rotates **from the same convergence point**, they naturally arrange into a Fibonacci spiral. CSS performs the geometric construction: each square nests into the remaining golden rectangle, rotated 90 degrees and scaled by phi.

```
+---------------------------+-----------------+
|                           |                 |
|                           |     b (0.618)   |
|         a (1.0)           |     rotated 90° |
|                           |------+----+     |
|                           |  d   | e  |     |
|                           |      +--+-+     |
|                           |  c   |f |.|     |
+---------------------------+------+--+-+-----+
                                    ↑
                            convergence point
                            (the spiral's eye)
```

---

## Counter-Rotation and Font Compensation

Since each cell is rotated, content inside would be rotated too. The inner `<div>` receives the opposite rotation:

```scss
> div {
    transform: rotate(-90deg * $i);
}
```

Font size is scaled inversely to remain readable:

```scss
font-size: 1rem / pow($phi, $i);
```

Without this, text in item `d` (23.6% scale) would be illegibly small.

---

## Reverse Mode

The `.reverse` modifier mirrors the spiral horizontally. Items are positioned from the right (`right: 0`) and rotated in the opposite direction:

```scss
&.reverse .g-grid__item.#{$classname} {
    transform: scale(pow($phi, $i)) rotate(-90deg * $i);
    transform-origin: $x_reverse $y_reverse;
}
```

The reverse transform-origin is calculated as:

```scss
$x_reverse: ($shrinkage_point) * $width * ($phi - 1);
$y_reverse: $y;  // vertical position stays the same
```

---

## The Infinite Zoom Effect

### The layer system

The spiral is not a single grid — it's **5 duplicate layers** stacked on top of each other, each at a different zoom level. All layers share the same `transform-origin` (the spiral's eye):

```scss
&__layer {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    transform-origin: $x $y;
}
```

### The scale formula

`react-spring` animates a scale value for each layer based on its position relative to the current step:

```js
const PHI = 0.618033989;
const LAYERS = 5;

const setProps = (y = 0) => (i) => {
    const currentPosition = orders.current.indexOf(i);
    const baseExponent = currentPosition - step.current;
    const dragExponent = Math.round((y / 180 + Number.EPSILON) * 100) / 100;
    const exponent = baseExponent + dragExponent;

    const scale = Math.pow(PHI, exponent * 4);
    const zIndex = currentPosition * 10;
    return { scale, zIndex };
};
```

The `* 4` multiplier creates a dramatic zoom range:

| Layer position | Exponent | `phi^(exp*4)` | Meaning |
|---------------|----------|---------------|---------|
| -1 (prev)     | -1       | ~6.85         | Zoomed way out (huge) |
| 0 (current)   | 0        | 1.0           | Normal size |
| +1 (next)     | +1       | ~0.146        | Zoomed way in (tiny) |
| +2            | +2       | ~0.021        | Nearly invisible |

The scale is applied via a `matrix3d` transform (equivalent to `scale()` but more explicit):

```jsx
transform: s.interpolate(s =>
    `matrix3d(${s},0,0,0, 0,${s},0,0, 0,0,1,0, 0,0,0,1)`
)
```

---

## The Layer Recycling Trick

After 5 clicks you'd run out of layers. The infinite loop works by silently recycling layers when the user isn't looking:

```js
const resetOrder = () => {
    setTimeout(() => {
        if (loop && (step.current === 0 || step.current === 2)) {
            // Move the outermost layer to the innermost position (or vice versa)
            const newOrder = step.current === 2
                ? swap(orders.current, 0, orders.current.length - 1)
                : swap(orders.current, orders.current.length - 1, 0);
            orders.current = newOrder;

            // Snap step back to middle
            step.current = step.current === 2 ? step.current - 1 : step.current + 1;

            // Apply immediately with no animation
            setSpring(setProps(0, true));  // immediate: true
        }
        inTransition.current = false;
    }, 1200);  // wait for animation to finish
};
```

### The cycle

1. User clicks "next" — `step` goes from 1 to 2, all layers animate zooming in
2. After 1200ms (animation complete), the **outermost layer** (now zoomed way out, off-screen) is moved to the innermost position in the `orders` array
3. `step` snaps back to 1 **immediately** (`immediate: true` — no animation)
4. The user perceives continuous zooming, but layers are silently recycled

This is the same technique as an infinite carousel: move the element that scrolled off-screen to the other end when nobody's looking.

### Project content stays in sync

`rearrangeProjects()` rotates which projects map to which layers, keeping content synchronized with the layer recycling:

```js
const arrangedProjects = rearrangeProjects(
    projects, projectIndex.current, status.step.current,
    status.inTransition.current, status.loop
);
```

It also updates the browser URL via `pushState` so each project gets a unique URL without triggering a page reload.

---

## Input Handling

Three input methods are implemented, all feeding into the same `setProps` / `resetOrder` pipeline:

### Click

```js
const onClickHandler = (direction) => (e) => {
    step.current = direction === 'next' ? step.current + 1 : step.current - 1;
    projectIndex.current += direction === 'next' ? 1 : -1;
    inTransition.current = true;
    resetOrder();
    setSpring(setProps(0, false));
};
```

### Drag (mobile)

Uses `react-use-gesture`'s `useDrag`. Tracks vertical movement, triggers transition when drag distance exceeds 150px:

```js
if (!inTransition.current && down && Math.abs(y) > 150) {
    cancel();
    step.current = step.current - Math.sign(my);
    inTransition.current = true;
    resetOrder();
}
```

### Mouse wheel (desktop)

Uses `useWheel` with deceleration detection. Accumulates scroll delta and triggers at the 180px threshold. A "truly decelerating" check (20+ decelerating frames or small delta with any deceleration) prevents momentum scrolling from triggering multiple transitions:

```js
const trulyDecelerating = deceleratingFrames > 20
    || (deceleratingFrames > 0 && Math.abs(dy) < 2);
```

---

## Responsive Behavior

On mobile (max-width: 767px), the container flips to portrait orientation:

```scss
// Desktop: landscape golden rectangle
$width: 100vw;
$height: $width / (1 + $phi);

// Mobile: portrait golden rectangle
$width_m: 100vw;
$height_m: $width_m * (1 + $phi);
$base_m: $width_m;  // square fills full width
```

The convergence point shifts accordingly:

```scss
// Desktop: eye is at ~72% from top-left
$x: (1 - $shrinkage_point) * $width;
$y: (1 - $shrinkage_point) * $height;

// Mobile: eye is at ~28% from left, ~72% from top
$x_m: $shrinkage_point * $width_m;
$y_m: (1 - $shrinkage_point) * $height_m;
```

---

## Summary

The entire system rests on one insight: **if you scale and rotate identical squares from the golden spiral's mathematical convergence point, CSS performs the Fibonacci spiral construction for you**. Stack 5 copies at different zoom levels, animate between them with `react-spring`, and silently recycle layers to create an infinite zoom into the spiral's eye.
