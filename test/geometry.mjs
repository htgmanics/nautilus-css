#!/usr/bin/env node
/**
 * Geometry check for src/spiral-grid.css (the CSS Grid engine).
 *
 * The engine is six track sizes + ten grid-area placements. This verifies,
 * with no browser:
 *   1. the tracks are φ, φ⁵, φ⁹, φ¹⁰, φ⁷, φ³ and sum to 1
 *   2. every non-fill cell's grid-area is a square of side φ^i (container = 1 × φ)
 *   3. every fill cell's grid-area is a golden rectangle, long side φ^(N−1),
 *      landscape for odd N and portrait for even N
 *   4. the eye constant equals φ / (1 − φ⁴)
 *
 * Run: `node test/geometry.mjs`. Exit 1 on any drift.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const CSS = readFileSync(resolve(dirname(fileURLToPath(import.meta.url)), "..", "src", "spiral-grid.css"), "utf8");
const PHI = (Math.sqrt(5) - 1) / 2;
const TOL = 1e-6;
let fails = 0;
const check = (ok, msg) => { if (!ok) { fails++; console.error("✗", msg); } };

// 1. tracks
const tracks = CSS.match(/--spiral-grid-tracks:\s*([^;]+);/)[1].trim().split(/\s+/).map(parseFloat);
const powers = [1, 5, 9, 10, 7, 3];
check(tracks.length === 6, `expected 6 tracks, got ${tracks.length}`);
tracks.forEach((t, i) => check(Math.abs(t - Math.pow(PHI, powers[i])) < TOL, `track ${i + 1}: ${t} ≠ φ^${powers[i]}`));
check(Math.abs(tracks.reduce((a, b) => a + b, 0) - 1) < TOL, "tracks do not sum to 1");

// line positions: x in [0,1], y in [0,φ] (rows are the same ratios × φ)
const lines = tracks.reduce((acc, t) => [...acc, acc[acc.length - 1] + t], [0]);
const x = (line) => lines[line - 1];
const y = (line) => lines[line - 1] * PHI;

// 2. squares
const areaRe = /\.spiral-grid__cell:nth-child\((\d+)\)\s*\{\s*grid-area:\s*(\d+)\s*\/\s*(\d+)\s*\/\s*(\d+)\s*\/\s*(\d+)/g;
let m, n = 0;
while ((m = areaRe.exec(CSS))) {
  const [, i, r0, c0, r1, c1] = m.map(Number);
  const w = x(c1) - x(c0), h = y(r1) - y(r0);
  check(Math.abs(w - h) < TOL, `cell ${i}: area ${w.toFixed(6)} × ${h.toFixed(6)} is not square`);
  check(Math.abs(w - Math.pow(PHI, i)) < TOL, `cell ${i}: side ${w.toFixed(6)} ≠ φ^${i}`);
  n++;
}
check(n === 10, `expected 10 cell placements, found ${n}`);

// 3. fill cells
const fillRe = /nth-child\((\d+)\):nth-last-child\(1 of \.spiral-grid__cell\)\s*\{\s*grid-area:\s*(\d+)\s*\/\s*(\d+)\s*\/\s*(\d+)\s*\/\s*(\d+)/g;
n = 0;
while ((m = fillRe.exec(CSS))) {
  const [, N, r0, c0, r1, c1] = m.map(Number);
  const w = x(c1) - x(c0), h = y(r1) - y(r0);
  const long = Math.max(w, h), short = Math.min(w, h);
  check(Math.abs(short / long - PHI) < TOL, `fill ${N}: ${w.toFixed(6)} × ${h.toFixed(6)} is not golden`);
  check(Math.abs(long - Math.pow(PHI, N - 1)) < TOL, `fill ${N}: long side ${long.toFixed(6)} ≠ φ^${N - 1}`);
  check((N % 2 === 1) === (w > h), `fill ${N}: wrong orientation`);
  n++;
}
check(n === 10, `expected 10 fill placements, found ${n}`);

// 4. eye
const eye = parseFloat(CSS.match(/--spiral-grid-eye:\s*([\d.]+)%/)[1]) / 100;
check(Math.abs(eye - PHI / (1 - Math.pow(PHI, 4))) < TOL, `eye ${eye} ≠ φ/(1−φ⁴)`);

if (fails) { console.error(`\n${fails} check(s) failed`); process.exit(1); }
console.log("✓ geometry: 6 tracks sum to 1, 10 cells square, 10 fill cells golden, eye at φ/(1−φ⁴)");
