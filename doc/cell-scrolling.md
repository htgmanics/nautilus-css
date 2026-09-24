# Per-Cell Scrolling — Design Notes

Design notes for the `spiral-grid__content--scroll` modifier family,
which allows long content inside a cell to scroll independently without
breaking the spiral's visual integrity.

## Status

**Shipped in v1** as cell-level modifiers — `spiral-grid__content--scroll`
(y-axis, default), `--scroll-x`, `--scroll-y`. Implementation lives in the
"Feature: per-cell scrolling" block of `src/spiral-grid.css`;
working demo in `examples/scroll.html`.

Resolved against the original open questions:

- **API shape (Q1):** cell-level only. A spiral-level `--scrollable`
  wrapper was considered but rejected — no runtime depth knob is cleanly
  possible (CSS `:nth-child()` can't accept custom properties), and
  hardcoding a depth would be a lie about what's actually usable.
- **Custom scrollbar (Q2):** deferred. v1 ships `scrollbar-width: thin`
  with native defaults; custom `::-webkit-scrollbar` is a follow-up if
  cross-OS consistency becomes a priority.
- **Focus (Q3):** left to users. The library doesn't add `tabindex`
  automatically — docs recommend `tabindex="0"` on outer cells where
  scroll is useful and skipping it on decorative deep cells.
- **Zoom interaction (Q4):** noted as an incompatibility. Spirals using
  the (post-v1) scroll-driven zoom should not also enable cell scroll
  on the same cells.

## Goal

Let each cell behave as its own independent scroll container when its
content overflows, so card-style content (text, lists, tables, image
strips) remains fully readable without pushing the spiral's layout
around or bleeding past the gap's clip-path.

## Why It's Tractable Now

The gap feature's auto safe-zone
(`--spiral-grid-safe-zone`, defaulting to `gap / 2` and
scale-compensated by `/ pow(phi, i)`) already solves the hardest part
of per-cell scroll: **keeping scrollbars, scroll edges, and content
boundaries clear of the cell's `clip-path`**.

- The scroll container is `.spiral-grid__content`, which already has
  `box-sizing: border-box` and a scale-compensated inner padding.
- The cell's `clip-path: inset()` trims the outer `gap / 2` of every
  cell at paint time. The safe zone makes the scroll viewport sit
  entirely inside the visible region.
- A native scrollbar rendered at the right edge of
  `.spiral-grid__content` lives one safe-zone width in from the clip,
  so it is never itself clipped and never overlaps the gap gutter.

## Proposed API

Opt-in via a modifier at the spiral or cell level. Keeping it opt-in
preserves the current "static card" behavior as the default.

```css
/* spiral-level: every cell scrolls */
.spiral-grid--scrollable .spiral-grid__content {
    overflow-y: auto;
    overflow-x: hidden;
    overscroll-behavior: contain;
    scrollbar-width: thin;
    scrollbar-gutter: stable;
}

/* cell-level: individual cell scrolls */
.spiral-grid__content--scroll {
    overflow-y: auto;
    overflow-x: hidden;
    overscroll-behavior: contain;
    scrollbar-width: thin;
    scrollbar-gutter: stable;
}

/* axis variants */
.spiral-grid__content--scroll-x {
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
scroll container (`.spiral-grid__content`) is itself inside that
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
takes up meaningful width. At a container width of 800px:

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
`.spiral-grid__content--scroll`. Default N could be 4 or 5.

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
    .spiral-grid.spiral-grid .spiral-grid__content {
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
.spiral-grid--scrollable .spiral-grid__cell:nth-child(-n+5)
  .spiral-grid__content {
    /* scroll rules */
}
```

Users can override:

```css
/* expand to all cells */
.my-spiral.spiral-grid--scrollable .spiral-grid__cell
  .spiral-grid__content {
    overflow: auto;
}
```

Alternative: expose `--spiral-grid-scroll-max-depth: 5` as a tunable
custom property.

## Open Questions

1. Should the feature be a spiral-level modifier
   (`spiral-grid--scrollable`), a cell-level modifier
   (`spiral-grid__content--scroll`), or both?
2. Do we ship a custom scrollbar style, or rely on `scrollbar-width:
   thin` + browser defaults? Custom adds ~0.3 KB but looks
   consistent across OSes.
3. Should focus visibility be handled by the library (via a
   `:focus-visible` ring on `.spiral-grid__content`), or left to users?
4. How does scroll interact with a future hover-to-expand or
   click-to-zoom feature? Likely conflicts — scrolling inside a cell
   while also "zooming" the spiral on hover would be confusing. Pick
   one interaction model per spiral.

## Recommendation

Prototype in `examples/scroll.html` first, mirroring
`examples/gap.html`'s approach:

- Side-by-side: non-scrollable (default) vs scrollable
- Rotation stress test: does cell 2 (90°) scroll naturally with
  vertical wheel?
- Touch test on mobile Safari and Chrome Android
- Depth sweep: which cell index becomes the practical floor for
  scroll usefulness?

Once the prototype confirms the rotation/touch behavior is solid,
formalize into the library as `.spiral-grid--scrollable` (+ per-cell
`--scroll` modifier for granular control) with a documented
`--spiral-grid-scroll-max-depth` for the depth cap.
