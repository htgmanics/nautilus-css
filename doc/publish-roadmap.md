# Publish Roadmap

Checklist for turning the prototype into a publishable CSS library.
This doc is the **single source of truth** for publish readiness — the Launch
Checklist in `doc/spiral-grid-library-sketch.md` defers to this list.

Restructured 2026-09-24 around a **minimal v0.1 milestone**: publish early at
`0.1.0` (0.x semver already says "early"), everything non-blocking moves to
post-0.1. Rationale: the project stalled for a year once; a scope wall is how
it stalls again. A live package motivates the rest.

---

## 0. Polish CSS & Finalize API — DONE

- [x] Finalize class names, modifiers, and custom properties (no renames after §1).
      API-freeze sweep done: rebranded `.fib-spiral` → `.spiral-grid`; renamed
      `--content-padding` → `--safe-zone`; namespaced `--i` →
      `--spiral-grid-index`; removed redundant `--width`/`--overflow`
      passthroughs; flipped `--transition` default to `none`; killed
      `--cell-bg`; moved phi/shrinkage to "internal, do not override."
- [x] Verify precomputed `pow()` fallback rules for cells 1–10 match the
      modern-browser `pow()` output. Script: `test/verify-fallback.mjs` —
      zero-dep. All 10 indices pass for both forward and reverse variants.
- [x] Cell scrolling — shipped as cell-level modifiers
      (`spiral-grid__content--scroll`, `--scroll-x`, `--scroll-y`).
      Stress-test at `prototype/scroll.html`; design notes in
      `doc/cell-scrolling.md`. Spiral-level `--scrollable` with a depth cap
      was rejected.
- [x] Gap (`--spiral-grid-gap`) — resolved via `clip-path: inset()`; see
      `doc/gap-postmortem.md` "Resolved" section.

---

## Milestone v0.1 — first npm publish

Everything required to run `npm publish` at `0.1.0`. Nothing else blocks.

### 1. Package Structure

- [x] Decide package name — **`golden-spiral-grid`** (npm 404-free as of
      2026-09-24; `golden-ratio-grid` was taken). Contains the frozen CSS
      prefix `spiral-grid` verbatim, and carries three search keywords
      (golden, spiral, grid) in the name itself. "Fibonacci" and "pure CSS"
      live in the tagline/keywords, not the name. Mathematically honest:
      cells scale by exact powers of φ (golden spiral), not integer
      Fibonacci ratios.
- [x] Decide source language — **plain CSS, no SCSS ever.** The only meaningful
      SCSS variable (`$phi`) is explicitly frozen, so SCSS customization is a
      feature already rejected; the prototype is shipped-quality plain CSS; the
      build shrinks to minify + `size-limit`. If the fallback tables ever need
      regenerating, a tiny Node script (extending `test/verify-fallback.mjs`)
      does it without a sass dependency.
- [ ] Rename GitHub repo `fibonacci-grid` → `golden-spiral-grid` (before any
      GitHub Pages URLs are set; GitHub auto-redirects old URLs)
- [x] Decide shipped filename — **keep `dist/spiral-grid.css`** (matches the
      frozen `.spiral-grid` class prefix, which users read daily; the package
      name is only for finding the library. Package/file name mismatch in CDN
      URLs is normal npm practice.)
- [ ] Create `package.json` (name, version, license, exports, keywords, `files`)
- [ ] Organise source into `src/` and build output into `dist/`
- [ ] Rename `prototype/` → `examples/` (freeze before GitHub Pages URLs are set)
- [ ] Confirm `LICENSE` is referenced from `package.json` and README
- [ ] Add `.gitignore` entries for `node_modules`, `dist`, `.vscode`, etc.
- [ ] Rely on the `files` field to control what ships

### 2. Build & Size

- [ ] Set up build script (copy `src/spiral-grid.css` to `dist/` + cssnano minify)
- [ ] Produce `spiral-grid.css` and `spiral-grid.min.css` in `dist/`
- [ ] Enforce < 2 KB gzipped target via `size-limit` (not eyeballed).
      Decision (2026-09-24): the pow() fallback tables stay in the main file —
      already written, verified by `test/verify-fallback.mjs`, and gzip
      compresses the repetitive rules well. Only if `size-limit` fails do we
      split out a `spiral-grid.modern.css` (no fallback) — measure first,
      never delete working code for an unconfirmed size problem.
- [ ] CDN-friendly: works via unpkg / jsdelivr out of the box

### 3. Minimum docs & demo

- [ ] Rewrite README as a user-facing guide (install, usage, API table,
      browser compat note, reduced-motion behavior note). The sketch's API
      section is ~80% of this already.
- [ ] Deploy `examples/` (the current prototype gallery) to GitHub Pages
- [ ] Semver policy noted in README: `0.x` = API may shift, `1.0.0` = freeze

### 4. Publish

- [ ] First npm publish at `0.1.0`

---

## Post-0.1 (0.2+, in rough priority order)

Deliberately NOT blocking the first publish.

### Documentation

- [ ] Browser compatibility table for CSS `pow()` — re-verify current Firefox
      behavior with `clip-path` before baking versions into docs
- [ ] Promote `doc/golden-ratio-spiral-grid.md` into `docs/math.md` (source
      already written — reframe for end-users, don't rewrite)
- [ ] `docs/accessibility.md` covering reduced-motion, focus, rotated-content
      caveats (the *behavior* already ships in 0.1; this is the write-up)
- [ ] `docs/recipes.md` (portfolio, hero, gallery, etc.)
- [ ] Framework snippets (React, Vue, Svelte)
- [ ] Add `CHANGELOG.md`

### Examples & Demos

- [ ] Photo gallery — images filling cells, spiral as natural focal hierarchy
- [ ] Portfolio / landing hero — featured project in cell 1
- [ ] Seamless multi-spiral — two spirals flowing together with images
- [ ] Dashboard cards — stats, charts, info panels at different scales
- [ ] Team / about page — hero photo in cell 1, headshots spiraling in
- [ ] CodePen or StackBlitz link for the minimal "hello spiral" example

### Quality & Testing

- [ ] Add stylelint config
- [ ] Geometry unit tests — extend `test/verify-fallback.mjs` into a suite
      asserting each cell's transform, scale, clip-path, padding
- [ ] Visual regression tests (e.g. Playwright screenshot comparisons)
- [ ] Cross-browser smoke test (Chrome, Safari, Firefox)
- [ ] Accessibility audit against the reduced-motion fallback

### CI/CD

- [ ] GitHub Actions: lint + build + `size-limit` check on every PR
- [ ] GitHub Actions: publish to npm on version tag
- [ ] GitHub Pages deployment automation

### Community

- [ ] `CONTRIBUTING.md`
- [ ] `CODE_OF_CONDUCT.md`
- [ ] Release workflow — tagging policy (e.g. `changesets`) + CHANGELOG process

---

## Post-1.0 / v2

Out of scope until well after release; tracked so they don't sneak into v1.

- [ ] Scroll-driven spiral zoom — `.spiral-grid--scroll-zoom` modifier using
      CSS Scroll-Driven Animations. Design notes in `doc/scroll-zoom.md`;
      working prototype in `prototype/scroll-zoom.html`.
- [ ] Infinite zoom (v2) — zoom into the convergence point to reveal nested
      spirals; companion package. Same self-similarity math as scroll-driven
      zoom, different input.
- [ ] Theming presets (utility-class color schemes)
- [ ] Interactive demo playground
