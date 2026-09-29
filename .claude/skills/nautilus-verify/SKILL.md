---
name: nautilus-verify
description: Run the measured checks for the Nautilus CSS engine and example pages — geometry invariants, React wrapper markup, every example headless (cells square, console clean), tunnel reset pixel diff. Use after any change to src/, react/, or examples/, before committing, and when asked "is the layout still right".
---

# nautilus-verify

Layout bugs in this project have never been visible by eye first. Every real
one (fr-sum clamp, margin gap at 215px, the 1/64px zoom seam, mid-lap blur,
photo pop-in) was found by a number. So: **no visual claim without a
measurement.**

## Run

```sh
npm test                 # geometry.mjs + react.mjs — pure node, seconds
npm run check:examples   # every examples/*.html headless + tunnel reset diff
```

Both must pass before a commit that touches `src/`, `react/` or `examples/`.
`check:examples` needs `agent-browser` and ImageMagick `compare` on PATH.

## What each check proves

| Check | Invariant | Where it came from |
|---|---|---|
| tracks are φ, φ⁵, φ⁹, φ¹⁰, φ⁷, φ³, sum 1 | the six numbers that *are* the engine | `doc/shared-lines.md` §9 |
| 10 cells square, side φⁱ | placements match the tracks | same |
| 10 fill cells golden, long side φ^(N−1), right orientation | fill covers the remainder | same |
| eye = φ/(1−φ⁴) | zoom origin | `doc/tunnel.md` §2 |
| wrapper markup exact | props → classes contract | `react/index.d.ts` |
| every non-fill cell square, all example pages | catches track-sizing regressions at *every* container size (the margin-gap bug only showed at 215px) | `doc/grid-engine.md` |
| console clean | broken links, JS errors in examples | |
| tunnel reset ≤ 10 px diff | the infinite-zoom hand-off is invisible | `doc/infinite-zoom.md` |

## When a check fails

- Squares off by ≈ the gap width → something is feeding track-sizing
  minimums (margin/padding/border on `.nautilus__cell`). The gap must stay
  `clip-path` + content padding.
- Squares off by a constant ratio (e.g. 0.618) → `fr` factors sum < 1;
  Grid clamps the sum to 1.
- Reset diff in the hundreds, localised → content changed at the reset
  (lazy media, placeholder swap). Load one level deeper.
- Reset diff in the thousands, along all edges → sub-pixel seam; layers are
  no longer laid out at the same size / scaled about the same eye.

## Ad-hoc measurements

For anything not covered, measure with `agent-browser eval` +
`getBoundingClientRect`, and screenshots + `compare -metric AE -fuzz 8%`
(pixel diff) or a Laplacian σ for sharpness:

```sh
magick shot.png -colorspace gray -define convolve:scale='!' \
  -morphology Convolve Laplacian:0 -format '%[fx:standard_deviation*1000]' info:
```

CLI latency is ~0.5s per call: to capture *mid-animation*, run the animation
with a 20s duration and screenshot at ~10s. Chrome caches `file://`
stylesheets across `reload` — `agent-browser close` then `open` to pick up
CSS edits.

Record any new number worth remembering in `doc/review-*.md` §5.
