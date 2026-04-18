# Gap Feature — Post-Mortem

Research notes from the first attempt at implementing `--fib-spiral-gap`.

## Goal

A CSS custom property (`--fib-spiral-gap`) that adds consistent visual spacing between cells, similar to CSS `gap` in grid/flex layouts.

## Why It's Hard

The spiral grid is fundamentally different from CSS Grid/Flexbox. Cells are absolutely positioned and scaled via `transform: scale(pow(phi, i))`. This creates three interconnected problems:

### 1. Scale compensation

A naive gap (e.g. `padding: 4px` on cells) gets scaled down with the cell. Cell 1 shows 4px, cell 5 shows ~0.6px (sub-pixel), cell 8 shows ~0.14px (invisible). The gap must be divided by `pow(phi, i)` to stay visually constant after scaling.

**Formula:** `gap / pow(phi, i)` per cell.

This works mathematically but produces very large pre-scale values for deep cells (cell 8: `gap * 29`, cell 10: `gap * 76`).

### 2. Fill cell distortion

The last cell (fill) is reshaped from a square to a golden rectangle (`width: 100%; aspect-ratio: 1.618`). Applying equal padding on all sides with `box-sizing: border-box` distorts the content's aspect ratio — padding consumes different proportions of width vs height.

### 3. Background-clip conflict

Moving the gap to `border: Npx solid transparent` on `.fib-spiral__content` avoids cell-level layout issues. But CSS `background` shorthand resets `background-clip` to `border-box`, making the transparent border invisible (background bleeds through). Fixing this requires `background-clip: padding-box !important`, which is heavy-handed for a library and fragile when users apply backgrounds.

## Approaches Tried

| Approach | Result |
|----------|--------|
| `padding` on `.fib-spiral__cell` | Sub-pixel rendering on small cells; fill cell aspect-ratio distortion |
| Scale-compensated `padding` on cell | Fill cell breaks (large padding + border-box + non-square = distorted content) |
| `border: transparent` on `.fib-spiral__content` | Works visually, but `background` shorthand resets `background-clip`, hiding the gap |
| `background-clip: padding-box !important` | Works but requires `!important` — not acceptable for a library |

## Possible Future Approaches

1. **CSS `@property` for background-clip** — register `--fib-spiral-gap` with `@property` and use it to conditionally apply `background-clip`. Doesn't solve the core issue but might enable cleaner APIs.

2. **Wrapper element** — add a third wrapper (`__cell` > `__gap` > `__content`) where `__gap` handles the spacing. Adds markup complexity but isolates the gap from content styling. The gap element would have a fixed background matching the container.

3. **CSS `outline-offset`** — use a negative outline-offset with a solid outline matching the container background. Avoids layout impact but requires knowing the container color.

4. **`mask` / `clip-path`** — clip the content inward by the gap amount. Resolution-independent and doesn't interact with backgrounds. But `clip-path: inset()` would need scale compensation, and browser support for `clip-path` on non-SVG is recent.

5. **JavaScript helper** — a tiny JS function that reads the container size and sets per-cell CSS variables for the gap. Breaks the pure-CSS philosophy but would handle all edge cases.

6. **Rethink the architecture** — instead of absolute positioning + scale transforms, use CSS Grid with `subgrid` or a different layout strategy that supports native `gap`. Would be a v2 rewrite.

## Recommendation

Defer to a dedicated feature branch. The gap needs a fundamentally different approach than what was attempted. A wrapper element (option 2) or clip-path (option 4) are the most promising paths. Both need prototyping and cross-browser testing before committing to an API.
