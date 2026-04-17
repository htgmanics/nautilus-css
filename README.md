# fibonacci-grid

A pure-CSS Fibonacci / golden-ratio spiral grid layout.

Cells are squares sized by powers of φ (≈ 0.618), rotated and shrunk around the
spiral's convergence point to produce a classic Fibonacci tiling with zero
JavaScript. The last cell fills the remaining golden rectangle by default — opt
out with `spiral--no-fill` to leave the wedge visible.

## Prototype

Open `prototype/index.html` in a browser to see the demos.

## Docs

- `doc/golden-ratio-spiral-grid.md` — math and convergence-point derivations.
- `doc/spiral-grid-library-sketch.md` — library API sketch.
