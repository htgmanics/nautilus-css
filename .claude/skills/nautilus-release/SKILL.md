---
name: nautilus-release
description: Publish a Nautilus release to npm and GitHub — the runbook from doc/publish-roadmap.md §4 as ordered, confirmed steps (verify, version, publish, tag, smoke-test the CDN). Use when the owner says publish, release, ship 0.x, or asks where the release process stands.
---

# nautilus-release

The release is a sequence of public, hard-to-undo steps. **Confirm each
public step with the owner before running it.** State where we are before
doing anything: read `doc/publish-roadmap.md` §4 and report which boxes are
ticked.

## Preconditions (report, don't assume)

1. `git status` clean, on `main`, `main` == `origin/main`.
2. `npm test && npm run check:examples` green (see `nautilus-verify`).
3. `npm run build && npm run size` — under 2048 B gzipped; note the number.
4. `npm pack --dry-run` — expected files only: `LICENSE`, `README.md`,
   `dist/nautilus.css`, `dist/nautilus.min.css`, `react/index.js`,
   `react/index.d.ts`, `package.json`.
5. `npm view nautilus-grid version` → 404 for a first publish, else the
   current version.
6. `npm whoami` → the owner's account. If `ENEEDAUTH`, stop: the owner runs
   `npm login` themselves.
7. README install/CDN lines match the version about to ship.

## Steps

| # | Step | Public? |
|---|---|---|
| 1 | `npm version <patch\|minor\|major>` — bumps `package.json`, commits, tags `vX.Y.Z` | no |
| 2 | `npm publish` — `prepublishOnly` re-runs test → build → size | **yes** |
| 3 | `git push origin main --follow-tags` | **yes** |
| 4 | Smoke test: `curl -sI https://unpkg.com/nautilus-grid@X.Y.Z/dist/nautilus.min.css` → 200; open a blank HTML page with that `<link>` and one 5-cell spiral, headless, run the squares check | no |
| 5 | Tick the runbook in `doc/publish-roadmap.md`, add the version to `doc/review-*.md`, commit, push | yes |

Semver: `0.x` — API may change; `1.0.0` = freeze. First publish is `0.1.0`.

## If something goes wrong

- Publish succeeded but a file is wrong → `npm publish` a patch; never
  `npm unpublish` (72-hour window, and it breaks anyone who installed).
- Tag pushed to the wrong commit → `git tag -d`, `git push origin :refs/tags/vX.Y.Z`, re-tag. Only before anyone has fetched it.
- Name taken since last check → stop, back to the naming decision in the roadmap.
