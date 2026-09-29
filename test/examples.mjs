#!/usr/bin/env node
/**
 * Measured checks on every example page, headless. The CSS equivalent of a
 * test suite: a layout bug here is a number, not an opinion.
 *
 *   1. every examples/*.html: every non-fill .nautilus__cell is square
 *      (|w − h| ≤ 0.6px) and the console has no errors
 *   2. infinite-zoom.html: freeze at lap end, commit, screenshot before and
 *      after — the reset must be pixel-invisible (≤ 10 differing pixels)
 *
 * Needs the `agent-browser` CLI and ImageMagick `compare` on PATH.
 * Run: `npm run check:examples`. Exit 1 on any failure.
 */
import { execFileSync } from "node:child_process";
import { readdirSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const EXAMPLES = join(ROOT, "examples");
const TMP = mkdtempSync(join(tmpdir(), "nautilus-"));
const ab = (...args) => execFileSync("agent-browser", args, { encoding: "utf8" }).trim();
// agent-browser prints the eval result JSON-encoded; our snippets return a JSON string, so parse twice.
const evalIn = (js) => { const v = JSON.parse(ab("eval", js)); return typeof v === "string" ? JSON.parse(v) : v; };
let fails = 0;
const check = (ok, msg) => { console.log(`${ok ? "✓" : "✗"} ${msg}`); if (!ok) fails++; };

for (const tool of ["agent-browser", "compare"]) {
  try { execFileSync("which", [tool]); } catch { console.error(`✗ needs \`${tool}\` on PATH`); process.exit(1); }
}

const SQUARES = `(() => {
  const bad = [];
  document.querySelectorAll(".nautilus").forEach((g, gi) => {
    const cells = [...g.querySelectorAll(":scope > .nautilus__cell")];
    const fill = g.classList.contains("nautilus--no-fill") ? null : cells[cells.length - 1];
    cells.forEach((c, i) => {
      const r = c.getBoundingClientRect();
      if (c !== fill && r.width > 0 && Math.abs(r.width - r.height) > 0.6) bad.push(gi + ":" + i + ":" + r.width.toFixed(1) + "x" + r.height.toFixed(1));
    });
  });
  return JSON.stringify({ spirals: document.querySelectorAll(".nautilus").length, bad });
})()`;

try {
  ab("close");
} catch {}
for (const file of readdirSync(EXAMPLES).filter((f) => f.endsWith(".html")).sort()) {
  ab("open", `file://${join(EXAMPLES, file)}`);
  ab("set", "viewport", "1100", "900");
  ab("wait", "1200");
  const { spirals, bad } = evalIn(SQUARES);
  check(bad.length === 0, `${file}: ${spirals} spirals, all cells square${bad.length ? " — NOT: " + bad.join(" ") : ""}`);
  const errors = (() => { try { return ab("console").split("\n").filter((l) => /error/i.test(l)); } catch { return []; } })();
  check(errors.length === 0, `${file}: console clean${errors.length ? " — " + errors[0] : ""}`);

  if (file === "infinite-zoom.html") {
    ab("set", "viewport", "1000", "700");
    ab("eval", "__test.freezeAtLapEnd(); 1");
    ab("wait", "600");
    ab("screenshot", "#stage", join(TMP, "before.png"));
    ab("eval", "__test.commit(); 1");
    ab("wait", "600");
    ab("screenshot", "#stage", join(TMP, "after.png"));
    let diff = 0;
    try { execFileSync("compare", ["-metric", "AE", "-fuzz", "8%", join(TMP, "before.png"), join(TMP, "after.png"), "null:"], { stdio: "pipe" }); }
    catch (e) { diff = parseInt(String(e.stderr), 10); } // compare exits 1 when images differ
    check(diff <= 10, `infinite-zoom.html: reset diff ${diff} px (limit 10)`);
  }
}
ab("close");

if (fails) { console.error(`\n${fails} check(s) failed`); process.exit(1); }
console.log("\n✓ examples: every cell square, consoles clean, tunnel reset invisible");
