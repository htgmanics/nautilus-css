# Per-Cell Scrolling — Design Notes

Forward-looking research for a `--fib-spiral-content-scroll` (or
`fib-spiral__content--scroll`) feature that allows long content inside
a cell to scroll independently, without breaking the spiral's visual
integrity.

## Goal

Let each cell behave as its own independent scroll container when its
content overflows, so card-style content (text, lists, tables, image
strips) remains fully readable without pushing the spiral's layout
around or bleeding past the gap's clip-path.

## Why It's Tractable Now

The gap feature's auto safe-zone
(`--fib-spiral-content-padding`, defaulting to `gap / 2` and
scale-compensated by `/ pow(phi, i)`) already solves the hardest part
of per-cell scroll: **keeping scrollbars, scroll edges, and content
boundaries clear of the cell's `clip-path`**.

- The scroll container is `.fib-spiral__content`, which already has
  `box-sizing: border-box` and a scale-compensated inner padding.
- The cell's `clip-path: inset()` trims the outer `gap / 2` of every
  cell at paint time. The safe zone makes the scroll viewport sit
  entirely inside the visible region.
- A native scrollbar rendered at the right edge of
  `.fib-spiral__content` lives one safe-zone width in from the clip,
  so it is never itself clipped and never overlaps the gap gutter.

## Proposed API

Opt-in via a modifier at the spiral or cell level. Keeping it opt-in
preserves the current "static card" behavior as the default.

```css
/* spiral-level: every cell scrolls */
.fib-spiral--scrollable .fib-spiral__content {
    overflow-y: auto;
    overflow-x: hidden;
    overscroll-behavior: contain;
    scrollbar-width: thin;
    scrollbar-gutter: stable;
}

/* cell-level: individual cell scrolls */
.fib-spiral__content--scroll {
    overflow-y: auto;
    overflow-x: hidden;
    overscroll-behavior: contain;
    scrollbar-width: thin;
    scrollbar-gutter: stable;
}

/* axis variants */
.fib-spiral__content--scroll-x {
    overflow-x: auto;
    overflow-y: hidden;
}
```

Rationale for the individual properties:

- **`overscroll-behavior: contain`** — stops the scroll from chaining
  to the page when the user hits the top/bottom of a cell. Without it,
  scrolling inside a small cell feels "sticky" because the page
  takes over immediately.
- **`scrollbar-width: thin`** — native scrollbars are visually
  oversized in cells beyond index 4 or 5. Thin keeps them
  proportionate. A fully custom scrollbar (`::-webkit-scrollbar`,
  `::-webkit-scrollbar-thumb`) is reasonable as a follow-up.
- **`scrollbar-gutter: stable`** — reserves scrollbar space even when
  content doesn't overflow, so enabling/disabling scroll doesn't
  nudge text layout.

## Gotchas

These are the parts that need real cross-browser testing before the
feature ships.

### 1. Rotated cells (90° and 270°)

Cells at odd indices (`--i: 1, 3, 5, 7…`) have their parent rotated
by 90° or 270°. The content counter-rotates back to upright, but the
scroll container (`.fib-spiral__content`) is itself inside that
rotation chain. Two questions:

- **Hit-testing** — when the user positions their pointer over the
  visually-upright content and spins the wheel, does the browser
  deliver the event to the correct scrollable element?
- **Wheel direction** — does a wheel-up gesture scroll content up
  visually, or does the rotated coordinate system invert it?

Modern browsers (Chrome, Firefox, Safari) do hit-test in screen
space and apply wheel deltas to the scrollable ancestor, and the
content's own counter-rotation brings its local-Y back into
alignment with screen-Y. Empirically this works, but it needs a
prototype test on cell 2 (90°), cell 4 (180°), cell 6 (270°) before
we can commit.

Potential escape hatch: disable scrolling on rotated cells (even
nth-children only, or only unrotated cells via
`:nth-child(4n+1)`).

### 2. Scaled cells and scrollbar usefulness

Cells 6+ are visually small enough that even a `thin` scrollbar
takes up meaningful width. At `--fib-spiral-width: 800px`:

| Cell | Visual width | Scrollbar footprint |
|------|--------------|----------------------|
| 1    | 494px        | negligible           |
| 2    | 306px        | negligible           |
| 3    | 189px        | small                |
| 4    | 117px        | noticeable           |
| 5    | 72px         | dominates            |
| 6    | 45px         | unusable             |
| 7+   | <28px        | unusable             |

Recommendation: only apply scroll to the first N cells via
`:nth-child(-n+N)` or require users to opt in per-cell via
`.fib-spiral__content--scroll`. Default N could be 4 or 5.

### 3. Keyboard focus and Tab order

Scroll containers are keyboard-focusable by default in most
browsers (either implicitly or via `tabindex="0"` for accessibility).
Putting focus into a 22×22px cell via Tab is a bewildering UX.

Recommendation:

- For the library, do **not** add `tabindex` automatically. Let
  users opt in per cell.
- For the docs, recommend:
  - `tabindex="0"` on the outer cells where scroll is useful
  - `tabindex="-1"` or no tabindex on decorative deep cells
  - Using a visual focus ring that respects the safe zone

### 4. Fill cell

The last cell in fill mode is a golden rectangle, not a square, and
for even-index fill cells the content is re-sized and rotated via
the `:last-of-type:nth-child(even)` rules. Scrolling inside that
rotated content works the same way rotated cells do (the content's
local coordinate system is screen-aligned after counter-rotation),
but it's worth an explicit test case because the content's
`width`/`height` are explicitly percentage-sized rather than
`100%`/`100%`.

### 5. Reduced-motion fallback

In `@media (prefers-reduced-motion: reduce)`, cells become a
vertical stack. Each cell is then full-width and should scroll
naturally with the page, not as an independent container. The
reduced-motion block already resets `padding: 0` on the content;
it should also reset `overflow: visible` when the scroll modifier
is active.

```css
@media (prefers-reduced-motion: reduce) {
    .fib-spiral.fib-spiral .fib-spiral__content {
        overflow: visible;
        max-height: none;
    }
}
```

### 6. Momentum scrolling on touch

iOS and Android render momentum scroll inside transformed elements
correctly on current OS versions, but older iOS (pre-13) had known
bugs with `-webkit-overflow-scrolling: touch` inside `transform:
scale()`. Given the library's "evergreen" support policy, this is
acceptable — worth a note in the docs.

## Depth Policy

Proposed default: scroll applies only to cells where it is likely to
be useful.

```css
.fib-spiral--scrollable .fib-spiral__cell:nth-child(-n+5)
  .fib-spiral__content {
    /* scroll rules */
}
```

Users can override:

```css
/* expand to all cells */
.my-spiral.fib-spiral--scrollable .fib-spiral__cell
  .fib-spiral__content {
    overflow: auto;
}
```

Alternative: expose `--fib-spiral-scroll-max-depth: 5` as a tunable
custom property.

## Open Questions

1. Should the feature be a spiral-level modifier
   (`fib-spiral--scrollable`), a cell-level modifier
   (`fib-spiral__content--scroll`), or both?
2. Do we ship a custom scrollbar style, or rely on `scrollbar-width:
   thin` + browser defaults? Custom adds ~0.3 KB but looks
   consistent across OSes.
3. Should focus visibility be handled by the library (via a
   `:focus-visible` ring on `.fib-spiral__content`), or left to users?
4. How does scroll interact with a future hover-to-expand or
   click-to-zoom feature? Likely conflicts — scrolling inside a cell
   while also "zooming" the spiral on hover would be confusing. Pick
   one interaction model per spiral.

## Recommendation

Prototype in `prototype/scroll.html` first, mirroring
`prototype/gap.html`'s approach:

- Side-by-side: non-scrollable (default) vs scrollable
- Rotation stress test: does cell 2 (90°) scroll naturally with
  vertical wheel?
- Touch test on mobile Safari and Chrome Android
- Depth sweep: which cell index becomes the practical floor for
  scroll usefulness?

Once the prototype confirms the rotation/touch behavior is solid,
formalize into the library as `.fib-spiral--scrollable` (+ per-cell
`--scroll` modifier for granular control) with a documented
`--fib-spiral-scroll-max-depth` for the depth cap.
