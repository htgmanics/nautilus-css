# Publish Roadmap

Checklist for turning the prototype into a publishable CSS library.
Work through these **after** the core CSS is polished and the API is stable.

---

## 1. Package Structure

- [ ] Create `package.json` (name, version, license, exports, keywords)
- [ ] Organise source into `src/` and build output into `dist/`
- [ ] Add `.gitignore` (node_modules, dist, .vscode, etc.)
- [ ] Add `.npmignore` or use `files` field to control what ships to npm

## 2. Build Pipeline

- [ ] Set up build script (sass + minify, or plain postcss + cssnano)
- [ ] Produce `spiral-grid.css` and `spiral-grid.min.css` in `dist/`
- [ ] Verify < 2 KB gzipped target
- [ ] CDN-friendly: works via unpkg / jsdelivr out of the box

## 3. Documentation

- [ ] Rewrite README as a user-facing guide (install, usage, API, browser compat)
- [ ] Add browser compatibility table (CSS `pow()`: Chrome 111+, Safari 16.4+, Firefox 118+)
- [ ] Add framework snippets (React, Vue, Svelte)
- [ ] Deploy prototype as a live demo on GitHub Pages
- [ ] Add CHANGELOG.md

## 3b. Real-Life Demos

Showcase examples that demonstrate the system's visual potential:

- [ ] Photo gallery — images filling cells, spiral as natural focal hierarchy
- [ ] Portfolio / landing hero — featured project in cell 1, secondary work spiraling in
- [ ] Seamless multi-spiral — two spirals flowing together with images (no-gap vision)
- [ ] Dashboard cards — stats, charts, info panels at different scales
- [ ] Team / about page — hero team photo in cell 1, individual headshots spiraling in

## 3c. Feature Branches

- [ ] Scrollable content — `fib-spiral__content--scroll`, `--scroll-x`, `--scroll-y` modifiers. Design notes in `doc/cell-scrolling.md` (builds on the auto safe-zone introduced with `--fib-spiral-gap` to keep scrollbars clear of the clip).
- [x] Gap (`--fib-spiral-gap`) — see `doc/gap-postmortem.md` for prior research (resolved via `clip-path: inset()`; see "Resolved" section)
- [ ] Scroll-driven spiral zoom — `.fib-spiral--scroll-zoom` modifier using CSS Scroll-Driven Animations (`animation-timeline: view()`) to zoom into the convergence point as the reader scrolls. Design notes in `doc/scroll-zoom.md`; working prototype in `prototype/scroll-zoom.html`. Shares transform math with the infinite-zoom navigator (below).
- [ ] Infinite zoom (v2) — zoom into the convergence point to reveal nested spirals; companion package (`fib-spiral-navigator`). Same self-similarity math as scroll-driven zoom, different input (clicks/arrows instead of scroll).

## 4. Quality & Testing

- [ ] Add stylelint config
- [ ] Visual regression tests (e.g. Playwright screenshot comparisons)
- [ ] Cross-browser smoke test (at least Chrome, Safari, Firefox)
- [ ] Accessibility audit against the reduced-motion fallback

## 5. CI/CD

- [ ] GitHub Actions: lint + build + size check on every PR
- [ ] GitHub Actions: publish to npm on version tag
- [ ] GitHub Pages deployment for the live demo

## 6. Community

- [ ] CONTRIBUTING.md
- [ ] Semver tagging (start at 0.1.0)
- [ ] npm publish

---

**Order of operations:** Polish CSS -> 1 -> 2 -> 3 -> 4 -> 5 -> 6
