---
name: nautilus-example
description: Conventions for building a new Nautilus example, demo or showcase page in examples/ so it loads the engine correctly and is measurable by nautilus-verify. Use when creating or restructuring any page under examples/ (portfolio, product listing, test rigs, zoom demos).
---

# nautilus-example

Every page under `examples/` must be **measurable**: `npm run check:examples`
opens each one headless and asserts cells are square and the console is
clean. New pages inherit that for free if they follow this.

Design is the owner's — this skill has no opinions on look, type, colour or
layout beyond what the engine requires.

## Skeleton

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>Nautilus — <what this page shows></title>
    <link rel="stylesheet" href="../src/nautilus.css" />   <!-- source, not dist: no build step to forget -->
    <style>/* page styles; never restyle .nautilus internals here */</style>
  </head>
  <body>
    <div class="nautilus" style="--nautilus-gap: 8px">
      <div class="nautilus__cell"><div class="nautilus__content">…</div></div>
      <!-- 2–10 cells; last one fills the eye unless nautilus--no-fill -->
    </div>
  </body>
</html>
```

Nested one level deeper (`examples/portfolio/index.html`)? Link
`../../src/nautilus.css` and add the folder to `test/examples.mjs`'s scan.

## Rules the engine imposes

- **Cell = two divs.** `.nautilus__cell > .nautilus__content`. Content goes in
  `__content`. Style backgrounds on `__cell`, everything else on `__content`.
- **Only cells as grid children.** Anything else inside `.nautilus` becomes
  `position: absolute` automatically — fine for markers, badges, captions;
  give it `top/left`.
- **Don't put margin, padding or border on `.nautilus__cell`.** They feed
  track sizing and break the eye tracks (measured). Put them on `__content`.
- **Size per cell with `cqi`.** Each cell is a container: `font-size: 10cqi`
  in `__content` scales with that cell.
- **Up to 10 cells.** Usable content fits cells 1–4; 5+ are decorative.
- **Gap:** `--nautilus-gap` on the container; small relative to the container
  (deep cells vanish otherwise), or `0.5cqi`.
- **Zoom scenes:** transform the *container* (or a wrapper) about the eye;
  never the cells. `--nautilus-eye` is set on the container. For the tunnel
  pattern, follow `examples/infinite-zoom.html` and `doc/tunnel.md`.

## Test hooks

Pages with motion expose `window.__test` so `check:examples` can drive them
without timing games. The tunnel exposes `freezeAtLapEnd()`, `commit()`,
`step()`, `offset`, `rootRects()`, `nestedRects()`. A new interactive page
should expose the equivalent "freeze at the interesting state" hook and get a
dedicated block in `test/examples.mjs`.

## Placement

- Showcases (portfolio, product listing): `examples/<name>/`
- Engineering test rigs (`index`, `gap`, `scroll`): planned move to
  `examples/tests/` — keep them, they are the regression suite's inputs.
- Screenshots for README: `examples/screenshot-*.png`, cropped, no debug
  markers visible.

After building: run `nautilus-verify`, then add the page to the README
"Examples" list and the Pages demo index.
