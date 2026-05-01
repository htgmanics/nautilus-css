#!/usr/bin/env node
/**
 * Verify that the precomputed `@supports not (pow())` fallback rules in
 * prototype/spiral-grid.css match the math produced by the modern
 * `pow(phi, i)` path.
 *
 * Run: `node test/verify-fallback.mjs`
 *
 * Exit code 0 = all checks pass, 1 = drift detected.
 *
 * No dependencies. Designed to be copied into the library's test suite
 * verbatim once the package is scaffolded.
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const CSS_PATH = process.argv[2]
    ? resolve(process.cwd(), process.argv[2])
    : resolve(__dirname, "..", "prototype", "spiral-grid.css");
const CSS = readFileSync(CSS_PATH, "utf8");

// ---- Source of truth: phi = (√5 − 1) / 2 ------------------------------
const PHI = (Math.sqrt(5) - 1) / 2;
const MAX_FONT_REM = 8; // --spiral-grid-font-size-max
const N = 10; // supported cell count

// Per-field tolerances reflect each table's authored precision.
// These are intentionally not uniform: the CSS rounds scale/coeff to 6
// decimals and font-size to 3 decimals, and we want the tolerance to
// flag true math regressions, not stylistic rounding choices.
const TOL = {
    scale: 1e-5,         // scales rounded to 6 decimals
    rotate: 1e-9,        // exact integer degrees
    fontSize: 1e-3,      // font-size rounded to 3 decimals
    coeff: 1e-4,         // clip/padding coefficients rounded to 6 decimals
                         //   (larger absolute room because values grow to ~76)
};

// ---- Expected values --------------------------------------------------
function expected(i) {
    const scale = Math.pow(PHI, i);
    const inv = 1 / scale; // == pow(phi, -i)
    const rotDeg = 90 * i;
    return {
        i,
        scale,                                         // cell scale
        rotate: rotDeg,                                // cell rotate, forward
        rotateReverse: -rotDeg,                        // cell rotate, reverse
        contentRotate: -rotDeg,                        // content rotate, forward
        contentRotateReverse: rotDeg,                  // content rotate, reverse
        fontSize: Math.min(inv, MAX_FONT_REM),         // capped
        coeff: inv,                                    // clip & padding share this
    };
}

// ---- Parser -----------------------------------------------------------
// Extract the @supports not (...) block, then match every
// .spiral-grid__cell:nth-child(N) rule inside it.
function sliceFallbackBlock() {
    const markerRe = /@supports not \(width: calc\(pow\(2, 3\) \* 1px\)\) \{/g;
    const results = [];
    let m;
    while ((m = markerRe.exec(CSS)) !== null) {
        const start = m.index + m[0].length;
        let depth = 1;
        let idx = start;
        while (depth > 0 && idx < CSS.length) {
            const ch = CSS[idx];
            if (ch === "{") depth++;
            else if (ch === "}") depth--;
            idx++;
        }
        results.push(CSS.slice(start, idx - 1));
    }
    return results.join("\n");
}

const FALLBACK = sliceFallbackBlock();
if (!FALLBACK) {
    console.error("Could not find @supports not (pow()) fallback block in CSS.");
    process.exit(2);
}

// Match rules like:
//   .spiral-grid__cell:nth-child(3) { transform: scale(0.381966) rotate(180deg); }
// Reverse-aware: returns { reverse, n, scale, rotate }.
function extractCellTransforms() {
    const re = /(\.spiral-grid--reverse\s+)?\.spiral-grid__cell:nth-child\((\d+)\)\s*\{\s*transform:\s*scale\(([^)]+)\)\s*rotate\((-?\d+(?:\.\d+)?)deg\)\s*;\s*\}/g;
    const rows = [];
    let m;
    while ((m = re.exec(FALLBACK)) !== null) {
        rows.push({
            reverse: Boolean(m[1]),
            i: Number(m[2]) - 1,
            scale: Number(m[3]),
            rotate: Number(m[4]),
        });
    }
    return rows;
}

// Match content rules like:
//   .spiral-grid__cell:nth-child(3) .spiral-grid__content { transform: rotate(-180deg); font-size: 2.618rem; }
// Reverse-aware. font-size is optional (reverse variant omits it).
function extractContentRules() {
    const re = /(\.spiral-grid--reverse\s+)?\.spiral-grid__cell:nth-child\((\d+)\)\s+\.spiral-grid__content\s*\{\s*transform:\s*rotate\((-?\d+(?:\.\d+)?)deg\)\s*;(?:\s*font-size:\s*([\d.]+)rem\s*;)?\s*\}/g;
    const rows = [];
    let m;
    while ((m = re.exec(FALLBACK)) !== null) {
        rows.push({
            reverse: Boolean(m[1]),
            i: Number(m[2]) - 1,
            contentRotate: Number(m[3]),
            fontSize: m[4] !== undefined ? Number(m[4]) : null,
        });
    }
    return rows;
}

// Match clip-path rules like:
//   .spiral-grid__cell:nth-child(3) { clip-path: inset(calc(var(--spiral-grid-gap) / 2 * 2.618034)); }
function extractClipCoeffs() {
    const re = /\.spiral-grid__cell:nth-child\((\d+)\)\s*\{\s*clip-path:\s*inset\(calc\(var\(--spiral-grid-gap\)\s*\/\s*2\s*\*\s*([\d.]+)\)\)\s*;\s*\}/g;
    const rows = [];
    let m;
    while ((m = re.exec(FALLBACK)) !== null) {
        rows.push({ i: Number(m[1]) - 1, coeff: Number(m[2]) });
    }
    return rows;
}

// Match padding rules like:
//   .spiral-grid__cell:nth-child(3)  .spiral-grid__content { padding: calc(var(--spiral-grid-safe-zone) * 2.618034); }
function extractPaddingCoeffs() {
    const re = /\.spiral-grid__cell:nth-child\((\d+)\)\s+\.spiral-grid__content\s*\{\s*padding:\s*calc\(var\(--spiral-grid-safe-zone\)\s*\*\s*([\d.]+)\)\s*;\s*\}/g;
    const rows = [];
    let m;
    while ((m = re.exec(FALLBACK)) !== null) {
        rows.push({ i: Number(m[1]) - 1, coeff: Number(m[2]) });
    }
    return rows;
}

// ---- Diff engine ------------------------------------------------------
const failures = [];

function check(label, actual, expected, tol, meta = {}) {
    const diff = Math.abs(actual - expected);
    const pass = diff <= tol;
    if (!pass) {
        failures.push({ label, actual, expected, diff, tol, ...meta });
    }
    return pass;
}

function fmt(n) {
    if (!Number.isFinite(n)) return String(n);
    return n.toFixed(8).replace(/0+$/, "").replace(/\.$/, "");
}

// ---- Run all checks ---------------------------------------------------
const cellRows = extractCellTransforms();
const contentRows = extractContentRules();
const clipRows = extractClipCoeffs();
const padRows = extractPaddingCoeffs();

// Sanity: we expect 10 forward + 10 reverse for cell transforms & content.
// We expect 10 clip + 10 padding (forward only; reverse inherits).
function countWarn(name, arr, want) {
    if (arr.length !== want) {
        console.warn(`⚠️  ${name}: parsed ${arr.length} rows, expected ${want}`);
    }
}
countWarn("cell transforms", cellRows, N * 2);
countWarn("content rules", contentRows, N * 2);
countWarn("clip coeffs", clipRows, N);
countWarn("padding coeffs", padRows, N);

for (let i = 0; i < N; i++) {
    const e = expected(i);

    const fwd = cellRows.find((r) => r.i === i && !r.reverse);
    const rev = cellRows.find((r) => r.i === i && r.reverse);
    const fwdC = contentRows.find((r) => r.i === i && !r.reverse);
    const revC = contentRows.find((r) => r.i === i && r.reverse);
    const clip = clipRows.find((r) => r.i === i);
    const pad = padRows.find((r) => r.i === i);

    if (fwd) {
        check(`cell[${i}] forward scale`,   fwd.scale,   e.scale,          TOL.scale);
        check(`cell[${i}] forward rotate`,  fwd.rotate,  e.rotate,         TOL.rotate);
    } else failures.push({ label: `cell[${i}] forward transform: MISSING` });

    if (rev) {
        check(`cell[${i}] reverse scale`,   rev.scale,   e.scale,          TOL.scale);
        check(`cell[${i}] reverse rotate`,  rev.rotate,  e.rotateReverse,  TOL.rotate);
    } else failures.push({ label: `cell[${i}] reverse transform: MISSING` });

    if (fwdC) {
        check(`content[${i}] forward rotate`, fwdC.contentRotate, e.contentRotate,        TOL.rotate);
        if (fwdC.fontSize !== null) {
            check(`content[${i}] font-size`,  fwdC.fontSize,      e.fontSize,              TOL.fontSize);
        } else if (i < 10) {
            failures.push({ label: `content[${i}] font-size: MISSING` });
        }
    } else failures.push({ label: `content[${i}] forward rule: MISSING` });

    if (revC) {
        check(`content[${i}] reverse rotate`, revC.contentRotate, e.contentRotateReverse, TOL.rotate);
    } else failures.push({ label: `content[${i}] reverse rule: MISSING` });

    if (clip) {
        check(`clip[${i}] coefficient`, clip.coeff, e.coeff, TOL.coeff);
    } else failures.push({ label: `clip[${i}] coefficient: MISSING` });

    if (pad) {
        check(`padding[${i}] coefficient`, pad.coeff, e.coeff, TOL.coeff);
    } else failures.push({ label: `padding[${i}] coefficient: MISSING` });
}

// ---- Report -----------------------------------------------------------
const GREEN = "\x1b[32m";
const RED = "\x1b[31m";
const DIM = "\x1b[2m";
const RESET = "\x1b[0m";

console.log("");
console.log("Spiral Grid — fallback vs pow() math verification");
console.log("phi =", PHI);
console.log("");

// Summary table (i, scale, rotate, font-size, coeff) — always printed.
console.log(`${DIM}idx   scale        rotate   font-size    coeff${RESET}`);
for (let i = 0; i < N; i++) {
    const e = expected(i);
    console.log(
        `  ${i}   ${fmt(e.scale).padEnd(10)}   ${String(e.rotate).padStart(4)}°   ` +
        `${fmt(e.fontSize).padEnd(8)}rem   ${fmt(e.coeff)}`
    );
}
console.log("");

if (failures.length === 0) {
    console.log(`${GREEN}✓ All ${N} indices match (scale, rotate, content-rotate, font-size, clip coeff, padding coeff; forward + reverse).${RESET}`);
    process.exit(0);
} else {
    console.log(`${RED}✗ ${failures.length} discrepancies:${RESET}`);
    for (const f of failures) {
        if (f.actual === undefined) {
            console.log(`  ${RED}•${RESET} ${f.label}`);
        } else {
            console.log(
                `  ${RED}•${RESET} ${f.label}: ` +
                `got ${fmt(f.actual)}, expected ${fmt(f.expected)} ` +
                `(diff ${f.diff.toExponential(2)}, tol ${f.tol.toExponential(0)})`
            );
        }
    }
    process.exit(1);
}
