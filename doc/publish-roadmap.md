# Publish Roadmap

Checklist for turning the prototype into a publishable CSS library.
This doc is the **single source of truth** for publish readiness — the Launch
Checklist in `doc/spiral-grid-library-sketch.md` defers to this list.

---

## 0. Polish CSS & Finalize API

Before anything packaging-related, the core CSS and API must be stable.

- [x] Finalize class names, modifiers, and custom properties (no renames after §1).
      API-freeze sweep done: rebranded `.fib-spiral` → `.spiral-grid` (matches
      package name `spiral-grid-css`); renamed `--content-padding` →
      `--safe-zone`; namespaced `--i` → `--spiral-grid-index`; removed
      redundant `--width`/`--overflow` passthroughs; flipped `--transition`
      default to `none`; killed `--cell-bg` (users set `background` on
      `.spiral-grid__cell` directly); moved phi/shrinkage to "internal, do
      not override."
- [x] Verify precomputed `pow()` fallback rules for cells 1–10 match the
      modern-browser `pow()` output (per-index scale, rotate, clip-path, padding).
      Script: `test/verify-fallback.mjs` — zero-dep, runnable now, will move
      into the §5 test suite verbatim. All 10 indices pass for both forward
      and reverse variants.
- [ ] Cell scrolling — `spiral-grid__content--scroll`, `--scroll-x`, `--scroll-y`
      modifiers. Design notes in `doc/cell-scrolling.md` (builds on the auto
      safe-zone from `--spiral-grid-gap`). Decide in or out for v1.
- [x] Gap (`--spiral-grid-gap`) — resolved via `clip-path: inset()`; see
      `doc/gap-postmortem.md` "Resolved" section.

## 1. Package Structure

- [ ] Decide package name (`spiral-grid-css` vs `fibonacci-grid-css`) — check
      npm availability before committing to README/docs URLs
- [ ] Decide source language (SCSS partials per sketch, or plain CSS + PostCSS).
      Drives everything in §2 and the `src/` layout.
- [ ] Create `package.json` (name, version, license, exports, keywords, `files`)
- [ ] Organise source into `src/` and build output into `dist/`
- [ ] Rename `prototype/` → `examples/` (freeze before GitHub Pages URLs are set)
- [ ] Confirm `LICENSE` is referenced from `package.json` and README
- [ ] Add `.gitignore` entries for `node_modules`, `dist`, `.vscode`, etc.
- [ ] Add `.npmignore` or rely on the `files` field to control what ships

## 2. Build Pipeline

- [ ] Set up build script (sass + minify, or plain postcss + cssnano)
- [ ] Produce `spiral-grid.css` and `spiral-grid.min.css` in `dist/`
- [ ] Enforce < 2 KB gzipped target via `size-limit` (not eyeballed)
- [ ] CDN-friendly: works via unpkg / jsdelivr out of the box

## 3. Documentation

- [ ] Rewrite README as a user-facing guide (install, usage, API, browser compat)
- [ ] Add browser compatibility table for CSS `pow()` — double-check current
      Firefox behavior with `clip-path` before baking versions into docs
- [ ] Promote `doc/golden-ratio-spiral-grid.md` into `docs/math.md` (source
      already written — don't rewrite, just reframe for end-users)
- [ ] `docs/accessibility.md` covering reduced-motion, focus, rotated-content caveats
- [ ] `docs/recipes.md` (portfolio, hero, gallery, etc.)
- [ ] Framework snippets (React, Vue, Svelte)
- [ ] Add `CHANGELOG.md`

## 4. Examples & Demos

Showcase examples that demonstrate the system's visual potential. Each lives in
`examples/` and is surfaced on the GitHub Pages site; a CodePen/StackBlitz mirror
is linked from the README for frictionless "try it now".

- [ ] Photo gallery — images filling cells, spiral as natural focal hierarchy
- [ ] Portfolio / landing hero — featured project in cell 1, secondary work spiraling in
- [ ] Seamless multi-spiral — two spirals flowing together with images (no-gap vision)
- [ ] Dashboard cards — stats, charts, info panels at different scales
- [ ] Team / about page — hero team photo in cell 1, individual headshots spiraling in
- [ ] Deploy `examples/` as a live demo on GitHub Pages
- [ ] CodePen or StackBlitz link for the minimal "hello spiral" example

## 5. Quality & Testing

- [ ] Add stylelint config
- [ ] Geometry unit tests — assert each cell's transform, scale, clip-path, and
      padding match the derived math (catches fallback/`pow()` drift)
- [ ] Visual regression tests (e.g. Playwright screenshot comparisons)
- [ ] Cross-browser smoke test (at least Chrome, Safari, Firefox)
- [ ] Accessibility audit against the reduced-motion fallback

## 6. CI/CD

- [ ] GitHub Actions: lint + build + `size-limit` check on every PR
- [ ] GitHub Actions: publish to npm on version tag
- [ ] GitHub Pages deployment for the live demo

## 7. Community & Release

- [ ] `CONTRIBUTING.md`
- [ ] `CODE_OF_CONDUCT.md`
- [ ] Release workflow — tagging policy (e.g. `changesets`) + how `CHANGELOG.md` is updated
- [ ] Semver policy: `0.x` = API may shift, `1.0.0` = API freeze. Start at `0.1.0`.
- [ ] First npm publish

## 8. Post-1.0 / v2

Out of scope for the initial release; tracked here so they don't sneak into v1.

- [ ] Scroll-driven spiral zoom — `.spiral-grid--scroll-zoom` modifier using CSS
      Scroll-Driven Animations (`animation-timeline: view()`). Design notes in
      `doc/scroll-zoom.md`; working prototype in `prototype/scroll-zoom.html`.
- [ ] Infinite zoom (v2) — zoom into the convergence point to reveal nested
      spirals; companion package (`spiral-grid-navigator`). Same self-similarity
      math as scroll-driven zoom, different input (clicks/arrows vs scroll).
- [ ] Theming presets (utility-class color schemes)
- [ ] Interactive demo playground

---

**Order of operations:** 0 → 1 → 2 → 3 → 4 → 5 → 6 → 7. §8 is deliberately after release.
