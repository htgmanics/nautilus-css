# Publish Roadmap

Checklist for turning the prototype into a publishable CSS library.
For what has happened so far, read `doc/review-2026-09.md`.
This doc is the **single source of truth** for publish readiness — the Launch
Checklist in `doc/nautilus-library-sketch.md` defers to this list.

Restructured 2026-09-24 around a **minimal v0.1 milestone**: publish early at
`0.1.0` (0.x semver already says "early"), everything non-blocking moves to
post-0.1. Rationale: the project stalled for a year once; a scope wall is how
it stalls again. A live package motivates the rest.

---

## 0. Polish CSS & Finalize API — DONE

- [x] Finalize class names, modifiers, and custom properties (no renames after §1).
      API-freeze sweep done: rebranded `.fib-spiral` → `.nautilus`; renamed
      `--content-padding` → `--safe-zone`; namespaced `--i` →
      `--nautilus-index`; removed redundant `--width`/`--overflow`
      passthroughs; flipped `--transition` default to `none`; killed
      `--cell-bg`; moved phi/shrinkage to "internal, do not override."
- [x] Verify precomputed `pow()` fallback rules for cells 1–10 match the
      modern-browser `pow()` output. Script: `test/verify-fallback.mjs` —
      zero-dep. All 10 indices pass for both forward and reverse variants.
- [x] Cell scrolling — shipped as cell-level modifiers
      (`nautilus__content--scroll`, `--scroll-x`, `--scroll-y`).
      Stress-test at `examples/scroll.html`; design notes in
      `doc/cell-scrolling.md`. Spiral-level `--scrollable` with a depth cap
      was rejected.
- [x] Gap (`--nautilus-gap`) — resolved via `clip-path: inset()`; see
      `doc/gap-postmortem.md` "Resolved" section.

---

## Milestone v0.1 — first npm publish

Everything required to run `npm publish` at `0.1.0`. Nothing else blocks.

### 1. Package Structure

- [x] Decide package name — **`nautilus-grid`**, brand **Nautilus** (2026-09-29;
      npm-free). Supersedes `golden-nautilus` (2026-09-24). Reasoning:
      the project has a visual identity (the tunnel demo), and brand names
      win for those — "nautilus" is the picture people remember; "grid"
      carries the category for search and cold reads. Bare `nautilus` is
      taken on npm (abandoned 2022 package; a dispute would take 4+ weeks);
      `@scope/nautilus` bakes an org into every install line. Search intent
      ("golden ratio", "fibonacci", "spiral") is covered by description +
      keywords, which npm search indexes. GitHub repo was renamed to
      `nautilus-css` by the owner on 2026-09-29; rename once more to
      `nautilus-grid` to match.
- [x] Decide source language — **plain CSS, no SCSS ever.** The only meaningful
      SCSS variable (`$phi`) is explicitly frozen, so SCSS customization is a
      feature already rejected; the prototype is shipped-quality plain CSS; the
      build shrinks to a minify step + gzip size check. If the fallback tables ever need
      regenerating, a tiny Node script (extending `test/verify-fallback.mjs`)
      does it without a sass dependency.
- [x] Class prefix and filename — **`.nautilus` / `dist/nautilus.css`**
      (2026-09-29, superseding `.spiral-grid` / `spiral-grid.css`). One name
      across package, repo, class, custom properties and file. Shorter
      (`.nautilus__cell`, `--nautilus-gap`), collision-proof, and the
      inspector says which library. Done pre-publish because it's a breaking
      change after. Earlier reasoning ("file matches class prefix") still
      holds — both moved together.
- [x] Create `package.json` (name, version, license, exports, keywords, `files`)
- [x] Organise source into `src/` and build output into `dist/`
- [x] Rename `prototype/` → `examples/`; CSS moved to `src/nautilus.css` (examples link `../src/`)
- [x] Confirm `LICENSE` is referenced from `package.json` and README
- [x] `.gitignore` already covers `node_modules`, `dist`. `.vscode/settings.json`
      stays tracked on purpose (Live Preview default path → `examples/`).
- [x] Rely on the `files` field to control what ships

### 2. Build & Size

- [x] Set up build script — `npm run build`: copy to `dist/` + `lightningcss --minify` (one dev dep;
      minified output keeps both `@supports` paths, numbers rounded to ~6 sig. digits)
- [x] Produce `nautilus.css` and `nautilus.min.css` in `dist/`
- [x] Enforce < 2 KB gzipped target — `npm run size` (Node built-in zlib, no
      `size-limit` dep). **Measured: 1623 B** with fallback tables, so no
      modern-only split needed.
      Decision (2026-09-24): the pow() fallback tables stay in the main file —
      already written, verified by `test/verify-fallback.mjs`, and gzip
      compresses the repetitive rules well. Only if the size check fails do we
      split out a `nautilus.modern.css` (no fallback) — measure first,
      never delete working code for an unconfirmed size problem.
- [x] CDN-friendly: `unpkg` / `jsdelivr` fields point at the minified file

### 3. Minimum docs & demo

- [x] Rewrite README as a user-facing guide (install, usage, API table,
      browser compat note, reduced-motion behavior note). The sketch's API
      section is ~80% of this already.
- [x] Semver policy noted in README: `0.x` = API may shift, `1.0.0` = freeze

### 3½. Engine decision — OPEN (blocks release)

- [x] **Transform engine vs CSS Grid engine — grid engine shipped (2026-09-28).**
      Swap done: `src/nautilus.css` is the grid engine, transform engine in
      git history; `test/geometry.mjs` replaces the fallback verifier; examples
      ported; README updated; 933 B gzipped. Original note: Prototype
      `src/nautilus.grid.css` reproduces the layout with 0.02px parity,
      zoom works via container transform (≤0.08px over 3 steps), 179 lines
      / 869 B gz vs 490 / 1623 B, no `pow()`, no fallback tables, px inside
      cells are real px, `cqi` works per cell. Findings + feature mapping:
      `doc/grid-engine.md`; comparison page `examples/grid-prototype.html` (removed with the swap; git history).
      Recommendation: ship grid engine for v0.1. (Further evidence: the
      infinite-zoom prototype, `doc/infinite-zoom.md`, was built on it in an
      afternoon.) If accepted: replace
      `src/nautilus.css`, retire `test/verify-fallback.mjs`, port
      examples, update README (drop safe-zone / font-size-max / pow()
      notes; add `--hero-rotate`), re-run size check.

### 4. Release runbook — PAUSED (2026-09-24)

Package is built and committed locally; paused for pre-publish work. State
when paused: local `main` is ahead of `origin/main` (docs + scroll commits,
unpushed); scaffold lives on unpushed branch `feat/v0.1-package`.

Run in this order — each step is public and hard to undo, and later steps
depend on earlier URLs:

- [x] **Push** `main` and `feat/v0.1-package`; PR #3 open (2026-09-29)
- [ ] **Rename GitHub repo** `htgmanics/nautilus-css` → `nautilus-grid` (owner
      does it on GitHub). GitHub auto-redirects old URLs. Must happen before
      Pages so the demo URL is right the first time.
- [x] **Update `package.json`** `homepage` / `repository` / `bugs` URLs to
      `nautilus-grid` (done 2026-09-29)
- [x] Local remote points at `nautilus-grid`
- [x] **GitHub Pages** enabled 2026-09-29 from `main`, root. Demo at
      `https://htgmanics.github.io/nautilus-grid/examples/`; link in README.
- [x] Repo renamed `nautilus-css` → `nautilus-grid`; PR #3 merged (`62fc647`).
### 3¾. Pre-publish polish — PAUSED HERE (2026-09-29)

Owner halted `npm publish`: the package is built, Pages is live, but the
example pages are engineering test rigs, not a pitch. Before the first
publish, in this order:

- [ ] **Showcase examples** (highest leverage — the demo *is* the marketing).
      Candidates: rebuild the owner's portfolio (https://htgmanics.com/) on
      the grid; a minimal product-listing page. Replace or demote the current
      test-rig pages (`index/gap/scroll`) to a `examples/tests/` folder.
      *2026-09-29:* portfolio lives in its own private repo
      `htgmanics/htgmanics.com` (Next.js 16 App Router) — it's a real site,
      not an example page, and it tests the wrapper in Server Components,
      the most common adopter path. Consumes the package unpublished
      (`file:` link locally, `github:` dep once `prepare` is pushed) so API
      changes it forces land before 0.1.0. Other demos (product listing)
      use TanStack Start to show Nautilus outside Next.
- [ ] **Zoom exploration** — how far the infinite zoom (`tunnel.md`) and the
      scroll-driven zoom can go as showcase pieces; zoom-out; content types.
      *2026-09-30, from htgmanics.com About:* a one-step tunnel (outer
      spiral `noFill`, inner full-size spiral at φ⁴ in the wedge, click →
      both scale 1/φ⁴ about the eye, per-layer WAAPI) lands at 0.00 px both
      ways — `htgmanics.com/src/components/ZoomLayers.tsx`, ~90 lines. First
      concrete shape for a `<Tunnel>` / `useTunnel()`.
- [ ] **Docs pitfall (found 2026-09-30):** `cqi` in styles on the
      `.nautilus__cell` itself resolves against the *spiral* (an element
      can't query its own container); only descendants of `__cell` get the
      cell's width. Bit a `background-size: 23.5cqi` on a cell. README +
      `shared-lines.md` should say so.
- [x] **Adoption**: React wrapper shipped 2026-09-29 as `nautilus-grid/react`
      (`react/index.js` + `.d.ts`, `test/react.mjs`). Original scope: — `<Spiral reverse gap="8px">` / `<Cell scroll>`
      mapping props → the BEM classes and custom properties, enforcing the
      cell/content two-div structure. Typed props, no runtime logic, ~30
      lines + `.d.ts`. Plain `className` usage keeps working without it.
      Tailwind: dropped (2026-09-29). Svelte/Vue: same shape, later.
      *2026-09-30:* wrapper verified in Next 16 Server Components (forwardRef
      + createElement, no hooks) — htgmanics.com home, 4 spirals, 25 cells,
      all invariants hold. `github:` install works via `prepare`.

Then resume the runbook below.

- [ ] **Re-check npm name** `nautilus-grid` still free
      (`npm view nautilus-grid` → 404) — last checked 2026-09-29
- [ ] **`npm whoami`** — logged in as the intended account
- [ ] **`npm publish`** at `0.1.0` (`prepublishOnly` runs test → build →
      size check automatically). Then tag `v0.1.0` and push the tag.
- [ ] **Smoke-test** the CDN link from README in a blank HTML page

---

## Post-0.1 (0.2+, in rough priority order)

Deliberately NOT blocking the first publish.

### Documentation

- [ ] Browser compatibility table for CSS `pow()` — re-verify current Firefox
      behavior with `clip-path` before baking versions into docs
- [ ] Promote `doc/golden-ratio-nautilus.md` into `docs/math.md` (source
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

- [ ] Scroll-driven spiral zoom — `.nautilus--scroll-zoom` modifier using
      CSS Scroll-Driven Animations. Design notes in `doc/scroll-zoom.md`;
      working prototype in `examples/scroll-zoom.html`.
- [ ] Infinite zoom (v2) — **prototype works** (2026-09-28):
      `examples/infinite-zoom.html`, findings in `doc/infinite-zoom.md`.
      Stacked layers on the grid engine, lap steps, pure scale (no spin), forward-only; reset is
      pixel-invisible (6 px diff, SSIM 0.99998). Remaining: zoom out, reduced
      motion, packaging as a JS recipe/companion.
- [ ] Theming presets (utility-class color schemes)
- [ ] Interactive demo playground
