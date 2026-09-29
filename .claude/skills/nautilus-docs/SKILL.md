---
name: nautilus-docs
description: Where things get written down in the Nautilus repo and in what form — decisions in the roadmap, findings docs with numbers, from-scratch concept docs, phase reviews, memory. Use when a decision is made, a research spike ends, a feature ships, a session ends, or the owner asks to "document this".
---

# nautilus-docs

The project stalled for a year once. The docs are what let it resume in an
afternoon. Four kinds, each with one job. Don't invent a fifth.

| Kind | File | Job | Written when |
|---|---|---|---|
| **Roadmap** | `doc/publish-roadmap.md` | Single source of truth for *what's next* and *what was decided*. Every decision is a `[x]` line with date + reasoning, in place — never a separate ADR. | The moment a decision is made. Same turn. |
| **Findings** | `doc/<topic>.md` (e.g. `grid-engine.md`, `infinite-zoom.md`) | What was tried, what was measured, what won and why. Tables of numbers. What lost and why (that's the valuable half). | When a research spike ends. |
| **Concept** | `doc/<idea>.md` (e.g. `shared-lines.md`, `tunnel.md`) | The idea explained from scratch for a junior dev. Diagrams, worked examples, one-sentence version at the end. No implementation details that will rot. | When the owner says "explain it like I'm a junior" and it clicks — write *that* explanation down, with the diagram that worked. |
| **Review** | `doc/review-<yyyy-mm>.md` | Handoff: state in one paragraph, timeline, artifacts, decisions, numbers, bugs-found-by-measuring, doc map, open items. | End of a phase or a long session. |

Plus: `README.md` is for users only (install, API, examples). Memory
(`~/.claude/projects/…/memory/`) holds only what's *not* derivable from the
repo: decisions are FINAL, the release is PAUSED at step N, owner
preferences.

## Rules

- **Decision → roadmap, same turn.** Tick the box, date it, one paragraph of
  why including the rejected alternatives. If it supersedes an earlier
  decision, say so in the new line; don't delete the old one.
- **Numbers, not adjectives.** "Reset is invisible" → "4 px of 252,800, SSIM
  0.99998". Findings docs and reviews carry the measurement and how it was
  taken.
- **Record what lost.** Nested-in-fill-cell, margin gap, wrapper animation —
  each looked right first. The doc says what it looked like, what the number
  was, and why.
- **Historical docs get a header, not a rewrite.** When an approach is
  replaced, add a `> **Historical …**` blockquote under the H1 pointing at
  the replacement. Keep the body.
- **Mechanical renames touch history too** (e.g. `.spiral-grid` →
  `.nautilus`); add an addendum in the current review noting that older docs
  now read the new name.
- **Every doc links its neighbours** (findings ↔ concept ↔ roadmap line).
- **Commit docs with the change they describe**, not later.

## Commit messages

Conventional: `feat`, `fix`, `docs`, `build`, `chore`, `test`; `!` for
breaking. Body says what and why, not how. No `Co-Authored-By` lines (owner
preference).
