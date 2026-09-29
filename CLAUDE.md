# Nautilus (`nautilus-grid`)

Golden-spiral layout in pure CSS. One 6×6 CSS Grid: six φ-power tracks, ten
`grid-area` placements, last cell fills the eye. `.nautilus` / `__cell` /
`__content`; `--nautilus-*` custom properties. React wrapper in `react/`.
Infinite-zoom "tunnel" prototype in `examples/infinite-zoom.html`.

## Commands

- `npm test` — geometry invariants + React wrapper markup (pure node)
- `npm run check:examples` — every example headless: cells square, console clean, tunnel reset diff (needs `agent-browser`, ImageMagick)
- `npm run build && npm run size` — `dist/nautilus.css` + `.min.css`, must stay < 2048 B gzipped (currently ~920 B)

## Rules that came from bugs

- Never put margin/padding/border on `.nautilus__cell` — they feed track sizing and break the 1–2 px eye tracks. Gap is `clip-path` + `__content` padding.
- Never transform cells; zoom transforms the container about `--nautilus-eye`.
- No visual claim without a number. Measure with `agent-browser eval` + `compare`; see `nautilus-verify`.
- Chrome caches `file://` CSS across `reload` — `close` then `open`.

## Process

- Decisions go in `doc/publish-roadmap.md` the same turn they're made, with reasoning. It is the single source of truth for what's next.
- Docs: roadmap / findings / concept / review — see `nautilus-docs`.
- Public steps (push, rename, Pages, publish) — confirm with the owner first. Release runbook: `nautilus-release`.
- New example pages follow `nautilus-example`.
- Commits: conventional (`feat`, `fix`, `docs`, `test`, `build`, `chore`, `!` for breaking). No `Co-Authored-By` lines.
- The owner directs all design/aesthetics; do not suggest design skills.

## Where to read first

`doc/review-2026-09.md` (state + handoff) → `doc/publish-roadmap.md` (next) →
`doc/shared-lines.md` (the engine, from scratch) → `doc/tunnel.md` (the zoom).
